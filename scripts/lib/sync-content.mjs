import { promises as fs } from "node:fs";
import path from "node:path";

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown", ".mdx"]);
const REGISTRY_ASSET_ROOT = ["assets"];
const SKIPPED_SOURCE_NAMES = new Set(["Thumbs.db"]);

export function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

export function normalizeRelativePath(value) {
  const normalized = path.posix.normalize(toPosixPath(value).replace(/^\/+/, ""));
  return normalized === "." ? "" : normalized;
}

export async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function loadPublishConfig(configPath) {
  const config = await loadJson(configPath);
  return {
    vaultDir: normalizeRelativePath(config.vaultDir ?? ""),
    siteDir: normalizeRelativePath(config.siteDir),
    siteContentDir: normalizeRelativePath(config.siteContentDir),
    registryDir: normalizeRelativePath(config.registryDir),
    publish: {
      includeTopLevel: [...(config.publish?.includeTopLevel ?? [])],
      excludePaths: [...(config.publish?.excludePaths ?? [])].map(normalizeRelativePath)
    }
  };
}

export function isPublishedPath(relativePath, publishConfig) {
  const normalized = normalizeRelativePath(relativePath);
  if (!normalized) {
    return false;
  }

  const topLevelName = normalized.split("/")[0];
  const included = publishConfig.includeTopLevel.some((entry) => {
    const target = normalizeRelativePath(entry);
    return normalized === target || normalized.startsWith(`${target}/`) || topLevelName === target;
  });

  if (!included) {
    return false;
  }

  return !publishConfig.excludePaths.some((excluded) => {
    return normalized === excluded || normalized.startsWith(`${excluded}/`);
  });
}

async function walkFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function shouldUseRegistryRecord(record) {
  return Boolean(record?.localPath && record?.remoteUrl && record?.status !== "deleted");
}

function shouldSkipSourceName(name) {
  return name.startsWith(".") || SKIPPED_SOURCE_NAMES.has(name);
}

export async function loadAssetUrlMap(registryRoot) {
  const assetRoot = path.join(registryRoot, ...REGISTRY_ASSET_ROOT);
  const map = new Map();

  try {
    const stat = await fs.stat(assetRoot);
    if (!stat.isDirectory()) {
      return map;
    }
  } catch {
    return map;
  }

  const files = await walkFiles(assetRoot);
  for (const file of files) {
    if (path.extname(file) !== ".json") {
      continue;
    }

    const record = await loadJson(file);
    if (!shouldUseRegistryRecord(record)) {
      continue;
    }

    map.set(normalizeRelativePath(record.localPath), record.remoteUrl);
  }

  return map;
}

export function resolveVaultTarget(noteRelativePath, rawTarget) {
  const trimmed = rawTarget.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("data:")) {
    return null;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) {
    return null;
  }

  const [targetWithoutHash] = trimmed.split("#", 1);
  const [targetWithoutQuery] = targetWithoutHash.split("?", 1);
  const cleanTarget = targetWithoutQuery.replace(/^<|>$/g, "");
  if (!cleanTarget) {
    return null;
  }

  if (cleanTarget.startsWith("/")) {
    return normalizeRelativePath(cleanTarget.slice(1));
  }

  return normalizeRelativePath(path.posix.join(path.posix.dirname(noteRelativePath), cleanTarget));
}

function resolveAssetRemoteUrl(noteRelativePath, rawTarget, assetUrlByLocalPath) {
  const resolvedTarget = resolveVaultTarget(noteRelativePath, rawTarget);
  if (resolvedTarget) {
    const remoteUrl = assetUrlByLocalPath.get(resolvedTarget);
    if (remoteUrl) {
      return remoteUrl;
    }
  }

  const normalizedTarget = normalizeRelativePath(rawTarget.replace(/^\/+/, ""));
  if (!normalizedTarget) {
    return null;
  }

  return assetUrlByLocalPath.get(normalizedTarget) ?? null;
}

function splitMarkdownTarget(rawTargetSegment) {
  const trimmed = rawTargetSegment.trim();
  if (!trimmed) {
    return { target: "", trailing: "" };
  }

  if (trimmed.startsWith("<")) {
    const closingIndex = trimmed.indexOf(">");
    if (closingIndex !== -1) {
      return {
        target: trimmed.slice(1, closingIndex),
        trailing: trimmed.slice(closingIndex + 1)
      };
    }
  }

  const whitespaceIndex = trimmed.search(/\s/);
  if (whitespaceIndex === -1) {
    return { target: trimmed, trailing: "" };
  }

  return {
    target: trimmed.slice(0, whitespaceIndex),
    trailing: trimmed.slice(whitespaceIndex)
  };
}

function renderWikiReplacement(remoteUrl, label) {
  if (!label) {
    return `![](${remoteUrl})`;
  }

  if (/^\d+(x\d+)?$/i.test(label.trim())) {
    return `![](${remoteUrl})`;
  }

  return `![${label.trim()}](${remoteUrl})`;
}

export function rewriteMarkdownAssetLinks(markdown, noteRelativePath, assetUrlByLocalPath) {
  let replacedCount = 0;

  const rewrittenMarkdown = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (fullMatch, altText, rawTargetSegment) => {
    const { target, trailing } = splitMarkdownTarget(rawTargetSegment);
    const remoteUrl = resolveAssetRemoteUrl(noteRelativePath, target, assetUrlByLocalPath);
    if (!remoteUrl) {
      return fullMatch;
    }

    replacedCount += 1;
    const preservedTrailing = trailing ?? "";
    return `![${altText}](${remoteUrl}${preservedTrailing})`;
  });

  const finalMarkdown = rewrittenMarkdown.replace(/!\[\[([^\]]+)\]\]/g, (fullMatch, inner) => {
    const [targetPart, labelPart] = inner.split("|", 2);
    const remoteUrl = resolveAssetRemoteUrl(noteRelativePath, targetPart, assetUrlByLocalPath);
    if (!remoteUrl) {
      return fullMatch;
    }

    replacedCount += 1;
    return renderWikiReplacement(remoteUrl, labelPart);
  });

  return {
    markdown: finalMarkdown,
    replacedCount
  };
}

async function ensureCleanDirectory(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}

async function preserveFileTimes(destinationPath, sourceStat) {
  await fs.utimes(destinationPath, sourceStat.atime, sourceStat.mtime);
}

async function copyIntoSiteContent(sourcePath, destinationPath, context, stats) {
  const stat = await fs.stat(sourcePath);
  if (shouldSkipSourceName(path.basename(sourcePath))) {
    return;
  }

  if (stat.isDirectory()) {
    await fs.mkdir(destinationPath, { recursive: true });
    const entries = await fs.readdir(sourcePath);
    for (const entry of entries) {
      if (shouldSkipSourceName(entry)) {
        continue;
      }

      const childSource = path.join(sourcePath, entry);
      const childRelative = normalizeRelativePath(path.relative(context.vaultRoot, childSource));
      if (!isPublishedPath(childRelative, context.publishConfig.publish)) {
        continue;
      }

      const childDestination = path.join(destinationPath, entry);
      await copyIntoSiteContent(childSource, childDestination, context, stats);
    }
    return;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  const extension = path.extname(sourcePath).toLowerCase();
  if (MARKDOWN_EXTENSIONS.has(extension)) {
    const sourceMarkdown = await fs.readFile(sourcePath, "utf8");
    const relativePath = normalizeRelativePath(path.relative(context.vaultRoot, sourcePath));
    const rewritten = rewriteMarkdownAssetLinks(sourceMarkdown, relativePath, context.assetUrlByLocalPath);
    await fs.writeFile(destinationPath, rewritten.markdown, "utf8");
    await preserveFileTimes(destinationPath, stat);
    stats.copiedMarkdownFiles += 1;
    stats.rewrittenAssetLinks += rewritten.replacedCount;
    return;
  }

  await fs.copyFile(sourcePath, destinationPath);
  await preserveFileTimes(destinationPath, stat);
  stats.copiedStaticFiles += 1;
}

export async function syncVaultToSite(repoRoot) {
  const configPath = path.join(repoRoot, "publish.config.json");
  const config = await loadPublishConfig(configPath);
  const vaultRoot = config.vaultDir ? path.join(repoRoot, config.vaultDir) : repoRoot;
  const siteContentDir = path.join(repoRoot, config.siteContentDir);
  const registryDir = path.join(vaultRoot, config.registryDir);
  const assetUrlByLocalPath = await loadAssetUrlMap(registryDir);

  await ensureCleanDirectory(siteContentDir);
  await fs.writeFile(path.join(siteContentDir, ".gitkeep"), "", "utf8");

  const stats = {
    copiedMarkdownFiles: 0,
    copiedStaticFiles: 0,
    rewrittenAssetLinks: 0,
    registryEntries: assetUrlByLocalPath.size
  };

  const context = {
    repoRoot,
    vaultRoot,
    publishConfig: config,
    assetUrlByLocalPath
  };

  for (const entry of config.publish.includeTopLevel) {
    const sourcePath = path.join(vaultRoot, entry);
    try {
      await fs.stat(sourcePath);
    } catch {
      continue;
    }

    const destinationPath = path.join(siteContentDir, entry);
    await copyIntoSiteContent(sourcePath, destinationPath, context, stats);
  }

  return stats;
}
