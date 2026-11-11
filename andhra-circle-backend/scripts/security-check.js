#!/usr/bin/env node
/* =========================================================
   Andhra Circle - automated security self-check

   Run it before every release (and after every big change):

       cd andhra-circle-backend
       npm run security:check

   It looks for the risks listed in /THREAT_MODEL.md and exits with
   code 1 when it finds a HIGH problem, so it can also block a deploy.

   No dependencies. Everything is read-only.
   ========================================================= */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(ROOT, "..");

const findings = [];
const add = (severity, id, title, detail) =>
  findings.push({ severity, id, title, detail });

const read = (file) => {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
};

/* ---------------------------------------------------------
   Helpers: find the text between balanced parentheses
   --------------------------------------------------------- */
function balancedArgs(source, openIndex) {
  let depth = 0;
  let inString = null;

  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];

    if (inString) {
      if (ch === "\\") i++;
      else if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") inString = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return source.slice(openIndex + 1, i);
    }
  }
  return "";
}

/* ---------------------------------------------------------
   CHECK 1: mutating routes that anyone can call (no `auth`)
   --------------------------------------------------------- */

// Routes that are public ON PURPOSE. Everything else that changes data
// must sit behind the admin `auth` middleware.
// Format: "METHOD /full/path" (regex allowed).
const INTENTIONALLY_PUBLIC = [
  /^POST \/api\/auth\/(register|login|forgot-password|reset-password\/:token)$/,
  /^PUT \/api\/(notes|papers|syllabus|lab-programs|notifications)\/:id\/(like|view|download)$/,
  /^POST \/api\/comments$/,
  /^PUT \/api\/comments\/:id\/(like|dislike)$/,
  /^POST \/api\/user-materials$/,
  /^POST \/api\/chat(\/feedback)?$/,
];

function checkRoutes() {
  const server = read(path.join(ROOT, "server.js"));
  if (!server) {
    add("MEDIUM", "R0", "server.js not found", "Could not check route protection.");
    return;
  }

  // variable name -> route file   (const noteRoutes = require("./routes/noteRoutes"))
  const vars = {};
  for (const m of server.matchAll(
    /const\s+(\w+)\s*=\s*require\(\s*["']\.\/routes\/([\w-]+)["']\s*\)/g
  )) {
    vars[m[1]] = m[2];
  }

  // find every app.use("/prefix", ...)
  const mounts = [];
  const useRegex = /app\.use\(/g;
  let match;
  while ((match = useRegex.exec(server))) {
    const args = balancedArgs(server, match.index + "app.use".length);
    const prefix = args.match(/^\s*["'`]([^"'`]+)["'`]/);
    if (!prefix) continue;

    let file = null;
    const inline = args.match(/require\(\s*["']\.\/routes\/([\w-]+)["']\s*\)/);
    if (inline) file = inline[1];
    else {
      for (const [v, f] of Object.entries(vars)) {
        if (new RegExp(`\\b${v}\\b`).test(args)) file = f;
      }
    }
    if (!file) continue;

    mounts.push({
      prefix: prefix[1],
      file,
      protectedAtMount: /\bauth\b/.test(args.replace(/require\([^)]*\)/g, "")),
    });
  }

  for (const mount of mounts) {
    const source = read(path.join(ROOT, "routes", `${mount.file}.js`));
    const routeRegex = /router\.(get|post|put|patch|delete)\(/g;
    let m;

    while ((m = routeRegex.exec(source))) {
      const method = m[1].toUpperCase();
      if (method === "GET") continue; // reads are covered by the data review

      const args = balancedArgs(source, m.index + m[0].length - 1);
      const routePath = args.match(/^\s*["'`]([^"'`]*)["'`]/);
      if (!routePath) continue;

      const full = `${method} ${mount.prefix}${routePath[1] === "/" ? "" : routePath[1]}`;
      const hasAuth =
        mount.protectedAtMount ||
        /(^|[\s,(])auth([\s,)]|$)/.test(args.slice(routePath[0].length));

      if (hasAuth) continue;
      if (INTENTIONALLY_PUBLIC.some((re) => re.test(full))) continue;

      add(
        "HIGH",
        "R1",
        `Unprotected route: ${full}`,
        `routes/${mount.file}.js changes data but has no auth middleware. ` +
          `Add \`auth\`, or add it to INTENTIONALLY_PUBLIC if it must be open.`
      );
    }
  }
}

/* ---------------------------------------------------------
   CHECK 2: secrets
   --------------------------------------------------------- */
function checkSecrets() {
  const env = read(path.join(ROOT, ".env"));
  const values = {};
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) values[m[1]] = m[2];
  }

  // Fallback to process.env if .env file is not present (e.g. in CI environments)
  const secret = values.JWT_SECRET || process.env.JWT_SECRET || "";
  if (!secret) {
    add("HIGH", "S1", "JWT_SECRET is not set", "Logins cannot be trusted without it.");
  } else if (
    secret.length < 32 ||
    /my_super_secret|changeme|secret_key|password|123456/i.test(secret)
  ) {
    add(
      "HIGH",
      "S1",
      "JWT_SECRET is weak",
      "Use 32+ random characters: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }

  const emailJsId = values.EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID || "";
  if (!emailJsId) {
    add(
      "MEDIUM",
      "S2",
      "EMAILJS_SERVICE_ID is missing",
      "Password-reset emails cannot be sent until it is set in .env."
    );
  }

  if (values.MONGO_URI && /\/\/[^/@\s]+:[^/@\s]+@/.test(values.MONGO_URI)) {
    add(
      "INFO",
      "S3",
      "Database password lives in .env",
      "Fine locally. Rotate it if .env was ever shared, committed or pasted anywhere, " +
        "and keep Atlas 'Network Access' limited to your server's IP."
    );
  }

  // Is .env protected from git?
  const ignores = [
    read(path.join(ROOT, ".gitignore")),
    read(path.join(REPO_ROOT, ".gitignore")),
  ].join("\n");

  if (!/^\s*\.env\s*$/m.test(ignores)) {
    add("HIGH", "S4", ".env is not git-ignored", "Add `.env` to .gitignore.");
  }

  // Best effort: was .env ever added to git's index?
  const index = path.join(REPO_ROOT, ".git", "index");
  if (fs.existsSync(index)) {
    const bytes = fs.readFileSync(index).toString("latin1");
    if (/andhra-circle-backend\/\.env\x00|(^|\x00)\.env\x00/.test(bytes)) {
      add(
        "HIGH",
        "S5",
        ".env is tracked by git",
        "Run: git rm --cached andhra-circle-backend/.env  and ROTATE every secret inside it " +
          "(it stays in git history)."
      );
    }
  }
}

/* ---------------------------------------------------------
   CHECK 3: secrets leaking into logs
   --------------------------------------------------------- */
function checkLogging() {
  const dirs = ["controllers", "middleware", "routes", "services"];
  const risky = /console\.(log|info|debug)\([^;]*(token|password|resetUrl|secret|authorization)/i;

  for (const dir of dirs) {
    const folder = path.join(ROOT, dir);
    if (!fs.existsSync(folder)) continue;

    for (const file of fs.readdirSync(folder)) {
      if (!file.endsWith(".js")) continue;

      read(path.join(folder, file))
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (risky.test(line) && !/\/\/.*console/.test(line)) {
            add(
              "MEDIUM",
              "L1",
              `Sensitive value may be logged: ${dir}/${file}:${i + 1}`,
              line.trim().slice(0, 100)
            );
          }
        });
    }
  }
}

/* ---------------------------------------------------------
   CHECK 4: uploaded files that could run in a browser
   --------------------------------------------------------- */
function checkUploads() {
  const folder = path.join(ROOT, "uploads");
  if (!fs.existsSync(folder)) return;

  const safe = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp"]);
  const odd = fs
    .readdirSync(folder)
    .filter((f) => !safe.has(path.extname(f).toLowerCase()));

  if (odd.length) {
    add(
      "MEDIUM",
      "U1",
      `${odd.length} file(s) in uploads/ are not PDF/image`,
      `${odd.slice(0, 5).join(", ")}${odd.length > 5 ? ", ..." : ""} - ` +
        "review and delete them (the server already forces them to download)."
    );
  }
}

/* ---------------------------------------------------------
   CHECK 5: dependencies
   --------------------------------------------------------- */
function checkDependencies() {
  let pkg = {};
  try {
    pkg = JSON.parse(read(path.join(ROOT, "package.json")));
  } catch {
    /* ignore */
  }

  const suspicious = {
    j: "Not used by the code and pulls in spreadsheet libraries with known issues. Remove: npm uninstall j",
  };
  for (const [name, why] of Object.entries(suspicious)) {
    if (pkg.dependencies && pkg.dependencies[name]) {
      add("MEDIUM", "D1", `Unneeded dependency: ${name}`, why);
    }
  }

  try {
    const out = execSync("npm audit --omit=dev --json", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 60000,
    });
    reportAudit(out);
  } catch (error) {
    // npm audit exits non-zero when it finds problems; the report is on stdout
    if (error.stdout) reportAudit(String(error.stdout));
    else add("INFO", "D2", "npm audit could not run", "Check your internet connection and run it by hand.");
  }
}

function reportAudit(raw) {
  try {
    const v = JSON.parse(raw).metadata?.vulnerabilities || {};
    const critical = v.critical || 0;
    const high = v.high || 0;
    const moderate = v.moderate || 0;

    if (critical || high) {
      add(
        "HIGH",
        "D2",
        `npm audit: ${critical} critical, ${high} high vulnerabilities`,
        "Run: npm audit fix   (review changes, then test)."
      );
    } else if (moderate) {
      add("MEDIUM", "D2", `npm audit: ${moderate} moderate vulnerabilities`, "Run: npm audit");
    }
  } catch {
    /* ignore unreadable audit output */
  }
}

/* ---------------------------------------------------------
   CHECK 6: Error handler hides details in production
   --------------------------------------------------------- */
function checkErrorHandler(serverSource) {
  const server = serverSource !== undefined ? serverSource : read(path.join(ROOT, "server.js"));
  const errHandlerMatch = server.match(
    /app\.use\(\s*\(\s*err\s*,\s*req\s*,\s*res\s*,\s*next\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\);/
  );
  if (!errHandlerMatch) {
    add("HIGH", "E1", "Global error handler not found", "server.js must define app.use((err, req, res, next) => ...)");
    return;
  }
  const handlerBody = errHandlerMatch[1];
  const hasProdCheck = /NODE_ENV\s*===?\s*["']production["']|isProd/.test(handlerBody);
  const returnsRawErr = /message\s*:\s*err\.message\b/.test(handlerBody);
  if (returnsRawErr && !hasProdCheck) {
    add(
      "HIGH",
      "E1",
      "Error handler returns err.message unconditionally",
      "In production, return a generic message ('Internal server error') and log details on the server."
    );
  }
}

/* ---------------------------------------------------------
   CHECK 7: CORS_ORIGINS enforced in production
   --------------------------------------------------------- */
function checkCorsConfig(serverSource) {
  const server = serverSource !== undefined ? serverSource : read(path.join(ROOT, "server.js"));
  const hasCorsProdEnforcement =
    /NODE_ENV\s*===?\s*["']production["'][\s\S]*?CORS_ORIGINS[\s\S]*?process\.exit\(1\)/.test(server) ||
    /CORS_ORIGINS[\s\S]*?NODE_ENV\s*===?\s*["']production["'][\s\S]*?process\.exit\(1\)/.test(server);

  if (!hasCorsProdEnforcement) {
    add(
      "HIGH",
      "C1",
      "CORS_ORIGINS is not enforced in production",
      "In production, server.js must refuse to start (exit 1) if CORS_ORIGINS is unset or empty."
    );
  }
}

/* ---------------------------------------------------------
   CHECK 8: Mass assignment in Mongoose updates (req.body directly)
   --------------------------------------------------------- */
function checkMongooseUpdates(controllersDir) {
  const folder = controllersDir || path.join(ROOT, "controllers");
  if (!fs.existsSync(folder)) return;

  const updateWithReqBody = /\.(findByIdAndUpdate|updateOne|updateMany)\s*\(\s*[^,]+,\s*req\.body\b/;

  for (const file of fs.readdirSync(folder)) {
    if (!file.endsWith(".js")) continue;
    const content = read(path.join(folder, file));
    const lines = content.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (updateWithReqBody.test(line)) {
        add(
          "HIGH",
          "M1",
          `Mongoose update using req.body directly: ${file}:${i + 1}`,
          "Whitelist allowed fields instead of passing req.body directly to update."
        );
      }
    });
  }
}

/* ---------------------------------------------------------
   CHECK 9: Admin routes have audit logging
   --------------------------------------------------------- */
function checkAdminAuditLogging(controllersDir) {
  const ctrlFolder = controllersDir || path.join(ROOT, "controllers");
  if (!fs.existsSync(ctrlFolder)) return;

  const requiredAudits = [
    { file: "paperController.js", actions: ["createPaper", "updatePaper", "deletePaper"] },
    { file: "noteController.js", actions: ["createNote", "updateNote", "deleteNote"] },
    { file: "syllabusController.js", actions: ["createSyllabus", "updateSyllabus", "deleteSyllabus"] },
    { file: "labProgramController.js", actions: ["createLabProgram", "updateLabProgram", "deleteLabProgram"] },
    { file: "notificationController.js", actions: ["createNotification", "updateNotification", "deleteNotification"] },
    { file: "userController.js", actions: ["updateUserRole", "deleteUser"] },
    { file: "commentController.js", actions: ["deleteComment"] },
    { file: "userMaterialController.js", actions: ["deleteUserMaterial"] },
  ];

  for (const { file, actions } of requiredAudits) {
    const fullPath = path.join(ctrlFolder, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = read(fullPath);

    for (const action of actions) {
      const fnIdx = content.indexOf(`exports.${action}`);
      if (fnIdx === -1) continue;
      const nextFnIdx = content.indexOf(`exports.`, fnIdx + 8);
      const fnEnd = nextFnIdx !== -1 ? nextFnIdx : content.length;
      const fnBody = content.slice(fnIdx, fnEnd);
      if (!fnBody.includes("recordAuditLog")) {
        add(
          "HIGH",
          "A1",
          `Admin action missing audit log: ${file} -> ${action}`,
          "Write an entry to the AuditLog for every admin create, update, delete, or role change."
        );
      }
    }
  }
}

/* ---------------------------------------------------------
   CHECK 10: TRUST_PROXY configuration and documentation
   --------------------------------------------------------- */
function checkTrustProxy(serverSource, envExampleSource) {
  const server = serverSource !== undefined ? serverSource : read(path.join(ROOT, "server.js"));
  const envExample = envExampleSource !== undefined ? envExampleSource : read(path.join(ROOT, ".env.example"));

  const serverHasTrustProxy =
    /process\.env\.TRUST_PROXY/.test(server) &&
    /app\.set\(\s*["']trust proxy["']/.test(server);

  if (!serverHasTrustProxy) {
    add(
      "MEDIUM",
      "T1",
      "TRUST_PROXY is not configurable in server.js",
      "Configure app.set('trust proxy', ...) using process.env.TRUST_PROXY so rate limiting sees client IPs behind proxies."
    );
  }

  const exampleHasTrustProxy = /TRUST_PROXY/.test(envExample);
  if (!exampleHasTrustProxy) {
    add(
      "MEDIUM",
      "T2",
      "TRUST_PROXY note missing in .env.example",
      "Document TRUST_PROXY in .env.example and explain its importance when running behind a reverse proxy."
    );
  }
}

/* ---------------------------------------------------------
   RUN + REPORT
   --------------------------------------------------------- */
checkRoutes();
checkSecrets();
checkLogging();
checkUploads();
checkDependencies();
checkErrorHandler();
checkCorsConfig();
checkMongooseUpdates();
checkAdminAuditLogging();
checkTrustProxy();

module.exports = {
  checkRoutes,
  checkSecrets,
  checkLogging,
  checkUploads,
  checkDependencies,
  checkErrorHandler,
  checkCorsConfig,
  checkMongooseUpdates,
  checkAdminAuditLogging,
  checkTrustProxy,
  findings,
  add,
};

if (require.main === module) {
  runReport();
}

function runReport() {
  const order = { HIGH: 0, MEDIUM: 1, INFO: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  console.log("\nAndhra Circle security check\n" + "=".repeat(30));

  if (!findings.length) {
    console.log("No problems found.");
  }

  for (const f of findings) {
    console.log(`\n[${f.severity}] ${f.id}  ${f.title}\n      ${f.detail}`);
  }

  const high = findings.filter((f) => f.severity === "HIGH").length;
  const medium = findings.filter((f) => f.severity === "MEDIUM").length;

  console.log(
    `\nResult: ${high} high, ${medium} medium, ${findings.length - high - medium} info\n`
  );

  process.exit(high > 0 ? 1 : 0);
}
