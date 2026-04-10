# Architecture

## System Overview

这个模板把系统拆成两层：

1. **Authoring layer**
   - `vault/` 子目录
   - Obsidian 直接打开 `vault/` 并写作
   - 保留本地图片链接

2. **Publishing layer**
   - 隐藏目录 `.site/`
   - Quartz 只消费同步后的 `content/`
   - 构建前会根据 `vault/.asset-registry/` 改写图片链接

## Data Flow

### 写作阶段

1. 你在 `vault/` 目录写笔记。
2. 日记是默认入口。
3. 图片先由 Obsidian Asset Relay 规范化并本地上传。
4. 笔记内容仍保持本地图片路径。

### 发布阶段

1. `npm run build` 先执行 `scripts/sync-vault-to-site.mjs`
2. 同步脚本读取 `publish.config.json`
3. 只有 `vault/` 中白名单内容被复制到 `.site/content/`
4. 同步脚本读取 `vault/.asset-registry/assets/**/*.json`
5. 把 Markdown 中的本地图片链接替换成最终发布 URL
6. Quartz 从 `.site/content/` 渲染最终站点

## Why Vault Subdirectory + Hidden Site

如果把 Quartz 直接放在仓库根目录并把 `content/` 当作主写作区，会有两个问题：

1. 你需要在 Quartz 的内容约束里写作，而不是在自己的 vault 里写作。
2. 构建目录、配置文件、站点资源会持续干扰 Obsidian 文件视图。

因此这里选择：

- `vault/` 作为真实知识库
- 根目录保留脚本、依赖和仓库文档
- `.site/` 作为站点构建工作区

## Why Publish-Time Asset Replacement

本地图片不会进入 Git。

这意味着 Vercel 构建时看不到原始图片文件，所以构建阶段不能再做“上传”这件事。

Vercel 仍然可以做的事情只有：

- 读取 Markdown
- 读取 registry
- 根据本地路径找到对应远端 URL
- 改写文本中的图片链接

这正是这个模板里的同步脚本所做的工作。

## Public Asset Base URL

有些上传工具会把 R2 的 S3 API 地址写进 registry，例如：

- `https://<account>.r2.cloudflarestorage.com/...`

这类地址适合上传接口或 API 访问，但不一定适合作为静态站图片的公开读地址。

因此模板支持一个可选环境变量：

- `PUBLIC_ASSET_BASE_URL`

设置后，同步脚本会：

1. 读取 registry 中的 `remoteUrl`
2. 保留其中真实对象路径和后缀
3. 把 host 部分替换成你的公开图片域名

例如：

- registry: `https://<account>.r2.cloudflarestorage.com/2026/04/example.webp`
- env: `PUBLIC_ASSET_BASE_URL=https://vis-wiki-image-bed.luoyuchu.org`
- publish: `https://vis-wiki-image-bed.luoyuchu.org/2026/04/example.webp`

## Why Not Only Use `desiredRemotePath`

PicList 或后端图床可能发生：

- 改后缀
- 改编码格式
- 改最终 URL 结构

因此：

- `desiredRemotePath` 只是期望值
- `remoteUrl` 的路径部分才是更接近发布事实的结果
- 如果上传 host 和公开 host 不同，则通过 `PUBLIC_ASSET_BASE_URL` 做 host 重写

## Scope Boundary

这个模板不负责：

- 在构建时重新上传图片
- 从丢失的本地图片推断删除远端资源
- 自动整理你的知识结构

它负责的是：

- 提供一个清晰的 vault 骨架
- 提供可维护的同步与构建入口
- 把图片发布映射稳定落在 `vault/.asset-registry/`
