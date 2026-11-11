# Security Policy & Implementation: JNTU Circle

**Scope:** `andhra-circle-backend` & `andhra-circle-frontend`  

---

## 1. Security Architecture Principles

1. **No Hard-Coded Secrets:** Secrets (`JWT_SECRET`, `CAPTCHA_SECRET`, `MONGO_URI`, `EMAILJS_*`, `GEMINI_API_KEY`) live only in environment variables and are excluded from Git via `.gitignore`.
2. **Server-Side Input Validation & Sanitization:** Type coercion (`asString()`), length limits, and field whitelisting are enforced in controllers. Route parameters are validated via `validateObjectId`.
3. **Mongoose Schema & Parameterization:** Queries use Mongoose ODM with parameter binding, preventing NoSQL query selector injection.
4. **Default-Deny Access Control:** All modifying administrative operations require `middleware/auth.js` verifying valid JWT and `user.role === "admin"`.
5. **Rate Limiting:** Public endpoints (login, registration, password reset, file uploads, PDF proxy, and commenting) use rolling window rate limiters.
6. **SSRF Protection:** Outbound requests (PDF proxy and JNTUA sync service) use `services/safeFetch.js` to block internal, loopback, private, and cloud-metadata addresses.
7. **Secure File Uploads:** Uploads enforce 20MB file size limits and inspect the initial magic bytes (%PDF-, PNG, JPEG, WebP) to ensure file content matches the declared MIME type.
8. **Audit Logging:** Every administrative POST, PUT, and DELETE action records an entry in `AuditLog` without storing sensitive data (passwords, tokens, bodies, or emails).
9. **Production Error Masking:** Global error handler returns generic `"Internal server error"` for status >= 500 when `NODE_ENV === "production"`. Invalid ObjectIds return clean `400`.
10. **Transport Security:** In production, HTTP requests are redirected to HTTPS when `x-forwarded-proto` is HTTP, and `Strict-Transport-Security` header is sent.
11. **Production CORS Enforcement:** Server refuses to start in production if `CORS_ORIGINS` is missing or empty.

---

## 2. Rate Limiting Specifications

| Endpoint | Window | Limit | Target | Behavior on Exceeded Limit |
|---|---|---|---|---|
| Global API (`*`) | 1 minute | 600 req | IP address | `429 Too Many Requests` (skips `/uploads`) |
| Login (`POST /api/auth/login`) | 15 minutes | 10 failed attempts | IP address | `429` (successful logins discounted) |
| Registration (`POST /api/auth/register`) | 1 hour | 10 req | IP address | `429` with retry message |
| Forgot Password (`POST /api/auth/forgot-password`) | 1 hour | 10 req | IP address | `429` with retry message |
| Reset Password (`POST /api/auth/reset-password/:token`) | 1 hour | 10 req | IP address | `429` with retry message |
| Comments (`POST /api/comments`) | 10 minutes | 10 req | IP address | `429 You are commenting too fast` |
| Upload Materials (`POST /api/user-materials`) | 1 hour | 10 req | IP address | `429 Upload limit reached` |
| PDF Proxy (`GET /api/notifications/proxy-pdf`) | 1 minute | 30 req | IP address | `429` with retry message |
| JNTUA Sync (`GET /api/notifications/sync`) | 1 minute | 10 req | IP address | `429` with retry message |

---

## 3. Upload & File Handling

* **File Size Limit:** 20 MB per file (`config/multer.js`).
* **Allowed Types:** PDF (`%PDF-`), PNG, JPEG, WebP (`middleware/validateUpload.js`). Mismatched files are immediately unlinked and rejected with 400.
* **Storage Path:** Sanitized unique names (`Date.now() + random + extension`) saved to `uploads/`.
* **Headers:** `X-Content-Type-Options: nosniff` sent on all responses.

---

## 4. Automated Verification

Automated self-check script:
```bash
cd andhra-circle-backend
npm run security:check
```
Checks route protection, secret strength, logging practices, uploads folder, dependencies, error handler masking, CORS configuration, mass assignment, audit logging, and `TRUST_PROXY` documentation.
