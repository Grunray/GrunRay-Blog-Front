# GrunRay Blog Front

GrunRay Wiki 前端静态站，由 [GrunRay_wiki](https://github.com/Grunray/GrunRay-wiki) 的 `frontend/` 同步而来，通过 GitHub Pages 发布。

## 线上地址

- 站点：`https://grunray.github.io/GrunRay-Blog-Front/`
- 推荐入口（Hash 路由）：`https://grunray.github.io/GrunRay-Blog-Front/index.html#/`

## 本地开发

```bash
npm ci
npm run dev
```

需本地 Flask API（`127.0.0.1:5000`）或配置 `.env.local` 中的 `VITE_API_BASE_URL`。

## 发布

推送到 `main` 后，GitHub Actions **Deploy GitHub Pages** 自动构建并部署。

**Settings → Pages → Source** 请选择 **GitHub Actions**。

可选：在仓库 **Settings → Secrets and variables → Actions → Variables** 设置 `VITE_API_BASE_URL` 指向公网 API。

## 从 Wiki 同步

在 Wiki 仓库更新前端后，将 `frontend/`（及 `designed/xiqi_img/`）复制到本仓库并提交。
