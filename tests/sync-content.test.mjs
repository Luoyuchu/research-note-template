import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

import {
  isPublishedPath,
  loadAssetUrlMap,
  loadRegistryConfig,
  resolvePublishedAssetUrl,
  resolvePublicAssetBaseUrl,
  resolveVaultTarget,
  rewriteMarkdownAssetLinks,
  syncVaultToSite
} from "../scripts/lib/sync-content.mjs";

test("isPublishedPath keeps the publishing allowlist small and explicit", () => {
  const publish = {
    includeTopLevel: ["index.md", "01_Daily_Logs", "02_Projects", "03_Knowledge", "04_Resources", "05_Writing"],
    excludePaths: ["04_Resources/AI_Raw"]
  };

  assert.equal(isPublishedPath("01_Daily_Logs/2026-04-05.md", publish), true);
  assert.equal(isPublishedPath("05_Writing/draft.md", publish), true);
  assert.equal(isPublishedPath("04_Resources/AI_Raw/raw.md", publish), false);
  assert.equal(isPublishedPath("99_Templates/Daily Log Template.md", publish), false);
});

test("resolveVaultTarget normalizes relative and root-relative links", () => {
  assert.equal(
    resolveVaultTarget("01_Daily_Logs/2026-04-05.md", "../image_assets/2026/04/abc.png"),
    "image_assets/2026/04/abc.png"
  );
  assert.equal(
    resolveVaultTarget("02_Projects/Project.md", "/image_assets/2026/04/abc.png"),
    "image_assets/2026/04/abc.png"
  );
  assert.equal(resolveVaultTarget("02_Projects/Project.md", "https://example.com/a.png"), null);
});

test("rewriteMarkdownAssetLinks rewrites standard markdown image links", () => {
  const assetMap = new Map([["image_assets/2026/04/abc.png", "https://cdn.example.com/2026/04/abc.webp"]]);
  const markdown = "![Screenshot](../image_assets/2026/04/abc.png)";
  const rewritten = rewriteMarkdownAssetLinks(markdown, "02_Projects/Project.md", assetMap);

  assert.equal(rewritten.markdown, "![Screenshot](https://cdn.example.com/2026/04/abc.webp)");
  assert.equal(rewritten.replacedCount, 1);
});

test("rewriteMarkdownAssetLinks rewrites simple wiki embeds", () => {
  const assetMap = new Map([["image_assets/2026/04/abc.png", "https://cdn.example.com/2026/04/abc.webp"]]);
  const markdown = "![[../image_assets/2026/04/abc.png|Lab Figure]]";
  const rewritten = rewriteMarkdownAssetLinks(markdown, "02_Projects/Project.md", assetMap);

  assert.equal(rewritten.markdown, "![Lab Figure](https://cdn.example.com/2026/04/abc.webp)");
  assert.equal(rewritten.replacedCount, 1);
});

test("rewriteMarkdownAssetLinks supports vault-root style wiki embeds emitted by the asset plugin", () => {
  const assetMap = new Map([["image_assets/2026/04/abc.png", "https://cdn.example.com/2026/04/abc.webp"]]);
  const markdown = "![[image_assets/2026/04/abc.png]]";
  const rewritten = rewriteMarkdownAssetLinks(markdown, "01_Daily_Logs/2026-04-05.md", assetMap);

  assert.equal(rewritten.markdown, "![](https://cdn.example.com/2026/04/abc.webp)");
  assert.equal(rewritten.replacedCount, 1);
});

test("rewriteMarkdownAssetLinks supports vault-root style markdown image links emitted by the asset plugin", () => {
  const assetMap = new Map([["image_assets/2026/04/abc.png", "https://cdn.example.com/2026/04/abc.webp"]]);
  const markdown = "![Screenshot](image_assets/2026/04/abc.png)";
  const rewritten = rewriteMarkdownAssetLinks(markdown, "01_Daily_Logs/2026-04-05.md", assetMap);

  assert.equal(rewritten.markdown, "![Screenshot](https://cdn.example.com/2026/04/abc.webp)");
  assert.equal(rewritten.replacedCount, 1);
});

test("loadAssetUrlMap prefers remoteUrl from registry records", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "asset-registry-test-"));
  const assetDir = path.join(tempRoot, "assets", "2026", "04");
  await fs.mkdir(assetDir, { recursive: true });

  await fs.writeFile(
    path.join(assetDir, "abc123.json"),
    JSON.stringify(
      {
        localPath: "image_assets/2026/04/abc123.png",
        remoteUrl: "https://cdn.example.com/2026/04/abc123.webp",
        status: "uploaded"
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(
    path.join(assetDir, "deleted.json"),
    JSON.stringify(
      {
        localPath: "image_assets/2026/04/deleted.png",
        remoteUrl: "https://cdn.example.com/2026/04/deleted.webp",
        status: "deleted"
      },
      null,
      2
    ),
    "utf8"
  );

  const map = await loadAssetUrlMap(tempRoot);
  assert.equal(map.get("image_assets/2026/04/abc123.png"), "https://cdn.example.com/2026/04/abc123.webp");
  assert.equal(map.has("image_assets/2026/04/deleted.png"), false);
});

test("resolvePublishedAssetUrl can rebase registry URLs onto a public asset domain", () => {
  const publishedUrl = resolvePublishedAssetUrl(
    {
      localPath: "image_assets/2026/04/abc123.png",
      remoteUrl: "https://1234567890.r2.cloudflarestorage.com/2026/04/abc123.webp",
      status: "uploaded"
    },
    "https://vis-wiki-image-bed.luoyuchu.org"
  );

  assert.equal(publishedUrl, "https://vis-wiki-image-bed.luoyuchu.org/2026/04/abc123.webp");
});

test("loadAssetUrlMap can use a public asset base URL instead of the upload API host", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "asset-registry-public-base-"));
  const assetDir = path.join(tempRoot, "assets", "2026", "04");
  await fs.mkdir(assetDir, { recursive: true });

  await fs.writeFile(
    path.join(assetDir, "abc123.json"),
    JSON.stringify(
      {
        localPath: "image_assets/2026/04/abc123.png",
        remoteUrl: "https://1234567890.r2.cloudflarestorage.com/2026/04/abc123.webp",
        status: "uploaded"
      },
      null,
      2
    ),
    "utf8"
  );

  const map = await loadAssetUrlMap(tempRoot, {
    publicAssetBaseUrl: "https://vis-wiki-image-bed.luoyuchu.org"
  });

  assert.equal(
    map.get("image_assets/2026/04/abc123.png"),
    "https://vis-wiki-image-bed.luoyuchu.org/2026/04/abc123.webp"
  );
});

test("loadRegistryConfig reads optional public asset base settings from the registry config file", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "asset-registry-config-"));
  await fs.writeFile(
    path.join(tempRoot, "config.json"),
    JSON.stringify(
      {
        pluginId: "obsidian-asset-relay",
        publicAssetBaseUrl: "https://cdn-public.example.com",
        remoteBaseUrl: "https://upload-api.example.com",
        schemaVersion: 2
      },
      null,
      2
    ),
    "utf8"
  );

  const config = await loadRegistryConfig(tempRoot);
  assert.equal(config.publicAssetBaseUrl, "https://cdn-public.example.com");
  assert.equal(config.remoteBaseUrl, "https://upload-api.example.com");
});

test("resolvePublicAssetBaseUrl prefers env override and otherwise uses registry config", () => {
  assert.equal(
    resolvePublicAssetBaseUrl({
      envPublicAssetBaseUrl: "https://env.example.com",
      registryConfig: {
        publicAssetBaseUrl: "https://registry.example.com"
      }
    }),
    "https://env.example.com"
  );

  assert.equal(
    resolvePublicAssetBaseUrl({
      envPublicAssetBaseUrl: "",
      registryConfig: {
        publicAssetBaseUrl: "https://registry.example.com"
      }
    }),
    "https://registry.example.com"
  );
});

test("syncVaultToSite reads authored notes from vaultDir without adding the folder to published paths", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "vault-subdir-sync-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const dailyLogDir = path.join(vaultRoot, "01_Daily_Logs");
  const registryDir = path.join(vaultRoot, ".asset-registry", "assets", "2026", "04");

  await fs.mkdir(dailyLogDir, { recursive: true });
  await fs.mkdir(registryDir, { recursive: true });

  await fs.writeFile(
    path.join(tempRoot, "publish.config.json"),
    JSON.stringify(
      {
        vaultDir: "vault",
        siteDir: ".site",
        siteContentDir: ".site/content",
        registryDir: ".asset-registry",
        publish: {
          includeTopLevel: ["01_Daily_Logs"],
          excludePaths: []
        }
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(
    path.join(dailyLogDir, "2026-04-05.md"),
    "![Screenshot](../image_assets/2026/04/abc.png)\n",
    "utf8"
  );

  await fs.writeFile(
    path.join(registryDir, "abc.json"),
    JSON.stringify(
      {
        localPath: "image_assets/2026/04/abc.png",
        remoteUrl: "https://cdn.example.com/2026/04/abc.webp",
        status: "uploaded"
      },
      null,
      2
    ),
    "utf8"
  );

  await syncVaultToSite(tempRoot);

  const publishedDailyLog = await fs.readFile(
    path.join(tempRoot, ".site", "content", "01_Daily_Logs", "2026-04-05.md"),
    "utf8"
  );

  await assert.rejects(fs.stat(path.join(tempRoot, ".site", "content", "vault")));
  assert.equal(publishedDailyLog, "![Screenshot](https://cdn.example.com/2026/04/abc.webp)\n");
});

test("syncVaultToSite can use publicAssetBaseUrl from registry config when env override is absent", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "vault-public-base-from-registry-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const dailyLogDir = path.join(vaultRoot, "01_Daily_Logs");
  const registryRoot = path.join(vaultRoot, ".asset-registry");
  const registryDir = path.join(registryRoot, "assets", "2026", "04");

  await fs.mkdir(dailyLogDir, { recursive: true });
  await fs.mkdir(registryDir, { recursive: true });

  await fs.writeFile(
    path.join(tempRoot, "publish.config.json"),
    JSON.stringify(
      {
        vaultDir: "vault",
        siteDir: ".site",
        siteContentDir: ".site/content",
        registryDir: ".asset-registry",
        publish: {
          includeTopLevel: ["01_Daily_Logs"],
          excludePaths: []
        }
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(
    path.join(registryRoot, "config.json"),
    JSON.stringify(
      {
        pluginId: "obsidian-asset-relay",
        publicAssetBaseUrl: "https://cdn-public.example.com",
        remoteBaseUrl: "https://upload-api.example.com",
        schemaVersion: 2
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(
    path.join(dailyLogDir, "2026-04-05.md"),
    "![Screenshot](../image_assets/2026/04/abc.png)\n",
    "utf8"
  );

  await fs.writeFile(
    path.join(registryDir, "abc.json"),
    JSON.stringify(
      {
        localPath: "image_assets/2026/04/abc.png",
        remoteUrl: "https://upload-api.example.com/2026/04/abc.webp",
        status: "uploaded"
      },
      null,
      2
    ),
    "utf8"
  );

  await syncVaultToSite(tempRoot);

  const publishedDailyLog = await fs.readFile(
    path.join(tempRoot, ".site", "content", "01_Daily_Logs", "2026-04-05.md"),
    "utf8"
  );

  assert.equal(publishedDailyLog, "![Screenshot](https://cdn-public.example.com/2026/04/abc.webp)\n");
});

test("syncVaultToSite skips hidden files and system junk inside published folders", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "vault-skip-hidden-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const resourcesDir = path.join(vaultRoot, "04_Resources");

  await fs.mkdir(resourcesDir, { recursive: true });

  await fs.writeFile(
    path.join(tempRoot, "publish.config.json"),
    JSON.stringify(
      {
        vaultDir: "vault",
        siteDir: ".site",
        siteContentDir: ".site/content",
        registryDir: ".asset-registry",
        publish: {
          includeTopLevel: ["04_Resources"],
          excludePaths: []
        }
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(path.join(resourcesDir, "README.md"), "# Resources\n", "utf8");
  await fs.writeFile(path.join(resourcesDir, ".DS_Store"), "junk", "utf8");
  await fs.writeFile(path.join(resourcesDir, "Thumbs.db"), "junk", "utf8");

  await syncVaultToSite(tempRoot);

  const publishedReadme = await fs.readFile(
    path.join(tempRoot, ".site", "content", "04_Resources", "README.md"),
    "utf8"
  );

  assert.equal(publishedReadme, "# Resources\n");
  await assert.rejects(fs.stat(path.join(tempRoot, ".site", "content", "04_Resources", ".DS_Store")));
  await assert.rejects(fs.stat(path.join(tempRoot, ".site", "content", "04_Resources", "Thumbs.db")));
});

test("syncVaultToSite preserves source file modification times for published notes", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "vault-preserve-mtime-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const knowledgeDir = path.join(vaultRoot, "03_Knowledge");
  const sourceFile = path.join(knowledgeDir, "README.md");

  await fs.mkdir(knowledgeDir, { recursive: true });

  await fs.writeFile(
    path.join(tempRoot, "publish.config.json"),
    JSON.stringify(
      {
        vaultDir: "vault",
        siteDir: ".site",
        siteContentDir: ".site/content",
        registryDir: ".asset-registry",
        publish: {
          includeTopLevel: ["03_Knowledge"],
          excludePaths: []
        }
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(sourceFile, "# Knowledge\n", "utf8");

  const expectedTime = new Date("2026-04-05T08:30:00.000Z");
  await fs.utimes(sourceFile, expectedTime, expectedTime);

  await syncVaultToSite(tempRoot);

  const publishedStat = await fs.stat(path.join(tempRoot, ".site", "content", "03_Knowledge", "README.md"));
  assert.equal(publishedStat.mtime.toISOString(), expectedTime.toISOString());
});
