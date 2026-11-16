import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "andhra-circle-frontend");
const rootDist = path.join(__dirname, "dist");
const frontendDist = path.join(frontendDir, "dist");

console.log("📦 Installing frontend dependencies...");
execSync("npm install", { cwd: frontendDir, stdio: "inherit" });

console.log("⚡ Building frontend with Vite...");
execSync("npm run build", { cwd: frontendDir, stdio: "inherit" });

console.log("📁 Mirroring build output to root ./dist and ./public...");
if (fs.existsSync(rootDist)) {
  fs.rmSync(rootDist, { recursive: true, force: true });
}
fs.cpSync(frontendDist, rootDist, { recursive: true });

const rootPublic = path.join(__dirname, "public");
if (fs.existsSync(rootPublic)) {
  fs.rmSync(rootPublic, { recursive: true, force: true });
}
fs.cpSync(frontendDist, rootPublic, { recursive: true });

console.log("✅ Build complete! Assets ready in ./dist, ./public, and ./andhra-circle-frontend/dist");
