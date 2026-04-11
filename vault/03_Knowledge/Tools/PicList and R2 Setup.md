---
title: PicList and R2 Setup
tags:
  - knowledge
  - tooling
---

# PicList and R2 Setup

## Goal

图片不进 Git 仓库，本地编辑仍然看本地文件，发布时再使用最终发布 URL。

## Checklist

- 配置 PicList 上传接口。
- 准备好 Cloudflare R2 或其他对象存储。
- 在 Obsidian Asset Relay 中填入 PicList endpoint。
- 让插件把本地图片规范化到 `image_assets/`。
- 提交 `.asset-registry/`，不要提交 `image_assets/`。

## Important Reminder

如果 PicList 最终把图片转换成了 WebP，也不要试图反向改写本地文件后缀。

如果 registry 中的 `remoteUrl` 指向的是 R2 S3 API 域名，而不是公开读域名：

- 继续信任它的对象路径与后缀
- 不直接信任它的 host
- 在构建时通过 `PUBLIC_ASSET_BASE_URL`，或 `vault/.asset-registry/config.json` 里的 `publicAssetBaseUrl`，替换成真正的公开图片域名

## Why This Lives In Knowledge

这是一条已经稳定下来的工作方法，而不是一次性的原始资料。

- 原始安装记录可以保留在 `04_Resources/`
- 最终可复用的操作结论放进 `03_Knowledge/Tools/`
