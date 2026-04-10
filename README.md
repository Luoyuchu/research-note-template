# Research Note Template

一个面向个人科研记录的单仓库模板：

- `vault/` 是日常写作用的 **Obsidian vault**
- 隐藏目录 `.site/` 是 **Quartz** 站点构建层
- 图片写作阶段保持本地链接
- 发布阶段依据 `vault/.asset-registry/` 替换为远端图床 URL

## 这个模板解决什么问题

它针对的是这样一条工作流：

1. 在 Obsidian Desktop 本地写 Markdown。
2. 日常记录以 Daily Log 为入口，低阻力写作。
3. 项目页、知识页、写作页承担后续整理和聚合。
4. 图片不提交到 Git。
5. 使用 Obsidian Asset Relay 在本地完成图片规范化与上传。
6. 使用 Quartz 在 Vercel 上构建发布站点。

## 为什么是单仓库

这里没有把“Obsidian 模板仓库”和“Vercel 站点仓库”拆成两个 repo。

原因很直接：

- 你的写作源文件仍然跟工程脚本放在同一个仓库里。
- `vault/.asset-registry/` 也仍然跟着同一个仓库走。
- 如果拆仓库，后续同步、引用、图片 registry 和发布规则会更难维护。

## 目录结构

```text
.
├── .site/                     # Quartz 构建层，故意隐藏以减少 vault 噪音
├── vault/                     # Obsidian authoring layer
│   ├── .obsidian/            # 可共享的 Obsidian 基础配置
│   ├── 00_Inbox/
│   ├── 01_Daily_Logs/
│   ├── 02_Projects/
│   ├── 03_Knowledge/         # Theory / Papers / Topics / Tools
│   ├── 04_Resources/         # AI raw / low-processed source materials
│   ├── 05_Writing/           # deliverable-facing drafts and outlines
│   ├── 99_Templates/
│   └── index.md
├── docs/                      # 仓库说明文档，不参与发布
├── scripts/                   # 同步与构建脚本
├── publish.config.json        # 发布白名单配置
├── user_requirement_design.md # 从原始 AI 对话提炼出的需求
└── package.json               # 仓库级命令入口
```

## 快速开始

### 1. 作为 Obsidian vault 打开

- 直接在 Obsidian 中打开 `vault/` 子目录。
- 启用 `Daily Notes` 和 `Templates`。
- 模板里已经提供了 `vault/.obsidian` 基础配置。

### 2. 安装 Obsidian Asset Relay

安装后至少做这几步：

1. 设置 `localAssetsPrefix = image_assets`
2. 设置 PicList upload / delete endpoint
3. 运行首次扫描与上传
4. 确认仓库中出现 `vault/.asset-registry/`

随后请检查 Git 状态：

- `vault/image_assets/` 应保持忽略
- `vault/.asset-registry/` 应提交到 Git

### 3. 本地构建站点

```bash
npm install
npm run build
```

构建前脚本会先做两件事：

1. 从 `vault/` 中拷贝可发布内容到 `.site/content/`
2. 根据 `vault/.asset-registry/` 把本地图片路径替换成远端 `remoteUrl`

## Structure Principle

这里推荐的分工是：

- `01_Daily_Logs/` 负责低阻力采集
- `02_Projects/` 负责项目执行与决策
- `03_Knowledge/` 负责稳定、可复用的知识
- `04_Resources/` 负责原始材料和低加工参考
- `05_Writing/` 负责面向交付的组织与成稿

`Project` 不应该直接承担完整写作稿件，`Writing` 也不应该复制 `Project` 的整个结构。

## Naming Rule

为了兼容 Quartz 的 wikilink 渲染，文件名尽量只用普通字符。

- 推荐：`Prj Visual Reasoning Lab.md`
- 不推荐：`[Prj] Visual Reasoning Lab.md`

特别是文件名里不要放：

- `[` `]`
- `#`
- `|`

原因不是 Obsidian 不能用，而是这些字符同时也是 Quartz wikilink 语法的一部分，容易导致站点正文中的 `[[...]]` 无法正确渲染成链接。

如果你想本地预览：

```bash
npm run dev
```

这个命令会：

- 先同步一次 vault 内容
- 启动 Quartz 本地预览
- 监听 vault 变化并重新同步
- 自动避开被占用的 websocket 端口

## 为什么图片本地链接不直接改成远端 URL

这是一个刻意保留的设计：

- 本地预览不依赖网络
- 本地写作不消耗图床流量
- 写作状态和发布状态分离
- Vercel 构建阶段只依赖 Markdown 与 registry，不依赖本地原图文件

## 为什么发布时优先信任 `remoteUrl`

PicList 可能会在上传时转换格式，例如：

- 本地文件：`abc123.png`
- 远端结果：`abc123.webp`

因此发布时不能只靠本地文件名推导最终 URL。

这个模板的同步脚本会优先读取 `vault/.asset-registry/` 中的 `remoteUrl`，而不是假设远端后缀与本地一致。

## 可选的密码保护

如果你要给导师一个简单密码而不是公开站点：

```bash
STATICRYPT_PASSWORD="your-strong-password" npm run build:secure
```

更多细节见 [docs/VERCEL_SETUP.md](docs/VERCEL_SETUP.md)。

## 推荐阅读顺序

- [user_requirement_design.md](user_requirement_design.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/VAULT_STRUCTURE.md](docs/VAULT_STRUCTURE.md)
- [docs/WRITING_WORKFLOW.md](docs/WRITING_WORKFLOW.md)
- [docs/PLUGIN_SETUP.md](docs/PLUGIN_SETUP.md)
- [docs/VERCEL_SETUP.md](docs/VERCEL_SETUP.md)
