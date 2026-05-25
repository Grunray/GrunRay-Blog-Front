<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

import FilmFeed from '@/components/media/FilmFeed.vue'
import AvatarCircleSkeleton from '@/components/ui/AvatarCircleSkeleton.vue'
import { playPageEnter } from '@/composables/usePageEnterAnimation'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'
import '@/styles/page-enter-home.css'
import { useUiStore } from '@/stores/ui'
import type { Post } from '@/types/content'
import { readSessionJson, writeSessionJson } from '@/utils/sessionJsonCache'

const { t } = useI18n()
const route = useRoute()
const ui = useUiStore()

useSeoMeta(() => ({
  title: `${t('nav.home')} | ${SITE_NAME}`,
  description: t('home.tagline'),
  path: route.path,
  type: 'website',
}))

const homeRoot = ref<HTMLElement | null>(null)
const avatarUrl = ref('')
const latestUpdatedPosts = ref<Post[]>([])
const randomRecommendedPost = ref<Post | null>(null)
const CACHE_HOME_AVATAR = 'grunray.home.avatarUrl.v1'
const CACHE_HOME_LATEST = 'grunray.home.latestPosts.v1'
const CACHE_HOME_RANDOM = 'grunray.home.randomPost.v1'

async function loadAvatar() {
  const cached = readSessionJson<{ url: string }>(CACHE_HOME_AVATAR)
  if (cached?.url) {
    avatarUrl.value = cached.url
    return
  }
  try {
    const q = new URLSearchParams({
      page: '1',
      size: '1',
      folder: 'film/homeView/center/avatar',
    })
    const res = await fetch(`/api/media/list?${q.toString()}`)
    if (!res.ok) return
    const json = (await res.json()) as {
      code: number
      data: Array<{ url: string }>
      message: string
    }
    if (json.code !== 0 || !json.data?.length) return
    avatarUrl.value = json.data[0].url
    writeSessionJson(CACHE_HOME_AVATAR, { url: avatarUrl.value })
  } catch {
    // 头像加载失败时保留默认占位
  }
}

async function loadLatestUpdatedPost() {
  const cached = readSessionJson<{ posts: Post[] }>(CACHE_HOME_LATEST)
  if (cached && Array.isArray(cached.posts)) {
    latestUpdatedPosts.value = cached.posts
    return
  }
  try {
    const res = await fetch('/api/posts/latest-updated')
    if (!res.ok) return
    const json = (await res.json()) as { posts?: Post[] }
    latestUpdatedPosts.value = json.posts ?? []
    writeSessionJson(CACHE_HOME_LATEST, { posts: latestUpdatedPosts.value })
  } catch {
    latestUpdatedPosts.value = []
  }
}

async function loadRandomRecommendedPost() {
  const cachedRand = readSessionJson<{ post: Post | null }>(CACHE_HOME_RANDOM)
  if (cachedRand !== null && typeof cachedRand === 'object' && 'post' in cachedRand) {
    randomRecommendedPost.value = cachedRand.post ?? null
    return
  }
  try {
    const res = await fetch('/api/posts/random-recommend')
    if (!res.ok) return
    const json = (await res.json()) as { post?: Post }
    randomRecommendedPost.value = json.post ?? null
    writeSessionJson(CACHE_HOME_RANDOM, { post: randomRecommendedPost.value })
  } catch {
    randomRecommendedPost.value = null
  }
}

function formatDateYmd(input?: string): string {
  if (!input) return ''
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

onMounted(() => {
  loadAvatar()
  loadLatestUpdatedPost()
  loadRandomRecommendedPost()
  void playPageEnter(homeRoot.value)
})
</script>

<template>
  <section ref="homeRoot" class="home-layout">
    <aside class="left-ellipse">
      <div class="left-latest-panel">
        <p class="left-section-title">最新三篇文章</p>
        <div v-if="latestUpdatedPosts.length" class="latest-post-list">
          <RouterLink
            v-for="post in latestUpdatedPosts"
            :key="post.id"
            class="latest-post-card card"
            :to="`/blog/${post.slug}`"
          >
            <h3 class="latest-post-title">{{ post.title }}</h3>
            <div class="tags latest-post-tags">
              <template v-if="post.tags.length">
                <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
              </template>
              <span v-else class="tag latest-post-tag-placeholder">无关键词</span>
            </div>
            <p class="latest-post-summary">{{ post.summary || '暂无摘要' }}</p>
            <p class="latest-post-date">
              {{ formatDateYmd(post.updated_at) || '----/--/--' }}
            </p>
          </RouterLink>
        </div>
        <div v-else class="latest-post-card card latest-post-card--empty">
          <p class="latest-post-empty">暂无可展示文章</p>
        </div>
      </div>
      <div class="left-random-panel">
        <p class="left-section-title">随机推荐</p>
        <RouterLink
          v-if="randomRecommendedPost"
          class="latest-post-card card"
          :to="`/blog/${randomRecommendedPost.slug}`"
        >
          <h3 class="latest-post-title">{{ randomRecommendedPost.title }}</h3>
          <div class="tags latest-post-tags">
            <template v-if="randomRecommendedPost.tags.length">
              <span v-for="tag in randomRecommendedPost.tags" :key="tag" class="tag">{{ tag }}</span>
            </template>
            <span v-else class="tag latest-post-tag-placeholder">无关键词</span>
          </div>
          <p class="latest-post-summary">{{ randomRecommendedPost.summary || '暂无摘要' }}</p>
          <p class="latest-post-date">
            {{ formatDateYmd(randomRecommendedPost.updated_at) || '----/--/--' }}
          </p>
        </RouterLink>
        <div v-else class="latest-post-card card latest-post-card--empty">
          <p class="latest-post-empty">暂无可展示文章</p>
        </div>
      </div>
    </aside>

    <div class="center">
      <div class="avatar">
        <img
          v-if="avatarUrl"
          data-splash-avatar-target
          :class="{ 'home-avatar--splash-fly': ui.splashAvatarHandoff }"
          :src="avatarUrl"
          alt="头像"
        />
        <AvatarCircleSkeleton v-else />
      </div>
      <div class="greeting-art card">
        <p class="greeting-art-line">{{ t('home.greeting') }}</p>
      </div>
      <div class="internship-note card">{{ t('home.internshipNote') }}</div>
      <div class="self-intro-box card">
        <div class="cursor-placeholder">
          <div class="cursor-placeholder-text cursor-placeholder-tech">
            <p class="cursor-tech-title">技术栈<br />Languages</p>
            <p class="cursor-tech-divider">▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄</p>
            <div class="cursor-tech-grid">
              <p>● Python 0.0%</p>
              <p>● JAVA 0.0%</p>
              <p>● C/C++ 0.0%</p>
              <p>● MySQL 0.0%</p>
              <p>● Vue3 0.0%</p>
              <p>● Linux 0.0%</p>
              <p class="cursor-tech-ai">● Artificial Intelligence 10000.0%</p>
            </div>
          </div>
          <p class="cursor-placeholder-text">
            大三纯正全栈优质牛马，正宗新代码
            <br />
            从小写代码跑路长大，100%AI添加。
            <br />
            究极二刺螈，看番堪比吃盐。
            <br />
            爱好：喜欢去算法竞赛现场看男娘。
            <br />
            部分奖项：ICPC/CCPC不屈铜牌，省赛甚至难铜，有没有懂的。
            <br />
            精神状态：肘，忽略ጿ ኈ ቼ ዽ ጿ
          </p>
        </div>
      </div>
    </div>

    <aside class="right-panel">
      <FilmFeed />
    </aside>
  </section>
</template>

<style scoped>
.home-layout {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  align-items: stretch;
  min-height: calc(100vh - 2rem);
}

.left-ellipse {
  height: 100%;
  width: min(96%, 380px);
  justify-self: start;
  border: 1px solid var(--glass-card-border);
  border-radius: var(--radius-md);
  background: var(--glass-card-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(130%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(130%);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  text-align: left;
  gap: 0.9rem;
  padding: 1.25rem;
}

.left-ellipse > p {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
}

.latest-post-card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  text-decoration: none;
  color: inherit;
  padding: 0.9rem 1rem;
}

.latest-post-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.left-latest-panel {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.left-random-panel {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.left-section-title {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  font-weight: 600;
}

.latest-post-card--empty {
  justify-content: center;
  min-height: 180px;
}

.latest-post-title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.35;
}

.latest-post-tags {
  margin: 0.15rem 0 0.05rem;
}

.latest-post-tag-placeholder {
  opacity: 0.78;
}

.latest-post-summary {
  margin: 0.1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  line-height: 1.55;
}

.latest-post-date {
  margin: 0.3rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.latest-post-empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.center {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
  height: 100%;
}

.avatar {
  flex: 1 1 0;
  width: 100%;
  border: 2px solid var(--color-border);
  background: var(--color-bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-text);
  padding: 1rem;
}

.avatar {
  width: auto;
  height: 100%;
  max-width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  overflow: hidden;
  padding: 0;
  align-self: center;
  font-size: 1.35rem;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: opacity 0.28s ease;
}

.home-avatar--splash-fly {
  opacity: 0;
  pointer-events: none;
}

.internship-note {
  flex: 0 0 auto;
  width: 100%;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  padding: 0.58rem 0.9rem;
}

.greeting-art {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.7rem 1rem;
}

.greeting-art-line {
  margin: 0;
  font-family: 'Playfair Display', 'Averia Gruesa Libre', Georgia, 'Times New Roman', serif;
  font-size: clamp(1.28rem, 2.6vw, 1.85rem);
  font-weight: 600;
  font-style: italic;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: var(--color-text);
}

.self-intro-box {
  flex: 1 1 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0.85rem;
  text-align: left;
  /* 与全局 .card 的 overflow:hidden 区分：保留内部滚动；圆角/玻璃/阴影由 .card 提供 */
  overflow-x: hidden;
  overflow-y: auto;
}

.cursor-placeholder {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.cursor-placeholder-text {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.62;
  border: 1px solid color-mix(in srgb, var(--glass-card-border) 85%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--glass-card-bg) 84%, transparent);
  padding: 0.7rem 0.75rem;
}

.cursor-tech-title {
  margin: 0;
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.45;
}

.cursor-tech-divider {
  margin: 0.1rem 0 0.35rem;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
  font-size: 0.78rem;
}

.cursor-tech-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.26rem 0.65rem;
}

.cursor-tech-grid p {
  margin: 0;
  font-size: 0.79rem;
  line-height: 1.48;
}

.cursor-tech-ai {
  grid-column: 1 / -1;
}

.right-panel {
  width: min(86%, 300px);
  justify-self: end;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-card-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(130%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(130%);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

@media (max-width: 1100px) {
  /* 单列时用 flex 纵向堆叠，避免三栏 grid 同排残留导致侧栏与 center 重叠 */
  .home-layout {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-height: 0;
    gap: 1.25rem;
  }

  .home-layout > .center,
  .home-layout > .left-ellipse,
  .home-layout > .right-panel {
    grid-row: auto;
    grid-column: auto;
    width: 100%;
    max-width: none;
    min-width: 0;
  }

  .center {
    order: 1;
    flex: 0 0 auto;
    height: auto;
    min-height: 0;
  }

  .left-ellipse {
    order: 2;
    flex: 0 0 auto;
    min-height: 240px;
    width: 100%;
    height: auto;
    border-radius: var(--radius-lg);
  }

  .avatar,
  .greeting-art,
  .internship-note,
  .self-intro-box {
    flex: 0 0 auto;
  }

  .self-intro-box {
    height: auto;
    max-height: none;
    flex: 0 0 auto;
  }

  .avatar {
    width: min(180px, 42vw);
    height: min(180px, 42vw);
    max-width: 100%;
    aspect-ratio: 1 / 1;
  }

  .right-panel {
    order: 3;
    flex: 0 0 auto;
    width: 100%;
    height: auto;
    min-height: min(52vh, 520px);
  }
}

@media (max-width: 640px) {
  .cursor-placeholder {
    grid-template-columns: 1fr;
  }
}
</style>
