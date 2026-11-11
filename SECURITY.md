# SECURITY.md

**Status:** ACTIVE | **Owner:** JNTU Circle Core Security Engineering | **Reviewed:** 2026-11-08  
**Scope:** Full repository (`andhra-circle-backend`, `andhra-circle-frontend`, automated services, dependencies)

---

## Non-Negotiable Rules

1. **No Hard-Coded Secrets:** Never commit secrets, API keys, database passwords, private keys, or tokens to version control. Never echo secrets into logs, prompts, URLs, or client-side bundles.
2. **Server-Side Input Validation:** Validate every incoming request on the server. Coerce variables into explicit primitive types (strings/numbers), enforce maximum lengths, check email formats, and sanitize against NoSQL operator injection (`{"$ne": null}`).
3. **Parameterized Database Interactions:** Use Mongoose schema-driven queries with type casting. Never concatenate raw, untrusted user strings into database execution statements.
4. **Strict Default-Deny Authorization:** Every administrative and data-mutating route must explicitly require authentication (`middleware/auth.js`). Unauthenticated access defaults to `401 Unauthorized` or `403 Forbidden`.
5. **Abuse Controls on Public Endpoints:** Apply rate limiting to all public-facing endpoints (login, registration, password reset, file uploads, PDF proxy, and commenting).
6. **Robust SSRF Protection:** Outbound HTTP requests (such as the notification PDF proxy) must use `services/safeFetch.js`. Restrict protocols to HTTP/HTTPS, allow only standard web ports (80/443), resolve DNS to prohibit private, loopback (127.0.0.1, ::1), link-local (169.254.169.254), and cloud-metadata addresses, and follow redirects manually with re-validation on every hop.
7. **Secure File Upload Handling:** Restrict upload MIME types exclusively to vetted formats (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`). Enforce strict file size limits (20MB maximum). Never preserve user-supplied filenames on disk; generate randomized system filenames with server-derived extensions. Serve uploads with `X-Content-Type-Options: nosniff` and force `Content-Disposition: attachment` on non-image/non-PDF types.
8. **Environment Separation:** Maintain strict isolation between local development, staging, and production environments. Never point development or test instances to the production database or production EmailJS credentials.
9. **Continuous Dependency Review:** Run `npm run security:check` and `npm audit` before every production release. Immediately remove unneeded or vulnerable dependencies.
10. **Redacted Logging:** Never write sensitive credentials, passwords, raw password reset tokens, full authorization headers, or private user emails to console logs or storage.
11. **Security Integrity:** Never disable or bypass an authentication check, rate limiter, or CORS restriction simply to make a build pass or quiet an automated test.

---

## App-Specific Settings

### Rate Limiting & Abuse Controls

| Endpoint | Window | Limit (Max Requests) | Key / Identifier | Exceeded-Limit Behavior | Monitoring Signal |
|---|---|---|---|---|---|
| **Global API** (`*`) | 1 minute | 600 req | IP address (`req.ip`) | `429 Too Many Requests` (skips `/uploads`) | Edge rate-limit alert / campus Wi-Fi monitor |
| **Login** (`POST /api/auth/login`) | 15 minutes | 10 failed attempts | IP address (`req.ip`) | `429` (successful logins discounted) | Brute-force threshold log (`authRoutes.js`) |
| **Account Creation** (`POST /api/auth/register`) | 1 hour | 10 req | IP address (`req.ip`) | `429` with retry time | Bot registration spike alert |
| **Password Reset** (`POST /api/auth/forgot-password`) | 1 hour | 10 req | IP address (`req.ip`) | `429` with retry time | EmailJS quota exhaustion alert |
| **Reset Execution** (`POST /api/auth/reset-password/:token`) | 1 hour | 10 req | IP address (`req.ip`) | `429` with retry time | Reset brute-force alert |
| **Public Comments** (`POST /api/comments`) | 10 minutes | 10 req | IP address (`req.ip`) | `429 You are commenting too fast` | Spam detection signal |
| **Material Submission** (`POST /api/user-materials`) | 1 hour | 10 req | IP address (`req.ip`) | `429 Upload limit reached` | Disk quota monitoring |
| **PDF Proxy** (`GET /api/notifications/proxy-pdf`) | 1 minute | 30 req | IP address (`req.ip`) | `429` with retry time | SSRF probe / bandwidth alert |
| **JNTUA Notice Sync** (`GET /api/notifications/sync`) | 1 minute | 10 req | IP address (`req.ip`) | `429` with retry time | External scraping overload monitor |

### Origin & Network Controls
* **Allowed Origins (`CORS_ORIGINS`):** Configured via `.env`. In production, this must match the deployed frontend domains (e.g. `https://jntucircle.com,https://www.jntucircle.com`). If unspecified, defaults to permissive for development testing.
* **Proxy Trust:** When deployed behind reverse proxies (Nginx, Render, Railway, AWS ALB), `app.set("trust proxy", 1)` must be uncommented in `server.js` to ensure client IPs reflect the actual end-user rather than the proxy load balancer.

### Upload Limits & Security
* **Max file size:** `20 MB` (20,971,520 bytes).
* **Allowed file extensions:** `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`.
* **Storage location:** Local filesystem `uploads/` directory with `dotfiles: "deny"`.
* **MIME Verification:** Extensions are programmatically mapped from `file.mimetype` (`SAFE_EXTENSIONS`) to prevent executable file uploads (e.g. uploading `shell.php` with a PDF extension).
* **Delivery headers:**
  * `X-Content-Type-Options: nosniff`
  * `Content-Disposition: attachment` applied to any non-standard file types to block browser execution.

### Dependency Review & Secret Scanning
* **Automated Checker:** `andhra-circle-backend/scripts/security-check.js` (runs via `npm run security:check`).
  * Enforces route authorization checks on all non-GET routes.
  * Verifies `JWT_SECRET` entropy and blocks weak secrets.
  * Verifies `.env` is ignored by Git and not tracked in the index.
  * Scans codebase for secret leakage in `console.log`.
  * Verifies `uploads/` integrity.
* **Package Auditing:** `npm audit --omit=dev`.
* **Prohibited Packages:** The legacy/unused package `j` must remain uninstalled due to security vulnerabilities in its transitive dependencies.

---

## Change and Incident Process

### Roles & Responsibilities
* **Security Reviewer:** Lead Full-Stack Architect / JNTU Circle Security Maintainer.
* **Incident Commander:** Principal Systems Lead (`security@jntucircle.com` / Institutional Administrator).

### Pre-Release Verification Checklist
Before merging changes or triggering production deployment:
1. Run `cd andhra-circle-backend && npm run security:check`. Build fails if any `HIGH` finding is present.
2. Run `npm audit --omit=dev` and confirm zero critical or high vulnerabilities.
3. Verify that all newly created data-mutating routes have explicit `auth` middleware or are formally registered in `INTENTIONALLY_PUBLIC`.
4. Ensure no uncommitted `.env` files or secrets are present in Git staging (`git status`).
5. Run client production build (`npm run build` in `andhra-circle-frontend`) to verify bundle integrity and lack of leaked backend variables.

### Incident Response Plan (On Suspected Compromise)
If credentials or user data are suspected of being leaked:
1. **Contain Access:**
   * Immediately rotate `JWT_SECRET` in production `.env` and restart the backend. This instantly terminates and revokes all active student and admin sessions.
   * If database compromise is suspected, immediately rotate the MongoDB Atlas database user password and restrict IP whitelist to the app server IP.
   * Rotate EmailJS API keys (`EMAILJS_PUBLIC_KEY` and `EMAILJS_PRIVATE_KEY`).
2. **Preserve Evidence:**
   * Export server logs, rate limit trigger logs, and MongoDB Atlas access logs before restarting or modifying hosting instances.
3. **Assess Impact:**
   * Review MongoDB audit logs for unauthorized record deletions (`notes`, `comments`, `users`).
   * Audit `uploads/` directory for unauthorized file additions.
4. **Remediate & Restore:**
   * Deploy corrected code and rotated secrets.
   * Notify affected users if sensitive identity data was accessed.

