# Andhra Circle (JNTU Circle) - Threat Model

Last reviewed: 2026-11-08
Scope: `andhra-circle-backend` (Express + MongoDB), `andhra-circle-frontend` (React/Vite).
Method: manual code review of every route, controller, middleware, upload config and the
frontend token/role handling, followed by fixes. Nothing here was tested against a live
server; the self-check script and the helper functions were tested on sample inputs.

This file is a living document. The goal is to find problems **before users do**:
read section 6, run `npm run security:check` before every release, and update the
tables when something changes.

---

## 1. What we protect (assets)

| Asset | Why it matters |
|---|---|
| Admin accounts / login tokens | An admin can publish, edit and delete every resource and manage users |
| Student accounts (name, email, password hash) | Personal data; password reuse makes leaks worse |
| Commenter and uploader emails | Private; the site promises they are not shown publicly |
| Notes, papers, syllabus, notifications | The product itself. Wrong or deleted content hurts every student |
| Server files (`.env`, `uploads/`) | `.env` holds the database password, email key and token secret |
| Server and database availability | Students rely on it during exam weeks |
| The site's reputation | Hosted malware or fake notices under the JNTU Circle name |

## 2. Who might attack (actors)

| Actor | Typical goal | Skill |
|---|---|---|
| Curious student | Edit or delete content, give themselves admin | Low (browser dev tools) |
| Spammer / bot | Fill comments, uploads and counters with junk | Low (scripts) |
| Rival or prankster | Deface notices, post fake exam news | Low-medium |
| Opportunistic attacker | Steal accounts, host malware, reach internal servers | Medium (automated scanners) |
| Insider mistake | Leak `.env`, delete the last admin, push secrets to GitHub | n/a |

## 3. Trust boundaries (where untrusted data enters)

```
Browser (untrusted)  --HTTP-->  Express API  --->  MongoDB Atlas
   |                              |  \--->  uploads/ folder (served publicly)
   |                              |  \--->  EmailJS (reset emails)
   |                              \------>  Any URL given to /proxy-pdf   <-- risky
   \--- localStorage holds the login token
```

Everything in the browser can be forged, including the `role` stored in localStorage.
**Only the server's checks count.** Admin routes use `middleware/auth.js`, which verifies the
token and re-reads the user's role from the database on every request (good).

## 4. Findings and status

Severity: **Critical** = anyone on the internet can do serious damage today. **High** = serious
damage with little effort. **Medium** = needs effort or limited impact. **Low** = hardening.

### Fixed in this review

| ID | Sev | Risk found | Fix |
|---|---|---|---|
| T1 | Critical | `POST/PUT/DELETE /api/notifications` and `POST /sync` needed **no login**: anyone could publish fake exam notices or delete all notices | Admin-only (`auth`). Public `GET /sync` kept (the Notifications page uses it) and throttled |
| T2 | High | Anyone could delete any comment (`DELETE /api/comments/:id`) | Admin-only |
| T3 | High | Register returned the new user **including the password hash** | Returns only id, name, email, role |
| T4 | High | `JWT_SECRET` was a guessable phrase: anyone could forge an admin token and own the site | Replaced with a random 96-character secret. Server now warns on a weak secret, and refuses to start in production. **All users were logged out once** |
| T5 | High | Password-reset links and tokens were printed in the server console: anyone with log access could take over accounts | Logging removed |
| T6 | High | `/api/notifications/proxy-pdf` fetched **any URL** for anyone (SSRF): could probe `localhost`, the database port and cloud metadata addresses | New `services/safeFetch.js`: only http/https on ports 80/443, blocks private/loopback/link-local/IPv6-mapped addresses, re-checks every redirect, 15 s timeout, 25 MB cap, rate limited |
| T7 | Medium | Login and forgot-password revealed which emails are registered ("User not found") | One generic answer for both cases |
| T8 | Medium | No brute-force or flood protection on login, register, reset, comments or the public upload | In-memory rate limits: 10 failed logins / 15 min / IP (successful logins do not count), 10 sign-ups or reset requests / hour, 10 comments / 10 min, 10 uploads / hour, 600 requests / minute overall |
| T9 | Medium | Upload filename extension came from the user's file name, so an `.html` file declared as PDF would be served as a web page on your domain (stored XSS) | Extension now comes from the checked content type; `/uploads` sends `nosniff` and forces download of anything that is not PDF/image |
| T10 | Medium | Comments API returned every commenter's **email** to everyone, contradicting the page text "Your email will not be displayed publicly" | Email removed from all public comment responses |
| T11 | Medium | Request fields could be objects (`{"$ne": null}`): NoSQL operator injection in login, forgot-password and comments | Fields must be strings; lengths limited |
| T12 | Medium | Manage Users **could not change roles or delete users at all** (routes were registered as `//role` and `/` instead of `/:id/role` and `/:id`). Fails closed, but admin tools were broken | Routes fixed. An admin can no longer change their own role or delete themselves (prevents lock-out) |
| T13 | Low | No basic security headers, `X-Powered-By: Express` advertised, 100 KB default body | `nosniff`, `Referrer-Policy`, `Permissions-Policy`; header removed; 1 MB JSON limit |
| T14 | Low | CORS allowed every website | Set `CORS_ORIGINS` in `.env` to restrict (left open by default so local and phone testing keep working) |
| T15 | Low | Passwords only needed to exist | Register/reset now require 8-128 characters; valid email format |

### Still open (needs your action or a larger change)

| ID | Sev | Risk | What to do |
|---|---|---|---|
| O1 | High | `andhra-circle-backend/.env` holds the **MongoDB Atlas password** and the **EmailJS private key** in plain text. They were read during this review | Rotate both now (Atlas: Database Access > edit user; EmailJS: Account > API keys). In Atlas > Network Access remove `0.0.0.0/0` if present. Confirm `.env` was never committed (`security:check` tests this best-effort) |
| O2 | Medium | The login token is stored in `localStorage` for 7 days and cannot be revoked. Any XSS bug steals admin access | Move to an `httpOnly` cookie and shorten the lifetime (frontend and backend change) |
| O3 | Medium | Likes, views and downloads are public and unlimited per person, so counts can be inflated | Remember one like per device (localStorage + server dedupe) |
| O4 | Medium | The public "Upload Materials" form puts unreviewed PDFs under your domain's `/uploads` | Add an approved/pending flag and only show approved files; scan or manually open before publishing |
| O5 | Medium | The JNTUA sync **deletes every notification that is not B.Tech**, including ones an admin created on purpose | Change it to only delete items it created itself (`externalId` set) |
| O6 | Medium | `package.json` lists an unused package named `j` (a spreadsheet CLI with its own dependency tree) | `npm uninstall j`, then `npm audit` |
| O7 | Medium | `EMAILJS_SERVICE_ID` is missing from `.env`, so password-reset emails currently cannot be sent | Add it from your EmailJS dashboard |
| O8 | Low | No HTTPS enforcement / HSTS in the app | Deploy behind HTTPS (Render, Vercel, Nginx...). Then uncomment `app.set("trust proxy", 1)` in `server.js` so rate limits see real visitor IPs |
| O9 | Low | Many controllers still return raw `error.message` (database details) to the browser | Replace with generic messages, keep details in the server log |
| O10 | Low | No record of who did what (no admin audit log) | Log admin create/edit/delete actions with user id and time |
| O11 | Low | `safeFetch` checks the address, then `fetch` resolves DNS again (DNS rebinding window) | Acceptable for now; close it with a pinned-IP agent if the proxy becomes high-value |
| O12 | Info | Rate limits live in server memory: reset on restart, not shared across several servers | Use Redis + `express-rate-limit` if you scale to multiple instances |

## 5. Attack walk-throughs (what we asked "what could go wrong?")

1. **Fake exam notice.** Attacker calls `POST /api/notifications` with a fake timetable. Before: worked. Now: 401 without an admin token.
2. **Become admin.** Attacker guesses `JWT_SECRET`, signs a token with `role: admin`. Before: possible. Now: secret is random and 96 characters.
3. **Steal the database via the PDF proxy.** Attacker asks the proxy for `http://localhost:27017/` or `http://169.254.169.254/`. Now: blocked before any request leaves the server.
4. **Account takeover from logs.** Someone with hosting-log access copies a reset link. Now: links are never logged.
5. **Defacement through upload.** Attacker uploads `x.html` with a PDF content type. Now: stored as `.pdf`; browsers will not treat it as a web page.
6. **Mass guessing of passwords.** Bot tries thousands of logins. Now: blocked after 10 failures per 15 minutes per IP.
7. **Email harvesting.** Scraper reads every commenter's email. Now: not returned.

## 6. How to keep finding risks before users do

**Before every release (2 minutes):**

```
cd andhra-circle-backend
npm run security:check
```

It exits with an error if it finds a HIGH problem. It checks:
- any route that changes data without `auth` (outside a short allow-list of intentionally public ones)
- weak or missing `JWT_SECRET`, `.env` not ignored by git or tracked by git
- tokens, passwords or reset links written to logs
- uploaded files that are not PDF/image
- the unused `j` package and `npm audit` results (needs internet)

**When you add a new endpoint, answer these four questions:**
1. Who may call it: anyone, any logged-in student, or admin only? Add `auth` for admin.
2. What does it accept? Strings only? Maximum lengths? Files: which types and sizes?
3. What does it return? Never emails, password hashes, tokens or database errors.
4. What if a bot calls it 1,000 times? Does it need a rate limit?

If the new route is public on purpose, add it to `INTENTIONALLY_PUBLIC` in `scripts/security-check.js` so the check stays quiet and the decision is written down.

**Every month:** run `npm audit`, review open items above, rotate any secret that was shared, and read the server log for repeated 401/403/429 responses (that is someone probing you).

**Before going live:** set `NODE_ENV=production`, set `CORS_ORIGINS` to your real site address, serve over HTTPS, then uncomment `trust proxy`.

## 7. What was NOT verified

- The server was not started and the website was not clicked through after these changes. After restarting the backend, please test: student login, wrong-password message, admin login, upload a note, publish and delete a notification as admin, change a user's role, open a note's PDF, leave a comment.
- Logged-in browsers must sign in again (the token secret changed).
- Registration now requires an 8+ character password; check that the Register page's own hint matches.
- Frontend code was only checked for secrets, XSS sinks (`dangerouslySetInnerHTML`, `innerHTML`: none found) and how it calls the changed endpoints.
- Hosting, DNS, Atlas settings and backups are outside this repository and were not reviewed.
