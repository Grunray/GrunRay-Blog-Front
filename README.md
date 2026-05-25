# GrunRay Blog Front

GrunRay Wiki 前端静态站，由 [GrunRay_wiki](https://github.com/Grunray/GrunRay-wiki) 同步而来，通过 GitHub Pages 发布。**不依赖 Flask API**，数据来自构建时打包的 `public/static/site.json` 与 `public/content/media/`。

## 线上地址

- 站点：`https://grunray.github.io/GrunRay-Blog-Front/`
- 推荐入口（Hash 路由）：`https://grunray.github.io/GrunRay-Blog-Front/index.html#/`

## 本地开发（静态数据）

```bash
npm ci
npm run dev
```

需先在 Wiki 仓库导出数据（见下），再复制到本仓库 `public/`。

## 从 Wiki 导出并更新数据

在 `GrunRay_wiki/backend`（已配置 `.env` 与数据库）：

```bash
. ./venv/Scripts/Activate.ps1
python scripts/content_tools/export_static_site.py --out E:/Project/GrunRay-Blog-Front/public
```

然后将 Wiki 的 `frontend/src` 等源码同步到本仓库（或在本仓库直接改前端后 `npm run build:github-pages`）。

## 发布

推送到 `main` 后，GitHub Actions **Deploy GitHub Pages** 自动构建并部署。

**Settings → Pages → Source** 请选择 **GitHub Actions**。

## 功能限制（静态站）

- 博客、项目、栖息、友链、留言列表等只读内容来自 `site.json`
- 发表留言、友链申请、站长审核等写操作不可用
