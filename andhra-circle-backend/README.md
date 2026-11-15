# Andhra Circle (JNTU Circle) Backend

Backend API service for Andhra Circle (JNTU Circle) academic resource portal.

---

## 1. Database Configuration: Local MongoDB

### Active Database
* **Database Type**: **Local MongoDB** (viewable in MongoDB Compass)
* **Database Host**: `127.0.0.1:27017`
* **Database Name**: **`andhra-circle`**
* **Connection Fallback**: If `MONGO_URI` is not set, `config/db.js` automatically defaults to `mongodb://127.0.0.1:27017/andhra-circle`.

> [!IMPORTANT]
> **Data Storage & Backup Boundary**:
> All academic resources, user accounts, and comments now live **strictly on this computer** inside the local MongoDB service. Data is **not backed up to any cloud provider** unless you run the automated backup script:
> ```bash
> node scripts/backup-db.js
> ```

---

## 2. Startup Logs & Health Endpoints

When the server starts, it logs the database type, database name, and host without printing the connection string:

```json
{"level":"info","time":"...","message":"Server started","port":"5000","url":"http://localhost:5000","env":"development"}
{"level":"info","time":"...","message":"MongoDB connection state: CONNECTED"}
{"level":"info","time":"...","message":"MongoDB Connected Successfully","databaseType":"Local MongoDB","database":"andhra-circle","host":"127.0.0.1"}
```

If the connection string has no database name specified, it warns:
`"WARNING: MongoDB connection string has no database name specified. It will default to 'test' or MongoDB default."`

### Health & Readiness Endpoints
* **`GET /healthz`**: Checks Node.js process uptime.
* **`GET /readyz`**: 
  * If MongoDB is running: returns `200 OK` (`{"status":"ready","database":"connected","name":"andhra-circle","host":"127.0.0.1"}`).
  * If MongoDB is stopped: returns `503 Service Unavailable` with message:
    `"MongoDB is not running at 127.0.0.1:27017. Start the MongoDB service."`
* **API Database Routes**: If MongoDB is disconnected, all API routes return HTTP `503` with a clear actionable error message.

---

## 3. Routine Backup & Restore

### One-line Routine Backup
Run this command from `andhra-circle-backend`:
```bash
node scripts/backup-db.js
```
Exports all collections into a dated local archive inside `backups/backup-<timestamp>/` with a `manifest.json`.

### Safe Restore / Dry Run
To test restoring into an isolated scratch database (`andhra-circle-test`) without touching live data:
```bash
node scripts/restore-db.js
```

---

## 4. Index Maintenance
To rebuild all text, compound, soft-delete, and TTL indexes on the local database:
```bash
npm run build:indexes
```
To inspect existing indexes and collection telemetry:
```bash
node scripts/db-inspect.js
```
