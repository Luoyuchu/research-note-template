# Vercel Setup

## What Vercel Should Do

Vercel 在这里承担的是构建和托管，不承担图片上传。

上传必须发生在本地，因为：

- 原始图片文件不进入 Git
- 远程构建环境拿不到这些本地文件

Vercel 真正要做的是：

1. 拉取仓库代码
2. 读取 `vault/.asset-registry/`
3. 在构建前把 Markdown 里的本地图片路径替换成最终发布 URL
4. 运行 Quartz 构建站点

## Recommended Project Settings

在 Vercel 新建项目时，仓库直接指向这个仓库。

建议设置：

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.site/public`

如果你启用密码保护，则把 Build Command 改成：

- `npm run build:secure`

## Environment Variables

默认公开发布时，这个模板不强依赖额外 env。

如果你启用 StatiCrypt，请配置：

- `STATICRYPT_PASSWORD`
  - 用于 `npm run build:secure`
  - 建议使用高强度长密码
- `STATICRYPT_TITLE`
  - 可选，自定义密码页标题
- `STATICRYPT_INSTRUCTIONS`
  - 可选，自定义密码页提示语
- `STATICRYPT_REMEMBER_DAYS`
  - 可选，记住密码的有效天数，默认 `0`

如果你的 registry 里记录的是上传 API 地址，而不是公开图片域名，请再配置：

- `PUBLIC_ASSET_BASE_URL`
  - 例如 `https://vis-wiki-image-bed.luoyuchu.org`
  - 构建时会用它替换 registry `remoteUrl` 的 host
  - 路径与后缀仍然取自 registry 中真实上传结果

如果你不想把这个值只放在 Vercel env 中，也可以把默认公开域名写进：

- `vault/.asset-registry/config.json`
  - 字段：`publicAssetBaseUrl`

优先级是：

1. `PUBLIC_ASSET_BASE_URL`
2. `vault/.asset-registry/config.json` 的 `publicAssetBaseUrl`
3. registry 中原始 `remoteUrl`

## Build Behavior

构建过程如下：

1. `npm run sync:content`
2. 从 `vault/` 提取可发布内容到 `.site/content/`
3. 依据 `vault/.asset-registry/` 改写图片链接
4. Quartz 输出到 `.site/public/`
5. 如果使用 `build:secure`，再对 HTML 做静态加密

## About Full Build vs Incremental Build

默认可以接受全量构建。

原因：

- 你的图片不参与站点构建
- 文本站点即使达到较大规模，Quartz 仍然通常足够快
- 真正显著变慢之前，没有必要先把系统复杂化

如果以后内容规模很大，再考虑给 Vercel 加缓存策略即可。
