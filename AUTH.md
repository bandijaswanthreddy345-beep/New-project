# Authentication Specification: JNTU Circle

**Scope:** `andhra-circle-backend` & `andhra-circle-frontend`  
**Authentication Mechanism:** Stateless JSON Web Token (JWT) signed via HMAC-SHA256 (`jsonwebtoken`)  
**Credential Storage:** Passwords hashed with bcrypt (salt rounds: 10)  

---

## 1. Identity & Registration

### User Registration
* **Endpoint:** `POST /api/auth/register`
* **Protection:** Account creation rate limiter (10 requests per hour per IP) + server-side encrypted CAPTCHA challenge (`CAPTCHA_SECRET` HMAC validation).
* **Fields:** `name` (string, max 100), `email` (string, max 254), `password` (string, 8–128 characters), `captchaToken`, `captchaAnswer`.
* **Role assignment:** Hardcoded to `role: "student"`. Any `role` submitted in the client request body is ignored.
* **Duplicate accounts:** Checked against unique `email` index in MongoDB. Returns `400` with `"User already exists"`.
* **Response:** Returns `201` with user metadata (`_id`, `name`, `email`, `role`). Never returns password hashes.

### User Login
* **Endpoint:** `POST /api/auth/login`
* **Protection:** Failed attempt rate limiter (`loginLimiter`: max 10 failed attempts per 15 minutes per IP; successful logins do not increment counter).
* **Input handling:** Coerced to strings via `asString()`.
* **Credential verification:** Generic `401 Unauthorized` (`"Invalid email or password"`) returned on both unknown email and incorrect password to prevent user enumeration.
* **Token payload:** `{ id: user._id, role: user.role, tokenVersion: user.tokenVersion }`.
* **Validity:** 7 days (`7d`).

### Password Reset
* **Endpoints:**
  * Request reset link: `POST /api/auth/forgot-password` (Rate limited: 10 req / hour / IP).
  * Execute reset: `POST /api/auth/reset-password/:token` (Rate limited: 10 req / hour / IP).
* **Reset token generation:**
  * Pseudo-random token generated via `crypto.randomBytes(32).toString("hex")`.
  * Stored in database as SHA-256 hash (`resetPasswordToken`) with a 15-minute expiry (`resetPasswordExpire = Date.now() + 15 * 60 * 1000`).
  * Email dispatched via EmailJS (`@emailjs/nodejs`) embedding `${FRONTEND_URL}/reset-password/${token}`.
  * Reset tokens are never printed or logged to the console.
* **Reset completion:**
  * Matches hash and verifies token has not expired.
  * Updates password to new bcrypt hash, clears `resetPasswordToken` and `resetPasswordExpire`, and increments `tokenVersion` / updates `passwordChangedAt`.
  * Pre-existing tokens issued prior to password change are invalidated by `middleware/auth.js`.

---

## 2. Authorization & Protected Routes

### Authentication Middleware (`middleware/auth.js`)
* Validates `Authorization: Bearer <token>`.
* Verifies signature using `JWT_SECRET`.
* Fetches user from database via `decoded.id` (excluding `password`, `resetPasswordToken`, `resetPasswordExpire`).
* Rejects tokens if `user.passwordChangedAt` is newer than token issue time (`decoded.iat`) or `tokenVersion` is outdated.
* Restricts admin routes: requires `user.role === "admin"`, returning `403 Forbidden` if role is not admin.
* Attaches sanitized user document to `req.user`.

### Access Control Matrix

| Endpoint | Method | Public / Student | Admin | Enforcement |
|---|---|---|---|---|
| `/api/auth/register` | `POST` | Yes (Rate limited + CAPTCHA) | Yes | Open with rate limiter |
| `/api/auth/login` | `POST` | Yes (Rate limited) | Yes | Open with failed attempt limiter |
| `/api/auth/forgot-password` | `POST` | Yes (Rate limited) | Yes | Open with limiter |
| `/api/auth/reset-password/:token` | `POST` | Yes (Rate limited) | Yes | Open with limiter |
| `/api/notes`, `/papers`, `/syllabus`, `/lab-programs`, `/notifications` | `GET` | Yes | Yes | Public catalog reads |
| `/:id/like`, `/:id/view`, `/:id/download` | `PUT` | Yes | Yes | Public counter increments |
| `/api/comments` | `POST` | Yes (Rate limited) | Yes | String validation, email concealed in response |
| `/api/user-materials` | `POST` | Yes (Rate limited) | Yes | Multi-part upload with magic bytes verification |
| `/api/dashboard/stats` | `GET` | No (`401`/`403`) | Yes | `auth` middleware |
| `/api/audit-logs` | `GET` | No (`401`/`403`) | Yes | `auth` middleware |
| `/api/upload` | `POST` | No (`401`/`403`) | Yes | `auth` middleware |
| Resource Create / Update / Delete | `POST`/`PUT`/`DELETE` | No (`401`/`403`) | Yes | `auth` middleware |
| User Management (`/api/users*`) | `*` | No (`401`/`403`) | Yes | `auth` middleware + self-modification lock |
