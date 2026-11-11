# Threat Model: JNTU Circle (Andhra Circle)

**Scope:** `andhra-circle-backend` (Express 5, Node.js, MongoDB Atlas), `andhra-circle-frontend` (React, Vite).  
**Review Method:** Source code review across controllers, middleware, models, routes, static storage, and frontend client.

---

## 1. Architecture & Assets

### System Assets
* **Administrative Credentials & Permissions:** Administrative role access allowing publishing, modifying, and deleting university circulars, study notes, question papers, syllabus records, and managing user roles.
* **Student Accounts:** User names, emails, and bcrypt salted password hashes.
* **Audit Trail:** Append-only administrative activity records (`AuditLog` collection: admin user ID, action, resource type, resource ID, route, IP, timestamp).
* **Private Submissions & Data:** Student uploaded submissions (`userMaterial`), commenter emails, password reset tokens.
* **Academic Content:** Study notes, previous question papers, curriculum syllabi, and lab programs.
* **Server Secrets:** `JWT_SECRET`, `CAPTCHA_SECRET`, database connection string (`MONGO_URI`), `EMAILJS_*` credentials, `GEMINI_API_KEY`.

### Data Flow & Trust Boundaries
```
[Client Browser]
       │
       ▼ (HTTPS / REST API calls, JSON, Multer Multipart)
[Express Server] ── (SecurityHeaders / RateLimit / Auth / ValidateUpload)
       │
       ├─► [MongoDB Atlas] (Users, Notes, Papers, Syllabus, Notifications, LabPrograms, Comments, AuditLogs)
       ├─► [Local Disk: uploads/] (PDFs & Images, validated by magic bytes)
       ├─► [EmailJS Cloud API] (Transactional password reset emails)
       ├─► [safeFetch Service] ──► [Official JNTUA Server] (PDF Proxy & Notification Scraper)
       └─► [Chatbot / Gemini API] (Academic assistant)
```

1. **Client Browser -> Express API (Untrusted Boundary):** All request bodies, query params, headers, and cookies/tokens are untrusted. Identity and permissions are determined strictly server-side by verifying the JWT and user role in the database.
2. **API -> MongoDB Atlas (Confidential Boundary):** Sanitized queries, field whitelisting, and Mongoose schema casting protect against NoSQL injection.
3. **API -> Local Disk Storage (Untrusted Content Boundary):** Uploads are limited to 20MB, sanitized filenames, and verified magic bytes for PDF, PNG, JPEG, and WebP.
4. **API -> External Network via safeFetch (SSRF Boundary):** Outbound requests resolve DNS to ensure destinations are not private, loopback, or cloud-metadata addresses.

---

## 2. Identified Threats & Implemented Mitigations

### Threat 1: Internal Error & Stack Trace Leaks
* **Vector:** Server exceptions returning raw `err.message` or stack traces to clients, revealing internal file paths, driver details, or database state.
* **Mitigation:** In `server.js`, the global error handler checks `NODE_ENV === "production"`. When in production, all errors with status >= 500 return a generic message `"Internal server error"` while logging full details on the server console. Invalid ObjectIds (Mongoose `CastError`) return a clean 400 `"Invalid ID format"`.

### Threat 2: Plaintext HTTP & Missing Transport Security
* **Vector:** Man-in-the-middle attacks inspecting unencrypted traffic on open networks.
* **Mitigation:** In production, `server.js` redirects plain HTTP requests to HTTPS when `x-forwarded-proto` indicates HTTP. `middleware/securityHeaders.js` emits `Strict-Transport-Security: max-age=15552000; includeSubDomains` in production. Configurable `TRUST_PROXY` supports reverse proxies.

### Threat 3: Permissive CORS in Production
* **Vector:** Unauthorized third-party web origins issuing credentialed requests against the backend.
* **Mitigation:** `server.js` verifies `CORS_ORIGINS` in production. If `CORS_ORIGINS` is missing or empty, the server halts startup with `process.exit(1)`. Permissive behavior is retained only in development.

### Threat 4: Unauthorized Administrative Actions & Lack of Accountability
* **Vector:** Compromised or rogue admin accounts performing unauthorized data modification without an audit trail.
* **Mitigation:** `AuditLog` collection records every administrative `create`, `update`, `delete`, and `role change`. Never stores passwords, tokens, request bodies, or user emails. Log entries are viewable via paginated admin-only route `GET /api/audit-logs`.

### Threat 5: Malicious File Uploads & MIME Spoofing
* **Vector:** Attacker uploads HTML, scripts, or executables disguised as a PDF or image to execute in users' browsers or fill disk space.
* **Mitigation:**
  * 20MB hard file size limit on all upload routes (`config/multer.js`).
  * `middleware/validateUpload.js` verifies the initial magic bytes of saved files (`%PDF-`, PNG, JPEG, WebP). Files failing validation are deleted immediately and rejected with 400.
  * Server serves uploads with `X-Content-Type-Options: nosniff`.

### Threat 6: Mass Assignment & IDOR via Request Bodies
* **Vector:** Attacker passes arbitrary JSON fields in `req.body` to overwrite sensitive model properties (e.g., `role`, `views`, `downloads`, `likes`).
* **Mitigation:** All controller update endpoints (`paperController.js`, `syllabusController.js`, `notificationController.js`, `noteController.js`, `labProgramController.js`, `userController.js`) explicitly whitelist allowed fields and apply string type coercion and length limits. Route parameters are validated with `validateObjectId`.

### Threat 7: Server-Side Request Forgery (SSRF) via PDF Proxy & External Scraper
* **Vector:** Supplying loopback (127.0.0.1) or cloud metadata (169.254.169.254) addresses to backend fetching endpoints.
* **Mitigation:** `services/safeFetch.js` resolves DNS and blocks private/loopback/cloud-metadata IPv4 and IPv6 ranges. Both the PDF proxy and `jntuaSyncService.js` use `safeFetch`.

### Threat 8: Denial of Service & Brute-Force Attacks
* **Vector:** Flooding authentication endpoints or flooding the database with rapid queries.
* **Mitigation:**
  * Global rate limiter (600 req/min/IP).
  * Login limiter: 10 failed attempts per 15 minutes per IP.
  * Captcha challenge required on registration with cryptographic verification (`CAPTCHA_SECRET`).

---

## 3. Threat Verification & Self-Check

Run the automated self-check script before every release:
```bash
cd andhra-circle-backend
npm run security:check
```

The script checks:
1. Missing route authentication on mutating endpoints.
2. `JWT_SECRET` entropy and presence in `.env`.
3. Leaking credentials in console logs.
4. Upload file type extensions in `uploads/`.
5. Dependency vulnerabilities via `npm audit --omit=dev`.
6. Error handler masks details in production.
7. Production CORS enforcement.
8. Mass assignment in Mongoose update routes.
9. Audit logging on admin mutating endpoints.
10. `TRUST_PROXY` configuration in `server.js` and documentation in `.env.example`.

---

## 4. Unverified / Open Items

* **Static Host Security Headers:** static hosting platform configuration (Vercel, Netlify, or other) is pending host selection.
* **UserMaterial Private Storage:** Admin review/approval workflow and private storage outside `/uploads` for pending user materials is pending design approval.
* **Third-Party Availability:** Email delivery depends on external EmailJS availability and quota limits.
