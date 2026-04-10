import { watch } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadPublishConfig, normalizeRelativePath, syncVaultToSite } from "./lib/sync-content.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "..");
const publishConfigPath = path.join(repoRoot, "publish.config.json");
const publishConfig = await loadPublishConfig(publishConfigPath);
const vaultRoot = publishConfig.vaultDir ? path.join(repoRoot, publishConfig.vaultDir) : repoRoot;
const ignoredPrefixes = [".obsidian/", "image_assets/"];

let isSyncing = false;
let syncQueued = false;
let debounceTimer = null;

async function findAvailablePort(startPort) {
  for (let candidate = startPort; candidate < startPort + 50; candidate += 1) {
    const isAvailable = await new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(candidate);
    });

    if (isAvailable) {
      return candidate;
    }
  }

  throw new Error(`No free port found near ${startPort}.`);
}

function shouldIgnoreWatchPath(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  if (!normalized) {
    return true;
  }

  return ignoredPrefixes.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix));
}

async function runSync(reason) {
  if (isSyncing) {
    syncQueued = true;
    return;
  }

  isSyncing = true;
  try {
    const stats = await syncVaultToSite(repoRoot);
    console.log(
      `[dev] synced after ${reason}: ${stats.copiedMarkdownFiles} markdown, ${stats.copiedStaticFiles} static, ${stats.rewrittenAssetLinks} rewritten links.`,
    );
  } catch (error) {
    console.error("[dev] sync failed:", error);
  } finally {
    isSyncing = false;
    if (syncQueued) {
      syncQueued = false;
      await runSync("queued change");
    }
  }
}

function scheduleSync(reason) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runSync(reason);
  }, 250);
}

await runSync("initial startup");

const preferredHttpPort = Number(process.env.QUARTZ_PORT ?? "8080");
const preferredWsPort = Number(process.env.QUARTZ_WS_PORT ?? "3001");
const httpPort = await findAvailablePort(preferredHttpPort);
const wsPort = await findAvailablePort(preferredWsPort === httpPort ? preferredWsPort + 1 : preferredWsPort);

console.log(`[dev] Quartz preview http://localhost:${httpPort} (ws:${wsPort})`);

const quartzProcess = spawn(
  "npm",
  ["--prefix", ".site", "run", "quartz", "--", "build", "--serve", "--port", String(httpPort), "--wsPort", String(wsPort)],
  {
  cwd: repoRoot,
  stdio: "inherit"
  }
);

const vaultWatcher = watch(vaultRoot, { recursive: true }, (_eventType, filename) => {
  if (!filename) {
    return;
  }

  const relativePath = normalizeRelativePath(filename.toString());
  if (shouldIgnoreWatchPath(relativePath)) {
    return;
  }

  scheduleSync(relativePath);
});

const configWatcher = watch(publishConfigPath, () => {
  scheduleSync("publish.config.json");
});

function shutdown(code = 0) {
  vaultWatcher.close();
  configWatcher.close();
  quartzProcess.kill("SIGTERM");
  process.exit(code);
}

quartzProcess.on("exit", (code) => {
  vaultWatcher.close();
  configWatcher.close();
  process.exit(code ?? 0);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
