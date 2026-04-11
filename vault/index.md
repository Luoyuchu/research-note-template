---
title: Research Note Template
tags:
  - hub
---

# Research Note Template

这个仓库同时承担两件事：

1. 它是一个可以直接打开的 **Obsidian vault**。
2. 它也是一个可以交给 **Quartz + Vercel** 构建的网站仓库。

## 入口

- [[01_Daily_Logs/2026-04-05|Daily Logs]]
- [[02_Projects/Prj Visual Reasoning Lab|Projects]]
- [[03_Knowledge/Topics/Top Visual Reasoning|Knowledge]]
- [[05_Writing/Wri Visual Reasoning Lab Positioning Draft|Writing]]
- [[04_Resources/README|Resources]]

## Folder Guides

- [[00_Inbox/README|Inbox Guide]]
- [[01_Daily_Logs/README|Daily Logs Guide]]
- [[02_Projects/README|Projects Guide]]
- [[03_Knowledge/README|Knowledge Guide]]
- [[04_Resources/README|Resources Guide]]
- [[05_Writing/README|Writing Guide]]
- [[99_Templates/README|Templates Guide]]

## Start Here

- 今天要开始工作：[[01_Daily_Logs/README|Daily Logs Guide]]
- 想看项目层：[[02_Projects/README|Projects Guide]]
- 想看知识层：[[03_Knowledge/README|Knowledge Guide]]

## Common Moves

- 有一个新碎片：先放 `Inbox` 或 `Daily`
- 有一个稳定判断：整理进 `Project` 或 `Knowledge`
- 要开始成稿：转入 `Writing`

## Workflow Map

1. 先在 `00_Inbox/`、`01_Daily_Logs/` 或 `04_Resources/` 中低阻力采集。
2. 当内容开始稳定时，分别沉淀到 `02_Projects/` 或 `03_Knowledge/`。
3. 当内容开始面向交付时，在 `05_Writing/` 中重组表达。
4. 最终靠链接把过程、知识、来源和成稿串起来，而不是靠复制全文。

## 工作原则

- 写作时优先在日记中无摩擦记录。
- Project 管执行过程，Writing 管交付表达。
- 重要内容再沉淀到项目页、知识页或写作页。
- 图片在本地写作时保持本地链接。
- 发布时再根据 `.asset-registry/` 把本地图片路径替换成最终发布 URL。
- 文件名避免使用 `[` `]` `#` `|`，以免 Quartz 无法正确渲染 wikilink。
