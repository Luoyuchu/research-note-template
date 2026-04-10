# Vault Structure

## Design Rule

不要试图靠文件夹完成全部知识组织。

文件夹只承担“粗粒度角色区分”，真正的连接依赖：

- 双向链接
- 项目页
- 写作页
- 理论页
- 论文页
- Daily Log

## Folder Roles

### `00_Inbox/`

临时碎片和待整理内容。

### `01_Daily_Logs/`

默认写作入口。

适合放：

- 当天实验过程
- 报错截图
- 灵感
- AI 摘录
- 论文阅读碎片

### `02_Projects/`

项目主控页。

不承担日记流，而承担：

- 项目目标
- 当前问题
- 决策记录
- 相关日记和知识索引

### `03_Knowledge/`

放稳定、可复用、跨项目的内容。

- `Theory/`
- `Papers/`
- `Topics/`
- `Tools/`

### `04_Resources/`

原始材料与低加工参考。

这里故意保留了 `AI_Raw/`，因为原始 AI 输出应该与正式知识分层。

### `05_Writing/`

交付物写作层。

适合放：

- outline
- section draft
- figure plan
- revision log
- advisor report / paper / proposal 这类 deliverable 的主控页

这里不应该复制整个项目结构，而应该链接回项目中的事实和证据。

### `99_Templates/`

只服务写作，不参与发布。

## Naming Guidance

对高频重复概念，建议使用前缀避免重名，但前缀直接写成普通文本，不要放进方括号。

- `Prj ...`
- `Wri ...`
- `Th ...`
- `Pa ...`
- `Top ...`

这不是为了好看，而是为了在 `[[` 自动补全时更快定位。

Quartz 兼容性约束：

- 文件名不要使用 `[` `]`
- 文件名不要使用 `#` 或 `|`
- 页面展示名称放在 frontmatter `title` 里，而不是靠特殊符号拼文件名

例如：

- 推荐：`Prj Visual Reasoning Lab.md`
- 不推荐：`[Prj] Visual Reasoning Lab.md`

## Practical Rule

写作时问自己一个问题：

“这是一条今天发生的事实、一个以后还会复用的稳定结论，还是一个正在成形的交付物？”

如果是前者，先写 Daily Log。
如果是稳定结论，再整理进项目页或知识页。
如果是在回答“我要怎么讲出来”，整理进 Writing。
