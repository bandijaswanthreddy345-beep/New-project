# Environment Variables Reference: JNTU Circle

**Scope:** `andhra-circle-backend` & `andhra-circle-frontend`  
**Security Policy:** Never commit secrets to version control. Keep `.env` git-ignored.

---

## Backend Environment Variables (`andhra-circle-backend/.env`)

### `PORT`
* **Purpose:** Port number on which Express server listens.
* **Type:** Number (default: `5000`).
* **Required in Production:** Optional (defaults to 5000 or platform `$PORT`).

### `NODE_ENV`
* **Purpose:** Execution environment (`development`, `production`, `test`).
* **Required in Production:** Yes (`NODE_ENV=production`).
* **Production Effects:**
  * Global error handler hides stack traces and returns generic message for status >= 500.
  * Server refuses to start if `JWT_SECRET` is missing or weak (< 32 chars).
  * Server refuses to start if `CORS_ORIGINS` is missing or empty.
  * Sends `Strict-Transport-Security` header.
  * Redirects HTTP to HTTPS when `x-forwarded-proto` is `http`.

### `TRUST_PROXY`
* **Purpose:** Express proxy trust configuration for reverse proxies (Nginx, Render, Railway, Cloudflare).
* **Type:** String / Boolean / Number (`false`, `true`, hop count `1`, or proxy IP list).
* **Default:** `false` (off).
* **Production Recommendation:** Must be enabled behind reverse proxies so rate limiters and IP checks see the visitor's real client IP rather than the proxy server IP.

### `MONGO_URI`
* **Purpose:** MongoDB Atlas connection string.
* **Classification:** Critical Secret.
* **Required in Production:** Yes.

### `JWT_SECRET`
* **Purpose:** Cryptographic signing key for JSON Web Tokens.
* **Classification:** Critical Secret.
* **Required in Production:** Yes (minimum 32 random characters; server refuses to start if weak or missing).

### `CAPTCHA_SECRET`
* **Purpose:** Secret key used to encrypt and verify CAPTCHA challenges during registration.
* **Classification:** Critical Secret.
* **Required in Production:** Yes (must not reuse `JWT_SECRET`).

### `CORS_ORIGINS`
* **Purpose:** Comma-separated list of allowed web origins for cross-origin resource sharing.
* **Example:** `https://jntucircle.com,https://www.jntucircle.com`
* **Required in Production:** Yes (server refuses to start if empty or unset in production).

### `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`
* **Purpose:** Credentials for EmailJS REST API used to deliver password reset emails.
* **Classification:** Credentials / Private Keys.
* **Required in Production:** Yes for password reset email functionality.

### `GEMINI_API_KEY`
* **Purpose:** Google AI Studio Gemini API key for the academic chatbot assistant.
* **Classification:** API Secret.
* **Required in Production:** Yes if chatbot assistant is enabled.

### `GEMINI_MODEL`
* **Purpose:** Gemini model identifier.
* **Supported Models:** `gemini-1.5-flash`, `gemini-2.0-flash`.
* **Default:** `gemini-1.5-flash`.

### `CHAT_DAILY_CAP`
* **Purpose:** Rate limit on chatbot invocations.
* **Default:** `800`.

### `FRONTEND_URL`
* **Purpose:** Base URL of the frontend application used to generate password reset links in emails.
* **Example:** `https://jntucircle.com`
* **Required in Production:** Yes.

---

## Frontend Environment Variables (`andhra-circle-frontend/.env`)

### `VITE_BACKEND_URL`
* **Purpose:** Base URL of the backend API server.
* **Example:** `https://api.jntucircle.com`
* **Required in Production:** **Yes.** Production builds (`import.meta.env.PROD`) strictly require `VITE_BACKEND_URL` and throw a build/runtime error if unset; the `http://` localhost fallback is disabled in production.
