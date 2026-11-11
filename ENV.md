# ENV.md

**Status:** ACTIVE | **Owner:** JNTU Circle Core Infrastructure & Security | **Reviewed:** 2026-11-08  
**Scope:** Full-Stack Environment Architecture (`andhra-circle-backend` & `andhra-circle-frontend`)

---

## Variable Inventory

### 1. `PORT`
* **Purpose/provider:** HTTP port for Node.js / Express backend server.
* **Classification:** Intentionally public configuration (non-secret).
* **Required environments:** dev, staging, production.
* **Stored in:** Hosting service environment settings (e.g. Render / Railway / Docker `PORT`).
* **Read by:** `backend` (`server.js`).
* **Access owner:** DevOps / Infrastructure Lead | **Minimum permission:** Server runtime config.
* **Rotation procedure:** Update setting in hosting dashboard and redeploy.
* **Missing-value behavior:** Defaults safely to port `5000`.

---

### 2. `NODE_ENV`
* **Purpose/provider:** Execution environment mode (`development`, `staging`, `production`).
* **Classification:** Intentionally public configuration (non-secret).
* **Required environments:** dev, staging, production.
* **Stored in:** Hosting service environment settings / system runtime.
* **Read by:** `backend` (`server.js`, `scripts/security-check.js`).
* **Access owner:** DevOps / Infrastructure Lead.
* **Rotation procedure:** Change environment value in deployment pipeline.
* **Missing-value behavior:** Defaults to `development`. When set to `production`, server enforces strict `JWT_SECRET` strength validation and halts on weak keys.

---

### 3. `MONGO_URI`
* **Purpose/provider:** Connection URI for MongoDB Atlas cluster (includes username, host, and database user password).
* **Classification:** **CRITICAL SECRET**.
* **Required environments:** dev, staging, production.
* **Stored in:** Encrypted Secret Manager (e.g. Render Secrets / Railway Secrets / AWS SSM Parameter Store). **NEVER commit to Git or include in client bundles.**
* **Read by:** `backend` only (`config/db.js`).
* **Access owner:** Database Administrator | **Minimum permission:** `readWrite` on target database.
* **Rotation/revocation procedure:**
  1. Access MongoDB Atlas Console -> **Database Access**.
  2. Create a new password or secondary database user with identical privileges.
  3. Update `MONGO_URI` in production secret store.
  4. Trigger zero-downtime redeployment of backend service.
  5. Delete/revoke old database credentials in Atlas.
* **Missing-value behavior:** Process halts with fatal connection error; backend does not serve unauthenticated or mock data.

---

### 4. `JWT_SECRET`
* **Purpose/provider:** High-entropy HMAC-SHA256 signing key used to sign and verify session JSON Web Tokens.
* **Classification:** **CRITICAL SECRET**.
* **Required environments:** dev, staging, production.
* **Stored in:** Encrypted Secret Manager / Hosting Environment Variables.
* **Read by:** `backend` only (`server.js`, `middleware/auth.js`, `controllers/authController.js`).
* **Access owner:** Security Engineering Lead.
* **Rotation/revocation procedure:**
  1. Generate high-entropy secret (e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
  2. Update `JWT_SECRET` in secret store.
  3. Restart backend service. (Note: Immediately revokes and logs out all active user and admin sessions).
* **Missing-value behavior:** Server startup check in `server.js` detects missing or short key (< 32 chars) and throws fatal error in production (`process.exit(1)`).

---

### 5. `CORS_ORIGINS`
* **Purpose/provider:** Comma-separated whitelist of allowed frontend origins (e.g. `https://jntucircle.com,https://www.jntucircle.com`).
* **Classification:** Intentionally public configuration (non-secret).
* **Required environments:** staging, production (optional in dev for localhost testing).
* **Stored in:** Hosting service environment settings.
* **Read by:** `backend` (`server.js`).
* **Access owner:** Lead Full-Stack Engineer.
* **Rotation procedure:** Update variable in hosting settings and redeploy.
* **Missing-value behavior:** In development, empty value allows all origins for ease of mobile device testing. In production, must be explicitly specified to restrict cross-origin requests.

---

### 6. `EMAILJS_SERVICE_ID`
* **Purpose/provider:** EmailJS transaction service identifier for sending password reset emails.
* **Classification:** Secret / Private Configuration.
* **Required environments:** staging, production (dev if email testing required).
* **Stored in:** Hosting Secret Store / `.env`.
* **Read by:** `backend` only (`controllers/authController.js`).
* **Access owner:** Application Admin | **Minimum permission:** Email dispatch scope.
* **Rotation procedure:** Rotate service ID in EmailJS Dashboard and update backend environment settings.
* **Missing-value behavior:** Password reset fails gracefully with logged warning; does not expose internal errors to end-user.

---

### 7. `EMAILJS_TEMPLATE_ID`
* **Purpose/provider:** Template ID for password reset notification emails.
* **Classification:** Configuration identifier.
* **Required environments:** staging, production.
* **Stored in:** Hosting Secret Store / `.env`.
* **Read by:** `backend` only (`controllers/authController.js`).
* **Access owner:** Application Admin.
* **Rotation procedure:** Update in EmailJS Dashboard and secret store.
* **Missing-value behavior:** Email delivery fails gracefully.

---

### 8. `EMAILJS_PUBLIC_KEY`
* **Purpose/provider:** EmailJS API public account key.
* **Classification:** Provider account identifier.
* **Required environments:** staging, production.
* **Stored in:** Hosting Secret Store / `.env`.
* **Read by:** `backend` only (`controllers/authController.js`).
* **Access owner:** Application Admin.
* **Rotation procedure:** Regenerate in EmailJS settings and redeploy backend.
* **Missing-value behavior:** Email delivery fails.

---

### 9. `EMAILJS_PRIVATE_KEY`
* **Purpose/provider:** EmailJS backend secret key used to authorize API email requests.
* **Classification:** **HIGH-VALUE SECRET**.
* **Required environments:** staging, production.
* **Stored in:** Hosting Secret Store. **NEVER expose to client frontend.**
* **Read by:** `backend` only (`controllers/authController.js`).
* **Access owner:** Application Admin | **Minimum permission:** API key execution.
* **Rotation procedure:** Regenerate in EmailJS Console -> Account Security -> API Keys; immediately redeploy backend.
* **Missing-value behavior:** Email delivery fails.

---

### 10. `FRONTEND_URL`
* **Purpose/provider:** Base public URL of the React/Vite frontend (used to construct password reset links).
* **Classification:** Public URL configuration (e.g. `https://jntucircle.com`).
* **Required environments:** dev, staging, production.
* **Stored in:** Hosting settings / `.env`.
* **Read by:** `backend` (`controllers/authController.js`).
* **Access owner:** Frontend Lead.
* **Rotation procedure:** Update URL when domain or CDN changes.
* **Missing-value behavior:** In development defaults to `http://localhost:5173`.

---

### 11. `VITE_BACKEND_URL`
* **Purpose/provider:** Base URL of the backend API for client API requests (`axios`/`fetch`).
* **Classification:** Intentionally public client-side configuration.
* **Required environments:** dev, staging, production.
* **Stored in:** Frontend hosting environment settings (e.g. Vercel / Netlify build settings) or `.env` in `andhra-circle-frontend`.
* **Read by:** `client bundle` (`andhra-circle-frontend/src/...`).
* **Access owner:** Frontend Lead.
* **Rotation procedure:** Re-run frontend production build with updated URL.
* **Missing-value behavior:** In development falls back to `http://localhost:5000`.

---

## Repository Rules

1. **Commit Placeholder-Only Example:** Maintain `.env.example` in `andhra-circle-backend/` containing all required keys with dummy placeholder values only.
2. **Strict Git Ignore:** Both `.gitignore` in repo root and `andhra-circle-backend/.gitignore` must include `.env`, `.env.local`, and `*.env`.
3. **Automated Pre-Commit Checks:** Run `npm run security:check` in backend to automatically verify that `.env` is uncommitted and not indexed in Git cache.
4. **Vite Variable Isolation:** Never prefix backend secrets with `VITE_`. Any variable prefixed with `VITE_` is automatically baked into the public client-side JavaScript bundle and accessible to anyone using DevTools.
5. **No Secret Injections in Logs:** Do not print `process.env` objects to console.

---

## Exposure Response Procedure

If an API key, database URI, or secret is accidentally exposed (committed to GitHub, leaked in logs, or exposed to a client bundle):
1. **Immediate Revocation:**
   * **Database:** Go to MongoDB Atlas -> Database Access -> Immediately edit user and change password.
   * **JWT:** Generate a new 96-character random secret and restart backend instances.
   * **EmailJS:** Generate a new private key in EmailJS dashboard and delete the exposed key.
2. **Update Secret Store:** Deploy the newly rotated credentials to your production hosting environment.
3. **Audit History & Access Logs:** Check MongoDB Atlas access logs and EmailJS usage history for unauthorized activity during the exposure window.
4. **Git Cleansing:** If committed, run `git filter-repo` or BFG Repo-Cleaner to scrub the commit from Git history (note: scrubbing alone does not invalidate the secret; rotation is mandatory).

