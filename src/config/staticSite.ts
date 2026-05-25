/** GitHub Pages 等纯静态部署：数据来自 public/static/site.json，不请求 Flask */
export const isStaticSite = import.meta.env.VITE_STATIC_SITE === 'true'
