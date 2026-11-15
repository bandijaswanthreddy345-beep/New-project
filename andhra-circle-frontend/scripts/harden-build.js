import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, "../dist/assets");

if (!fs.existsSync(assetsDir)) {
  console.error("❌ dist/assets directory not found. Please run 'npm run build' first.");
  process.exit(1);
}

console.log("🛡️  Starting BLA (Blind LLM Agents) Anti-Reverse-Engineering hardening pass...");

const files = fs.readdirSync(assetsDir).filter(
  (f) => f.endsWith(".js") && !f.startsWith("vendor-") && !f.startsWith("rolldown-")
);

console.log(`📦 Found ${files.length} custom application bundles to protect (vendor chunks excluded for stability).`);

let protectedCount = 0;

for (const file of files) {
  const filePath = path.join(assetsDir, file);
  try {
    console.log(`🛡️  Hardening ${file}...`);
    execSync(`npx bla-agents protect "${filePath}" --in-place --intensity balanced --allow-lane-independent`, {
      stdio: "ignore",
    });
    protectedCount++;
  } catch (err) {
    console.warn(`⚠️  Skipped ${file} during BLA pass: ${err.message}`);
  }
}

console.log(`✅ BLA Hardening Complete: ${protectedCount}/${files.length} application bundles secured against Autonomous REAs.`);
