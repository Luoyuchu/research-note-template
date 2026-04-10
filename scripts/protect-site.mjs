import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "..");
const sitePublicDir = path.join(repoRoot, ".site", "public");
const password = process.env.STATICRYPT_PASSWORD;

if (!password) {
  console.error("STATICRYPT_PASSWORD is required for npm run build:secure.");
  process.exit(1);
}

const title = process.env.STATICRYPT_TITLE ?? "Protected Research Notes";
const instructions = process.env.STATICRYPT_INSTRUCTIONS ?? "Enter the shared password to view this site.";
const rememberDays = process.env.STATICRYPT_REMEMBER_DAYS ?? "0";
const command = [
  "npx",
  "staticrypt",
  "*",
  "-r",
  "-d",
  ".",
  "--config",
  "false",
  "--short",
  "--remember",
  rememberDays,
  "--template-title",
  `"${title}"`,
  "--template-instructions",
  `"${instructions}"`
].join(" ");

const result = spawnSync(command, {
  cwd: sitePublicDir,
  shell: true,
  stdio: "inherit",
  env: process.env
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
