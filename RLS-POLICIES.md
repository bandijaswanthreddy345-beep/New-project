# Data Access Policies: JNTU Circle

**Database:** MongoDB Atlas (Mongoose ODM)  
**Security Architecture:** Application-layer document access control enforced via Express middleware (`middleware/auth.js`) and controller-level queries.

---

## Document Access Rules by Collection

### 1. `users`
* **Sensitive Fields:** `password` (bcrypt hash), `resetPasswordToken` (SHA-256 hash), `resetPasswordExpire` (timestamp), `tokenVersion`, `email`, `role`.
* **SELECT:**
  * Anonymous / Student: Cannot query the `users` collection directly.
  * Admin: Can read all users (`GET /api/users`), but `password`, `resetPasswordToken`, and `resetPasswordExpire` are projected out.
* **INSERT:**
  * Public registration (`POST /api/auth/register`): Role is hardcoded to `"student"`.
* **UPDATE:**
  * Admin: Can update user roles (`PUT /api/users/:id/role`), but cannot change their own role (`req.params.id === req.user._id` blocked).
  * Student: No profile update route currently exists in the backend API.
* **DELETE:**
  * Anonymous / Student: Denied.
  * Admin: Allowed (`DELETE /api/users/:id`), but blocked from deleting their own account (`req.params.id === req.user._id` blocked).

### 2. `notes`, `papers`, `syllabi`, `labprograms`
* **SELECT:** Publicly readable by all visitors (`GET /api/notes`, `/papers`, `/syllabus`, `/lab-programs` and single item `/:id`).
* **INSERT:** Admin only with `auth` middleware.
* **UPDATE:**
  * Content: Admin only with `auth` middleware. Allowed fields are whitelisted.
  * Public Counters: Open atomic increment endpoints for `like`, `view`, `download`.
* **DELETE:** Admin only with `auth` middleware.

### 3. `notifications`
* **SELECT:** Publicly readable.
* **INSERT:** Admin only with `auth` middleware, or automated background service (`services/jntuaSyncService.js`).
* **UPDATE:** Admin only with `auth` middleware (fields whitelisted). Public counter increments allowed.
* **DELETE:** Admin only with `auth` middleware.

### 4. `comments`
* **SELECT:** Publicly readable for a specific note (`GET /api/comments/note/:noteId`). The commenter's email is explicitly projected out (`.select("-email")`) and never returned publicly.
* **INSERT:** Publicly accessible (`POST /api/comments`) with rate limiting and length validation. Returned comment object omits `email`.
* **UPDATE:** Public atomic increment for `like` and `dislike`.
* **DELETE:** Admin only with `auth` middleware.

### 5. `userMaterial` (User Submissions)
* **SELECT:** Admin only (`GET /api/user-materials`).
* **INSERT:** Publicly accessible (`POST /api/user-materials`) with rate limiting, magic bytes verification, and file size limits.
* **DELETE:** Admin only with `auth` middleware. Deletes corresponding uploaded file from disk.

### 6. `auditlogs` (Admin Audit Trail)
* **SELECT:** Admin only (`GET /api/audit-logs`) with pagination and timestamp indexing.
* **INSERT:** Server-side internal creation on every admin POST, PUT, DELETE, and role change.
* **UPDATE:** Prohibited (append-only collection).
* **DELETE:** Prohibited (append-only collection).
