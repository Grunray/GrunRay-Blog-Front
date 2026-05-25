import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { i18n } from './i18n'
import router from './router'
import './styles/main.css'
import './styles/markdown-reading.css'
import './styles/footer-grunray.css'
import { isStaticSite } from '@/config/staticSite'

/** 静态站：清除旧版无 base 前缀的 session 缓存，避免头像等资源 404 */
if (isStaticSite && typeof sessionStorage !== 'undefined') {
  for (const key of ['grunray.home.avatarUrl.v1']) {
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}

const app = createApp(App)
const head = createHead()
app.use(createPinia())
app.use(head)
app.use(router)
app.use(i18n)
app.mount('#app')
