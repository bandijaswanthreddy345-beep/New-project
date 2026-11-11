# RLS-POLICIES.md

**Status:** ACTIVE | **Database:** MongoDB Atlas 7.0+ (Mongoose 9.x ODM)  
**Owner:** JNTU Circle Data Security Team | **Schema Location:** `andhra-circle-backend/models/`

> **Note on Architecture:** MongoDB is a document database and does not provide SQL-native Row-Level Security (RLS) policies like PostgreSQL. In this stack, **Row/Document-Level Security is strictly enforced by application-layer server authorization** (`middleware/auth.js` and Mongoose controller queries). The policies documented below define the strict document boundaries and access rules enforced on every database operation.

---

## Policy Inventory by Collection

### 1. Collection: `users`
* **Sensitive fields:** `password` (bcrypt hash), `resetPasswordToken` (SHA-256 hash), `resetPasswordExpire` (timestamp), `email`, `role`.
* **Owner column:** `_id`
* **Trusted identity source:** Verified JWT token payload (`decoded.id`) via `req.user`.
* **SELECT:**
  * **Anonymous / Student:** Cannot query the `users` collection directly. (Public views only receive sanitized author names embedded in notes/comments).
  * **Admin:** Can read all users (`GET /api/users`), but `password`, `resetPasswordToken`, and `resetPasswordExpire` are explicitly projected out (`-password -resetPasswordToken -resetPasswordExpire`).
* **INSERT:**
  * **Public / Anonymous:** Allowed via `POST /api/auth/register`. Role is strictly hardcoded to `"student"`.
  * **Admin:** Can create accounts via administrative provisioning.
* **UPDATE:**
  * **Student:** Allowed to update own profile details.
  * **Admin:** Can update any user's role (`PUT /api/users/:id/role`), but cannot modify their own role (`req.params.id === req.user._id` check).
* **DELETE:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Can delete any user (`DELETE /api/users/:id`), but blocked from deleting their own account (`req.params.id === req.user._id` check).

---

### 2. Collection: `notes`
* **Sensitive fields:** None (public academic curriculum).
* **Owner column:** Institutional Resource (Admin Managed).
* **Trusted identity source:** `middleware/auth.js` (`req.user.role === "admin"`).
* **SELECT:**
  * **Anonymous / Student:** Can view all notes (`GET /api/notes`, `GET /api/notes/:id`).
* **INSERT:**
  * **Anonymous / Student:** Denied (`401` / `403`).
  * **Admin:** Allowed (`POST /api/notes`) with multi-part PDF file upload.
* **UPDATE:**
  * **Anonymous / Student:** Denied for content edits. Can increment atomic public engagement counters (`PUT /api/notes/:id/like`, `/view`, `/download`).
  * **Admin:** Full update permissions (`PUT /api/notes/:id`).
* **DELETE:**
  * **Anonymous / Student:** Denied (`401` / `403`).
  * **Admin:** Allowed (`DELETE /api/notes/:id`).

---

### 3. Collection: `papers` (Question Papers)
* **Sensitive fields:** None (public exam archives).
* **Owner column:** Institutional Resource (Admin Managed).
* **Trusted identity source:** `middleware/auth.js` (`req.user.role === "admin"`).
* **SELECT:**
  * **Anonymous / Student:** Allowed (`GET /api/papers`, `GET /api/papers/:id`).
* **INSERT:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (`POST /api/papers`).
* **UPDATE:**
  * **Anonymous / Student:** Denied for content. Public counter increments allowed.
  * **Admin:** Allowed (`PUT /api/papers/:id`).
* **DELETE:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (`DELETE /api/papers/:id`).

---

### 4. Collection: `syllabi` (Curriculum Syllabi)
* **Sensitive fields:** None.
* **Owner column:** Institutional Resource (Admin Managed).
* **Trusted identity source:** `middleware/auth.js` (`req.user.role === "admin"`).
* **SELECT:**
  * **Anonymous / Student:** Allowed (`GET /api/syllabus`, `GET /api/syllabus/:id`).
* **INSERT:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (`POST /api/syllabus`).
* **UPDATE:**
  * **Anonymous / Student:** Denied for curriculum content.
  * **Admin:** Allowed (`PUT /api/syllabus/:id`).
* **DELETE:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (`DELETE /api/syllabus/:id`).

---

### 5. Collection: `labprograms` (Lab Manuals & Code)
* **Sensitive fields:** None.
* **Owner column:** Institutional Resource (Admin Managed).
* **Trusted identity source:** `middleware/auth.js` (`req.user.role === "admin"`).
* **SELECT:**
  * **Anonymous / Student:** Allowed (`GET /api/lab-programs`, `GET /api/lab-programs/:id`).
* **INSERT:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (`POST /api/lab-programs`).
* **UPDATE:**
  * **Anonymous / Student:** Denied for program source. Public counters allowed.
  * **Admin:** Allowed (`PUT /api/lab-programs/:id`).
* **DELETE:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (`DELETE /api/lab-programs/:id`).

---

### 6. Collection: `notifications` (University Circulars & Results)
* **Sensitive fields:** None.
* **Owner column:** Institutional / Automated Service.
* **Trusted identity source:** `middleware/auth.js` OR Background Auto-Sync Service.
* **SELECT:**
  * **Anonymous / Student:** Allowed (`GET /api/notifications`, `GET /api/notifications/:id`).
* **INSERT:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (`POST /api/notifications`).
  * **Background Service:** Allowed via internal `jntuaSyncService.js`.
* **UPDATE:**
  * **Anonymous / Student:** Denied for title/description/link. Counters allowed.
  * **Admin:** Allowed (`PUT /api/notifications/:id`).
* **DELETE:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (`DELETE /api/notifications/:id`).

---

### 7. Collection: `comments`
* **Sensitive fields:** `email` (private commenter email).
* **Owner column:** `email` / Creator attribution.
* **Trusted identity source:** Express controller parameter validation (`commentController.js`).
* **SELECT:**
  * **Anonymous / Student:** Allowed (`GET /api/comments/note/:noteId`). **CRITICAL RULE:** The `email` field is strictly stripped via Mongoose projection (`.select("-email")`) so public viewers cannot scrape student email addresses.
  * **Admin:** Allowed.
* **INSERT:**
  * **Anonymous / Student:** Allowed (`POST /api/comments`) with rate limiting (max 10 / 10 min) and string coercion to prevent injection.
* **UPDATE:**
  * **Anonymous / Student:** Only like/dislike counter increments (`PUT /api/comments/:id/like`, `/dislike`).
  * **Admin:** Moderation updates.
* **DELETE:**
  * **Anonymous / Student:** Denied (`401` / `403`).
  * **Admin:** Allowed (`DELETE /api/comments/:id`) via `auth` middleware.

---

### 8. Collection: `usermaterials` (Student Upload Submissions)
* **Sensitive fields:** `email`, `fileUrl` (unreviewed user upload), `comment`.
* **Owner column:** `email`.
* **Trusted identity source:** `middleware/auth.js` (`req.user.role === "admin"`).
* **SELECT:**
  * **Anonymous / Student:** Denied (`GET /api/user-materials` requires `auth`). Unreviewed uploads are never listed publicly.
  * **Admin:** Allowed (`GET /api/user-materials`).
* **INSERT:**
  * **Anonymous / Student:** Allowed (`POST /api/user-materials`) subject to 10 uploads/hour rate limit, 20MB file cap, and MIME validation. Document defaults to `status: "pending"`.
* **UPDATE:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (to update status to `approved` or `rejected`).
* **DELETE:**
  * **Anonymous / Student:** Denied.
  * **Admin:** Allowed (`DELETE /api/user-materials/:id`). Triggers physical file deletion from `uploads/` via `fs.unlink`.

---

## Deployment & Database Access Review

1. **MongoDB Atlas Database Users:**
   * The application connects using a dedicated MongoDB Atlas database user with read/write access scoped exclusively to the application database (e.g. `readWrite@andhra-circle`).
   * Administrative Atlas actions (cluster resizing, user creation, database dropping) require separate Atlas IAM credentials and are never exposed in application environment variables.
2. **Network Access / IP Whitelisting:**
   * Production deployment must replace `0.0.0.0/0` in MongoDB Atlas Network Access with the specific static IP address or CIDR range of the backend application hosting server (e.g. Render / AWS / DigitalOcean droplet IP).
3. **No Direct Client Database Connections:**
   * MongoDB connection URI is strictly kept on the server (`MONGO_URI`). No database drivers or connection credentials ever enter the frontend client bundle.

---

## Test Matrix

| Actor | Target Resource / Table | Operation | Expected Result | Actual Result | Verification Evidence |
|---|---|---|---|---|---|
| **Student (Priya)** | `notes` | `DELETE /api/notes/:id` | **DENIED (403)** | Denied with `"Access denied. Admin only."` | `middleware/auth.js` role check |
| **Anonymous** | `users` | `GET /api/users` | **DENIED (401)** | Denied with `"No token provided. Please login."` | `middleware/auth.js` presence check |
| **Anonymous** | `comments` | `GET /api/comments/note/:id` | **ALLOWED (Redacted)** | Comments returned without `email` property | `commentController.js:68` (`.select("-email")`) |
| **Student (Priya)** | `comments` | `DELETE /api/comments/:id` | **DENIED (403)** | Denied with `"Access denied. Admin only."` | `commentRoutes.js:46` protected by `auth` |
| **Anonymous** | `user-materials` | `GET /api/user-materials` | **DENIED (401)** | Denied with `"No token provided."` | `userMaterialRoutes.js:14` protected by `auth` |
| **Admin (Rahul)** | `users` | `PUT /api/users/<own_id>/role` | **DENIED (400)** | Denied with `"You cannot change your own role."` | `userController.js:33` self-lock guard |
| **Admin (Rahul)** | `users` | `DELETE /api/users/<own_id>` | **DENIED (400)** | Denied with `"You cannot delete your own account."` | `userController.js:84` self-delete guard |
| **Admin (Rahul)** | `notes` | `POST /api/notes` | **ALLOWED (201)** | Note created with module PDFs | `noteController.js` executed under admin JWT |

