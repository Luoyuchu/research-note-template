# Plugin Setup

这里默认你会在这个 vault 中安装 **Obsidian Asset Relay**。

## Why The Plugin Matters In This Template

这个模板故意不把图片写作和图片发布耦合在一起。

插件负责：

- 规范化本地图片路径
- 通过 PicList 上传
- 在 `vault/` 中维护 `.asset-registry/`

模板仓库负责：

- 在发布前读取 registry
- 把本地链接改写为远端 URL

## Recommended Setup Order

1. 在 Obsidian 中打开仓库里的 `vault/` 作为 vault
2. 安装 Obsidian Asset Relay
3. 配置 PicList upload / delete endpoint
4. 设置 `localAssetsPrefix = image_assets`
5. 运行一次扫描 / 上传
6. 确认出现 `vault/.asset-registry/`

## Git Rules

这个仓库已经预设：

- `vault/image_assets/` 被忽略
- `vault/.asset-registry/` 不被忽略

你需要额外确认的是：

- 首次运行后把 `vault/.asset-registry/` 提交到 Git
- 不要把本地原始图片重新纳入版本控制

## Important Design Reminder

不要把“本地图片丢失”当作远端删除信号。

因为：

- 图片本来就不提交到 Git
- 另一台机器没有本地文件是正常现象
- 删除判断应该依赖 registry 与引用状态，而不是本地文件是否存在

## After Plugin Install

如果你希望我下一步继续帮你细化插件安装后的仓库状态，可以在你完成下面操作后继续让我补：

1. 在这个 vault 中装好插件
2. 填完插件设置
3. 至少粘贴一张图片并完成一次扫描 / 上传

到那时我就能基于真实生成的 `vault/.asset-registry/` 再检查一遍仓库约定是否需要微调。
