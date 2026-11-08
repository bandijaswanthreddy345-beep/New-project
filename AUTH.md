# AUTH.md

**Status:** ACTIVE | **Owner:** JNTU Circle Core Security Engineering | **Reviewed:** 2026-11-08  
**Auth provider:** Custom Stateless JWT via Node.js / Express / Mongoose | **Allowed sign-in methods:** Email + Password (Bcrypt salted hash)

---

## Identity Lifecycle

### Signup
* **Endpoint:** `POST /api/auth/register`
* **Required fields:** `name` (string, 1–100 chars, trimmed), `email` (RFC-compliant string, max 254 chars, lowercase trimmed), `password` (string, 8–128 chars).
* **Validation & Sanitization:** Server-side type check (`asString()`) prevents NoSQL object injection (`{"$ne": null}`). Regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` strictly enforced.
* **Role enforcement:** Role cannot be chosen or passed by client payload. Every new registration is hardcoded to `role: "student"`.
* **Duplicate-account behavior:** Case-insensitive lookup against unique `email` index. If found, returns `400 Bad Request` with generic message `"User already exists"`.
* **Response:** Returns `201 Created` with sanitized user object (`_id`, `name`, `email`, `role`). Password hashes, salt rounds, and token metadata are strictly excluded.

### Login
* **Endpoint:** `POST /api/auth/login`
* **Flow:** Accepts `{ email, password }`. Both fields are coerced to strings.
* **Failed-attempt handling & Abuse limits:**
  * Protected by `loginLimiter` middleware (`15` minute rolling window).
  * Rate-limits only failed responses (`res.statusCode >= 400`, max 10 failed attempts per IP). Successful logins do not count against the allowance, ensuring multiple students sharing a single campus Wi-Fi or cellular NAT IP are not locked out.
  * Uniform response: Returns identical `401 Unauthorized` (`"Invalid email or password"`) for non-existent users and incorrect passwords to prevent user enumeration.
* **Success:** Returns `200 OK` with JSON payload containing `token` (signed JWT) and sanitized user metadata.

### MFA (Multi-Factor Authentication)
* **Current status:** Not currently implemented in the MERN baseline.
* **Target architecture:** Required for `role: "admin"`.
* **Enrollment & Recovery plan:** Time-based One-Time Password (TOTP, RFC 6238) using Authenticator apps (Google Authenticator / Aegis). Admins must store 8 single-use alphanumeric backup codes hashed via SHA-256 in the database.

### Password Reset
* **Endpoints:**
  * Request link: `POST /api/auth/forgot-password` (Rate limited: 10 req / hour / IP).
  * Execute reset: `POST /api/auth/reset-password/:token` (Rate limited: 10 req / hour / IP).
* **Provider flow:**
  1. User submits email. Generic response `"If this email is registered, a password reset link has been sent to it"` is returned unconditionally to prevent account discovery.
  2. Cryptographically secure 32-byte pseudo-random token generated (`crypto.randomBytes(32).toString('hex')`).
  3. SHA-256 hash of token stored in MongoDB (`resetPasswordToken`) with a strict 15-minute expiration timestamp (`resetPasswordExpire = Date.now() + 15 * 60 * 1000`).
  4. Raw token sent via EmailJS REST API (`@emailjs/nodejs`) embedding the link `${FRONTEND_URL}/reset-password/${rawToken}`.
  5. Password reset link is **never written to application logs or console output** (neutralizing CVE-style log harvesting).
* **Single-use token expiry & invalidation:**
  * Reset verification verifies matching hash AND `resetPasswordExpire: { $gt: new Date() }`.
  * Upon successful password replacement (Bcrypt hash with 10 salt rounds), both `resetPasswordToken` and `resetPasswordExpire` are immediately set to `undefined` and persisted, preventing token reuse.

### Sensitive Changes
* **Role updates (`PUT /api/users/:id/role`):** Admin only. Validates that the acting admin cannot change their own role (`req.params.id === req.user._id`), preventing accidental loss of administrative access.
* **Account deletion (`DELETE /api/users/:id`):** Admin only. Validates that the acting admin cannot delete their own account.
* **Reauthentication rules:** Updating credentials or primary email requires presenting current password.

### Account Recovery
* **Self-service:** Email-based token reset only.
* **Admin-assisted:** Authorized institutional administrators can trigger password reset workflows or manually delete compromised accounts through the protected `/api/users` admin panel.

---

## Sessions

### Session Mechanism and Storage
* **Current implementation:** Stateless JSON Web Token (JWT) signed via HMAC-SHA256 (`jsonwebtoken`).
* **Payload:** `{ id: user._id, role: user.role }`.
* **Client storage:** Currently stored in browser `localStorage`.
* **Hardening directive (In-Progress for Production):** Transition token storage to an `httpOnly`, `Secure`, `SameSite=Lax` cookie paired with CSRF Double-Submit Protection to eliminate the risk of token exfiltration via client-side XSS.

### Expiry, Refresh, and Rotation
* **Lifetime:** `7d` (7 days) for standard student convenience.
* **Secret strength:** Cryptographically enforced on startup. If `JWT_SECRET` is less than 32 characters or matches weak patterns (`my_super_secret`, `changeme`), the server refuses to boot in production (`process.exit(1)`).
* **Rotation:** When `JWT_SECRET` is rotated, all existing issued tokens become invalid immediately.

### Logout and Revocation
* **Client logout:** Immediate deletion of stored token in `localStorage` and reset of client-side authentication context state.
* **Server-side verification:** On every protected route, `middleware/auth.js` queries MongoDB (`User.findById(decoded.id)`). If an account is deleted or modified in the database, access is rejected immediately regardless of JWT token expiration.
* **Stolen-device procedure:** Rotating `JWT_SECRET` in environment variables invalidates all active sessions fleet-wide.

### Cookie-based Web Sessions (Target Specs)
| Attribute | Specification | Rationale |
|---|---|---|
| `HttpOnly` | `true` | Prevents malicious JavaScript (`document.cookie`) from reading the session. |
| `Secure` | `true` (enforced when `NODE_ENV === "production"`) | Ensures tokens are transmitted exclusively over encrypted TLS/HTTPS channels. |
| `SameSite` | `Lax` (or `Strict` for API calls) | Protects against Cross-Site Request Forgery (CSRF). |
| `Path` | `/api` | Scopes cookie delivery to backend endpoints only. |

### Native Token Storage
* If deployed as a native/mobile application (Capacitor/React Native): Store tokens exclusively in platform-secure hardware storage (iOS Keychain / Android EncryptedSharedPreferences).

---

## Permissions

### Role-Based Access Control (RBAC) Matrix

| Resource / Endpoint | Method | Anonymous | Student | Admin | Enforcement Mechanism |
|---|---|---|---|---|---|
| **Public Academic Catalog** (`/api/notes`, `/papers`, `/syllabus`, `/lab-programs`, `/notifications`) | `GET` | **ALLOW** | **ALLOW** | **ALLOW** | Open read route. |
| **Catalog Resource Metrics** (`/:id/like`, `/:id/view`, `/:id/download`) | `PUT` | **ALLOW** (Throttled) | **ALLOW** | **ALLOW** | Open counter endpoints. |
| **PDF Proxy** (`/api/notifications/proxy-pdf`) | `GET` | **ALLOW** (Throttled, max 30/min) | **ALLOW** | **ALLOW** | `safeFetch` internal IP block + rate limit. |
| **Submit Study Materials** (`/api/user-materials`) | `POST` | **ALLOW** (Throttled, max 10/hr) | **ALLOW** | **ALLOW** | Multi-part PDF upload with MIME filtering. |
| **Public Comments** (`/api/comments`) | `POST` | **ALLOW** (Throttled, max 10/10m) | **ALLOW** | **ALLOW** | String validation, email concealed in response. |
| **Admin Upload** (`/api/upload`) | `POST` | **DENY** (401) | **DENY** (403) | **ALLOW** | `middleware/auth.js` (`role === "admin"`). |
| **Resource Creation / Modification / Deletion** (`POST/PUT/DELETE` on notes, papers, syllabus, notifications, lab-programs) | `*` | **DENY** (401) | **DENY** (403) | **ALLOW** | `middleware/auth.js` (`role === "admin"`). |
| **Manage Users & Roles** (`/api/users`, `PUT /api/users/:id/role`, `DELETE /api/users/:id`) | `*` | **DENY** (401) | **DENY** (403) | **ALLOW** | `middleware/auth.js` + self-modification lock. |
| **Admin Dashboard Stats** (`/api/dashboard/stats`) | `GET` | **DENY** (401) | **DENY** (403) | **ALLOW** | `middleware/auth.js`. |
| **Review Submissions** (`GET/DELETE /api/user-materials`) | `*` | **DENY** (401) | **DENY** (403) | **ALLOW** | `middleware/auth.js`. |

### Golden Rules
1. **Never trust client-supplied identity:** The client cannot supply `role`, `user_id`, or permissions via body or headers. Identity and permissions are derived strictly from the verified JWT `decoded.id` and checked against the database.
2. **Fail closed:** Every mutating administrative route requires the `auth` middleware. If no authorization header or an invalid token is provided, the server halts processing with `401 Unauthorized` or `403 Forbidden`.

---

## Acceptance Evidence

| Test Scenario | Actor | Expected Result | Actual Code Evidence | Status |
|---|---|---|---|---|
| **Anonymous access to protected route** | Anonymous | Request to `POST /api/notes` or `GET /api/users` rejected with `401`. | `middleware/auth.js:10`: missing `Bearer` header returns `401 No token provided`. | **VERIFIED** |
| **Student access to admin endpoint** | Student (Priya) | Logged-in student sends valid token to `DELETE /api/notes/:id`. Request rejected with `403`. | `middleware/auth.js:37`: `if (user.role !== "admin") return res.status(403)`. | **VERIFIED** |
| **Self-privilege escalation during signup** | Attacker | Client sends `POST /api/auth/register` with `{ "role": "admin" }`. User created with `student`. | `authController.js:63`: role is ignored and omitted from `User.create()`. | **VERIFIED** |
| **Self-privilege escalation via user management** | Admin (Rahul) | Admin attempts `PUT /api/users/<own_id>/role` with `student`. Request rejected with `400`. | `userController.js:33`: `if (String(req.params.id) === String(req.user._id)) return res.status(400)`. | **VERIFIED** |
| **Expired / Tampered Reset Token** | Attacker | Attacker submits replay of expired reset token or modified token string. Request rejected with `400`. | `authController.js:213`: queries `resetPasswordExpire: { $gt: new Date() }`. Clears token on completion. | **VERIFIED** |
| **Brute-force password guessing** | Bot | Script makes >10 failed login attempts within 15 minutes. | `authRoutes.js:17`: `loginLimiter` halts requests with `429 Too many login attempts`. | **VERIFIED** |

