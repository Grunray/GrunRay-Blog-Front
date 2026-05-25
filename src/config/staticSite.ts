/** GitHub Pages 等纯静态部署：数据打包在 site.bundle.json，不请求 Flask */
export const isStaticSite =
  import.meta.env.VITE_STATIC_SITE === 'true' || import.meta.env.MODE === 'github-pages'
