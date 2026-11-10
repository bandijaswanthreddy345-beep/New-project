const path = require("path");
const fs = require("fs");
const {
  checkErrorHandler,
  checkCorsConfig,
  checkMongooseUpdates,
  checkAdminAuditLogging,
  checkTrustProxy,
  findings,
  add,
} = require("./security-check");

console.log("=================================================");
console.log("PROVING SECURITY CHECK EXTENSIONS ON BAD FIXTURES");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 5;

// FIXTURE 1: Leaking err.message in error handler
findings.length = 0;
const badServerErrHandler = `
const app = express();
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message });
});
`;
checkErrorHandler(badServerErrHandler);
const f1 = findings.find((f) => f.id === "E1");
if (f1) {
  console.log("✅ Check 1 PASSED: Flagged leaking err.message fixture:");
  console.log(`   [${f1.severity}] ${f1.title} -> ${f1.detail}\n`);
  passedTests++;
} else {
  console.error("❌ Check 1 FAILED to flag bad error handler fixture.\n");
}

// FIXTURE 2: CORS_ORIGINS unset in production
findings.length = 0;
const badServerNoCors = `
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",");
app.use(cors({ origin: allowedOrigins }));
`;
checkCorsConfig(badServerNoCors);
const f2 = findings.find((f) => f.id === "C1");
if (f2) {
  console.log("✅ Check 2 PASSED: Flagged missing CORS_ORIGINS production check fixture:");
  console.log(`   [${f2.severity}] ${f2.title} -> ${f2.detail}\n`);
  passedTests++;
} else {
  console.error("❌ Check 2 FAILED to flag missing CORS_ORIGINS check fixture.\n");
}

// FIXTURE 3: Mongoose update directly using req.body (mass assignment)
findings.length = 0;
const tempFixturesDir = path.join(__dirname, "temp-bad-fixtures");
if (!fs.existsSync(tempFixturesDir)) fs.mkdirSync(tempFixturesDir, { recursive: true });
fs.writeFileSync(
  path.join(tempFixturesDir, "badController.js"),
  `exports.updatePaper = async (req, res) => {
    const paper = await Paper.findByIdAndUpdate(req.params.id, req.body, { new: true });
  };`
);
checkMongooseUpdates(tempFixturesDir);
const f3 = findings.find((f) => f.id === "M1");
if (f3) {
  console.log("✅ Check 3 PASSED: Flagged req.body directly in Mongoose update fixture:");
  console.log(`   [${f3.severity}] ${f3.title} -> ${f3.detail}\n`);
  passedTests++;
} else {
  console.error("❌ Check 3 FAILED to flag req.body mass assignment fixture.\n");
}

// FIXTURE 4: Admin modifying action missing audit log
findings.length = 0;
fs.writeFileSync(
  path.join(tempFixturesDir, "paperController.js"),
  `exports.createPaper = async (req, res) => { res.json({ ok: 1 }); };
   exports.updatePaper = async (req, res) => { res.json({ ok: 1 }); };
   exports.deletePaper = async (req, res) => { res.json({ ok: 1 }); };`
);
checkAdminAuditLogging(tempFixturesDir);
const f4 = findings.find((f) => f.id === "A1");
if (f4) {
  console.log("✅ Check 4 PASSED: Flagged missing audit log in admin action fixture:");
  console.log(`   [${f4.severity}] ${f4.title} -> ${f4.detail}\n`);
  passedTests++;
} else {
  console.error("❌ Check 4 FAILED to flag admin action missing audit log fixture.\n");
}

// Clean up temp fixtures dir
fs.rmSync(tempFixturesDir, { recursive: true, force: true });

// FIXTURE 5: Missing TRUST_PROXY in server.js and .env.example
findings.length = 0;
const badServerNoTrust = `const app = express();`;
const badEnvExample = `# PORT=5000\nNODE_ENV=development`;
checkTrustProxy(badServerNoTrust, badEnvExample);
const f5_1 = findings.find((f) => f.id === "T1");
const f5_2 = findings.find((f) => f.id === "T2");
if (f5_1 && f5_2) {
  console.log("✅ Check 5 PASSED: Flagged missing TRUST_PROXY configuration and note:");
  console.log(`   [${f5_1.severity}] ${f5_1.title}`);
  console.log(`   [${f5_2.severity}] ${f5_2.title}\n`);
  passedTests++;
} else {
  console.error("❌ Check 5 FAILED to flag missing TRUST_PROXY note.\n");
}

console.log("=================================================");
console.log(`SUMMARY: ${passedTests}/${totalTests} new security checks verified on fixtures!`);
console.log("=================================================");
if (passedTests !== totalTests) process.exit(1);
