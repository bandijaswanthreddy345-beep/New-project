# THREAT-MODEL.md

**Status:** ACTIVE | **Owner:** JNTU Circle Core Security Engineering | **Review date:** 2026-11-08  
**Scope/version:** JNTU Circle v1.0 (Express.js backend, React/Vite frontend, MongoDB Atlas, static file uploads, JNTUA background sync service, EmailJS integration).

---

## Architecture & System Model

### Assets
* **Admin Accounts & Privileged Access:** Total control over university circulars, study notes, question papers, user role management, and academic submissions.
* **Student Accounts & Identities:** User names, emails, bcrypt password hashes, and active authentication JWT tokens.
* **Private Submissions & Data:** Commenter emails, submitted student materials (`userMaterial`), and unapproved documents.
* **Academic Content Integrity:** Authenticity of university notifications, exam timetables, syllabus regulations (R19/R20/R23), and subject notes.
* **Infrastructure & Compute Budget:** Server CPU/memory availability during peak examination results traffic; EmailJS monthly quota; file storage capacity on disk.
* **Server Secrets:** `JWT_SECRET`, `MONGO_URI` (Atlas password), `EMAILJS_PRIVATE_KEY`.

### Actors
* **Anonymous Attacker:** Internet-based scanner or bot attempting credential stuffing, SSRF against internal networks, or scraping student emails.
* **Abusive Student / Member:** Authenticated user attempting privilege escalation, self-promotion to admin, spamming notes/comments, or tampering with resource view/like counters.
* **Prankster / Disgruntled User:** Malicious actor attempting to deface university notifications, post false exam cancellations, or delete academic content.
* **Compromised Vendor / Third Party:** Compromised EmailJS account, malicious DNS re-binding server targeting the PDF proxy, or malicious upstream JNTUA portal response.

### Data Flow
```
[Client Browser]
       │
       ▼ (HTTPS / REST API calls, JSON, Multer Multipart)
[Express API Gateway] ──(RateLimit / SecurityHeaders / Auth Middleware)
       │
       ├─► [MongoDB Atlas] (Users, Notes, Papers, Syllabus, LabPrograms, Notifications, Comments)
       ├─► [Local Disk: uploads/] (Sanitized PDF & image storage)
       ├─► [EmailJS Cloud API] (Transactional password reset emails)
       ├─► [safeFetch Service] ──► [Official JNTUA Server] (PDF Proxy & Notification Scraper)
       └─► [JntuChatbot / Gemini API] (Academic search & query responses)
```

### Trust Boundaries
1. **Client / Browser (Untrusted) ──► Express API:** All client headers, body payloads, query parameters, and tokens are untrusted. Client `localStorage` is untrusted; client cannot assert its own role.
2. **API ──► MongoDB Atlas Database:** Database credentials must be kept confidential; all queries must be sanitized against NoSQL injection.
3. **API ──► Upload Storage (`uploads/`):** Uploaded bytes are untrusted; user-supplied filenames and extensions are discarded.
4. **API ──► External Web (`safeFetch` / `proxy-pdf`):** Outbound URL requests are untrusted; must block access to private/cloud-metadata networks (SSRF).

---

## Threat 1: Leaked Data

### Path
1. **Comment Email Scraping:** Attacker scrapes `GET /api/comments/note/:noteId` hoping to harvest student emails.
2. **User Record Enumeration:** Attacker calls `GET /api/users` without authentication to harvest identity records.
3. **Password Hash Exfiltration:** Attacker intercepts registration response or queries user API to obtain password hashes.
4. **Log Harvesting of Reset Tokens:** Attacker with access to hosting console logs (Render/Railway/Vercel) reads reset tokens printed during `forgot-password` requests.
5. **Direct Access to Unreviewed Materials:** Attacker accesses `GET /api/user-materials` to view private peer uploads.

### Impact
Exposure of student email directories, spam harassment, brute-force exposure of offline password hashes, and violation of student privacy.

### Prevention
* **Field Projection:** `commentController.js` applies `.select("-email")` on all public comment queries; commenters' emails are never serialized to JSON.
* **User Endpoint Projection:** `userController.js` and `auth.js` apply `.select("-password -resetPasswordToken -resetPasswordExpire")`.
* **Sanitized Registration Response:** `authController.js` explicitly returns only `{ _id, name, email, role }`; the hashed password is omitted from the response.
* **Zero-Leak Logging:** Logging of raw password reset URLs or reset tokens in `authController.js` is strictly eliminated.
* **Route Protection:** `GET /api/user-materials` and `GET /api/users` are locked behind `auth` middleware (admin-only).

### Detection
* Audit logs for unauthenticated requests returning `401` on `/api/users` or `/api/user-materials`.
* Automated regression test in `scripts/security-check.js` (Check 3) scanning source code for `console.log` statements containing `token`, `password`, or `secret`.

### Test
* Two-user test: Create Comment as User A. Send unauthenticated `GET /api/comments/note/:id` as User B; verify `email` property is undefined in JSON response.
* Send `GET /api/users` without Authorization header; verify `401 Unauthorized` response.

### Response
* Contain: If data is leaked via an endpoint, patch projection in controller and redeploy immediately.
* Assess: Query MongoDB connection logs to determine access volume.
* Owner: Security Engineering Lead.

### Residual Risk & Decision
* **Residual Risk:** MongoDB Atlas backup exposure if Atlas admin account credentials leak.
* **Decision:** Enforce MFA on MongoDB Atlas dashboard and restrict Atlas IP Access List to production static IP by 2026-12-01.

---

## Threat 2: Account Takeover

### Path
1. **Weak JWT Secret Forgery:** Attacker guesses `JWT_SECRET` (e.g., `"secret"`, `"changeme"`), crafts a forged JWT with `{ role: "admin" }`, and assumes admin control.
2. **Credential Brute-Forcing:** Automated bot submits thousands of password attempts to `POST /api/auth/login`.
3. **Password Reset Replay & Hijacking:** Attacker reuses an expired or already-used password reset token to overwrite an account's password.
4. **User Self-Promotion:** Student registers with payload `{ "name": "Eve", "role": "admin" }` or calls `PUT /api/users/:id/role`.

### Impact
Full administrative takeover; malicious defacement of university notices; deletion of notes catalog; unauthorized extraction of user data.

### Prevention
* **High-Entropy Secret Enforcement:** `server.js` verifies `JWT_SECRET` has minimum 32 characters and rejects predictable strings; fails server boot in production if weak.
* **Login Rate Limiting:** `authRoutes.js` enforces `loginLimiter` (max 10 failed login attempts per 15 minutes per IP; successful logins do not count).
* **Reset Token Security:** Single-use crypto tokens hashed with SHA-256 in MongoDB; enforced 15-minute expiration; token cleared immediately upon successful reset.
* **Generic Responses:** Identical error message (`"Invalid email or password"`) prevents account enumeration.
* **Hardcoded Student Role:** `User.create` does not read `role` from user request; all signups are forced to `"student"`.
* **Self-Promotion Lock:** `userController.updateUserRole` blocks admins from altering their own role or deleting their own account.

### Detection
* Server logs tracking repeated `429 Too many login attempts` from single IP blocks.
* Alerts on repeated `401 Invalid or expired token` errors on administrative endpoints.

### Test
* Replay test: Complete password reset with Token X; re-submit Token X to `POST /api/auth/reset-password/X`; verify `400 Invalid or expired reset token`.
* Self-promotion test: Send `POST /api/auth/register` with `{ "role": "admin" }`; verify returned user has `role: "student"`.

### Response
* Contain: Rotate `JWT_SECRET` immediately in production `.env` and restart service. This instantaneously invalidates all active sessions across the application.
* Investigate: Check MongoDB for recently modified `role` fields or unexpected admin users.
* Owner: Security Engineering Lead.

### Residual Risk & Decision
* **Residual Risk:** XSS token theft while JWT resides in `localStorage`.
* **Decision:** Migrate JWT storage to `httpOnly`, `Secure`, `SameSite=Lax` cookies with CSRF Double-Submit Protection. Target: Q1 2027.

---

## Additional Threats

### Threat 3: Server-Side Request Forgery (SSRF) via PDF Proxy
* **Path:** Attacker passes internal or cloud metadata addresses to `GET /api/notifications/proxy-pdf?url=http://169.254.169.254/latest/meta-data` or `http://localhost:27017`.
* **Impact:** Exfiltration of cloud provider credentials or internal service access.
* **Mitigation:** `services/safeFetch.js` validates every request:
  * Restricts schemes to `http:` and `https:`.
  * Restricts ports strictly to `80` and `443`.
  * Resolves DNS and blocks private IPv4 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16) and IPv6 (::1, fc00::/7, fe80::/10, IPv4-mapped).
  * Manually follows redirects (max 4 hops) and re-evaluates DNS on every destination.
  * Rate-limited to max 30 requests per minute.
* **Evidence:** `safeFetch.js: assertPublicUrl()`, `isPrivateAddress()`.
* **Priority:** Critical | **Owner:** Backend Lead.

### Threat 4: Stored Cross-Site Scripting (XSS) via File Uploads
* **Path:** Attacker uploads an HTML file containing JavaScript (`alert(document.cookie)`) disguised as a PDF or image into `uploads/`.
* **Impact:** JavaScript executes within the domain context when another student or admin opens the file URL.
* **Mitigation:**
  * Multer storage config (`config/multer.js`) discards original filenames and derives extension strictly from verified MIME type (`SAFE_EXTENSIONS`).
  * `server.js` serves `uploads/` with `X-Content-Type-Options: nosniff` and forces `Content-Disposition: attachment` for all non-image/non-PDF files.
  * Dotfiles are denied (`dotfiles: "deny"`).
* **Evidence:** `config/multer.js: storage.filename`, `server.js: SAFE_UPLOAD_TYPES`.
* **Priority:** High | **Owner:** Backend Lead.

### Threat 5: Denial of Service (DoS) / Resource Exhaustion
* **Path:** Script floods the server with large files or spam requests, filling server disk and memory.
* **Impact:** Server crashes; campus students unable to access notes or circulars during exams.
* **Mitigation:**
  * Global rate limiter (600 req/min/IP).
  * Upload rate limiter (10 uploads/hr/IP).
  * Multer 20MB hard file size ceiling.
  * JSON request body limited to 1MB (`express.json({ limit: "1mb" })`).
* **Evidence:** `server.js: rateLimit`, `config/multer.js: limits.fileSize`.
* **Priority:** Medium | **Owner:** DevOps Lead.

### Threat 6: AI Chatbot Prompt Injection & Search Abuse
* **Path:** Malicious prompt sent to `JntuChatbot` attempting to manipulate backend context or trigger infinite query loops.
* **Impact:** Excessive API consumption or distorted academic information.
* **Mitigation:**
  * Client-side prompt sanitization and strict maximum query lengths.
  * In-memory local fallback search index for common queries (`CSE`, `AIML`, `Syllabus`, `Notes`).
  * Rate-limited search endpoints.
* **Evidence:** `JntuChatbot.jsx: handleHeroSubmit`, `SearchSuggestions.jsx`.
* **Priority:** Medium | **Owner:** Frontend Lead.

### Threat 7: Accidental Administrative Self-Lockout
* **Path:** The only administrator accidentally changes their own role to `"student"` or deletes their own account via the Admin User Management panel.
* **Impact:** Administrative access lost fleet-wide; requires direct database intervention.
* **Mitigation:**
  * `userController.js` enforces strict identity locks: `if (String(req.params.id) === String(req.user._id))` returns `400 Bad Request` on both role modification and user deletion.
* **Evidence:** `userController.js:33` and `userController.js:84`.
* **Priority:** High | **Owner:** Backend Lead.

---

## Review & Audit Cadence

* **Pre-Release:** Run `npm run security:check` in `andhra-circle-backend`. Must pass with 0 HIGH findings.
* **Monthly:** Run `npm audit`, review new dependency vulnerabilities, and check MongoDB Atlas Network Access lists.
* **Triggered Review:** Conduct immediate threat model review whenever new third-party services, upload handlers, or user roles are added.

