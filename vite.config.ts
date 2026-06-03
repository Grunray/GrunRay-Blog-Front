import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const base = env.VITE_BASE_PATH || '/'

  return {
  base,
  plugins: [vue()],
  build: {
    // Rolldown(Vite 8 内置打包器)的 CSS minifier 会把同值的
    // `backdrop-filter` 与 `-webkit-backdrop-filter` 误判为重复声明并删掉标准属性，
    // 只保留 -webkit- 前缀版（见 .card 液态玻璃卡片）。Firefox 等不认 -webkit- 别名的
    // 浏览器因此丢失毛玻璃模糊，卡片退化成纯半透明（"透明玻璃"）。dev 不压缩 CSS 故正常。
    // 改用 esbuild 压缩 CSS：它逐属性保留 vendor 前缀，不做跨前缀去重。
    cssMinify: 'esbuild',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/rss.xml': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@xiqi_img': path.resolve(__dirname, 'designed/xiqi_img'),
    },
  },
  }
})
