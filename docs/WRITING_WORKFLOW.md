# Writing Workflow

## Default Daily Flow

### 1. 从 Daily Log 开始

每天优先打开当天日志，而不是先纠结文件夹归属。

你可以直接写：

- 今天做了什么
- 遇到什么报错
- 看到了哪篇论文
- AI 给了什么启发
- 截图说明了什么现象

### 2. 只在正文里打链接，不做重整理

例如：

- `[[02_Projects/Prj Visual Reasoning Lab]]`
- `[[05_Writing/Wri Visual Reasoning Lab Positioning Draft]]`
- `[[03_Knowledge/Theory/Th Visual Abstraction]]`
- `[[03_Knowledge/Papers/Pa Wu2024 Visual Reasoning Survey]]`

这样就足够了。

### 3. 需要复盘时回到项目页

真正需要整理时，再回到项目页：

- 摘出关键结论
- 更新下一步计划
- 链回支撑这些结论的 Daily Log

### 4. 需要交付时建立写作页

当内容开始变成：

- paper outline
- proposal
- advisor report
- section draft

就不要继续把这些东西塞进项目页。

应该在 `05_Writing/` 中建立交付物页面，然后：

- 保留写作骨架
- 链接回项目页中的实验和决策
- 链接回知识页中的概念和工具方法
- 链接回论文页中的文献依据

## Project vs Writing

不要在 `Writing` 中完整复制 `Project` 的结构。

- `Project` 回答的是：我们做了什么，为什么这么做，下一步是什么
- `Writing` 回答的是：我要怎么把它讲出来，写出来

`Writing` 应该只保留交付物所需的结构，例如：

- outline
- claims
- figures
- section draft
- revision log

## How To Handle AI Material

不要把大段 AI 原文直接塞进正式知识页。

推荐做法：

1. 原始文本进入 `04_Resources/AI_Raw/`
2. 在 Daily Log 中只摘录真正有用的 1 到 3 条结论
3. 项目推进相关内容进入 `02_Projects/`
4. 稳定可复用的方法进入 `03_Knowledge/`
5. 面向交付的表达进入 `05_Writing/`

## How To Handle Tool Material

不要把已经稳定下来的工具方法长期留在 `Resources`。

推荐做法：

1. 原始安装记录或文档摘录先放 `04_Resources/`
2. 真正验证过的做法再沉淀到 `03_Knowledge/Tools/`

## How To Handle Images

写作阶段：

- 正常粘贴图片
- 让 Obsidian Asset Relay 去规范化与上传
- 不要手动改成远端 URL

发布阶段：

- 同步脚本读取 registry
- 自动把本地图片链接替换成远端 `remoteUrl`

## Why This Workflow Works

它本质上把“采集”和“整理”拆开了。

- Daily Log 负责低阻力采集
- Project 页面负责执行层整理
- Knowledge 页面负责稳定结论沉淀
- Writing 页面负责交付物组织
- Resources 保留可追溯的原始材料

这比一开始就强迫自己分类更可持续。
