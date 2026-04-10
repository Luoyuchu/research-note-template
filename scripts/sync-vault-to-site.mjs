import path from "node:path";
import { fileURLToPath } from "node:url";

import { syncVaultToSite } from "./lib/sync-content.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "..");

const stats = await syncVaultToSite(repoRoot);
console.log(
  `[sync:content] copied ${stats.copiedMarkdownFiles} markdown files, ${stats.copiedStaticFiles} static files, rewrote ${stats.rewrittenAssetLinks} asset links, loaded ${stats.registryEntries} registry entries.`,
);

