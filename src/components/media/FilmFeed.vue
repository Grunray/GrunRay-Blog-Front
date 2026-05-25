<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { isStaticSite } from '@/config/staticSite'
import { loadStaticSiteBundle } from '@/services/static/staticSiteData'

type MediaType = 'image' | 'gif' | 'video'
type MediaItem = {
  id: number
  url: string
  type: MediaType
  title?: string | null
  article_id?: number | null
  tags?: string[] | null
  created_at?: string
}

const items = ref<MediaItem[]>([])
const loading = ref(false)
const error = ref('')
const speedSeconds = ref(20)
const viewerItem = ref<MediaItem | null>(null)

async function loadMedia() {
  loading.value = true
  error.value = ''
  try {
    if (isStaticSite) {
      const bundle = await loadStaticSiteBundle()
      items.value = (bundle.filmfeed ?? []).map((row) => ({
        ...row,
        type: row.type as MediaType,
      }))
      return
    }
    const q = new URLSearchParams({
      page: '1',
      size: '50',
    })
    const res = await fetch(`/api/media/list/filmfeed?${q.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { code: number; data: MediaItem[]; message: string }
    if (json.code !== 0) throw new Error(json.message || '加载失败')
    items.value = json.data ?? []
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const loopItems = computed(() => {
  if (!items.value.length) return []
  return [...items.value, ...items.value]
})

function openViewer(item: MediaItem) {
  viewerItem.value = item
}

function closeViewer() {
  viewerItem.value = null
}

function onWheel(e: WheelEvent) {
  const delta = e.deltaY * 0.02
  speedSeconds.value = Math.min(40, Math.max(6, speedSeconds.value + delta))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeViewer()
}

onMounted(() => {
  loadMedia()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="film-container" @wheel.prevent="onWheel">
    <div class="film">
      <div class="film-edge-overlay top" />
      <div class="film-edge-overlay bottom" />
      <div class="holes">
        <div v-for="n in 10" :key="`l-${n}`" class="hole" />
      </div>
      <div class="holes right">
        <div v-for="n in 10" :key="`r-${n}`" class="hole" />
      </div>

      <div
        v-if="loopItems.length"
        class="track"
        :class="{ paused: !!viewerItem }"
        :style="{ animationDuration: `${speedSeconds}s` }"
      >
        <div v-for="item in loopItems" :key="`${item.id}-${item.url}`" class="frame" @click="openViewer(item)">
          <video v-if="item.type === 'video'" :src="item.url" muted loop playsinline preload="metadata" />
          <img v-else :src="item.url" :alt="item.title || 'media'" loading="lazy" />
        </div>
      </div>

      <div v-else class="status-box">
        <div v-if="loading" class="film-skel" aria-busy="true" aria-label="加载中">
          <div v-for="n in 4" :key="n" class="frame sk-frame ui-skeleton" />
        </div>
        <p v-else-if="error">加载失败：{{ error }}</p>
        <p v-else>暂无媒体数据</p>
      </div>
    </div>

    <div v-if="viewerItem" class="viewer active" @click="closeViewer">
      <div class="viewer-content" @click.stop>
        <video v-if="viewerItem.type === 'video'" :src="viewerItem.url" controls autoplay />
        <img v-else :src="viewerItem.url" :alt="viewerItem.title || 'media'" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.film-container {
  height: 100%;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.film {
  position: relative;
  height: 100%;
  background: color-mix(in srgb, var(--glass-card-bg) 84%, transparent);
  backdrop-filter: blur(calc(var(--glass-blur) * 0.85)) saturate(122%);
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 0.85)) saturate(122%);
  border-radius: var(--radius-md);
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.film-edge-overlay {
  position: absolute;
  left: 0;
  right: 0;
  height: 56px;
  z-index: 9;
  pointer-events: none;
  backdrop-filter: blur(calc(var(--glass-blur) * 1.3)) saturate(135%) brightness(1.01);
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 1.3)) saturate(135%) brightness(1.01);
}

.film-edge-overlay.top {
  top: 0;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--glass-card-bg) 76%, transparent) 0%,
    color-mix(in srgb, var(--glass-card-bg) 48%, transparent) 36%,
    rgb(17 17 17 / 0.38) 68%,
    rgb(17 17 17 / 0) 100%
  );
  -webkit-mask-image: linear-gradient(to bottom, rgb(0 0 0 / 1) 0%, rgb(0 0 0 / 0.82) 36%, rgb(0 0 0 / 0) 100%);
  mask-image: linear-gradient(to bottom, rgb(0 0 0 / 1) 0%, rgb(0 0 0 / 0.82) 36%, rgb(0 0 0 / 0) 100%);
  border-bottom: 1px solid color-mix(in srgb, var(--glass-card-border) 85%, transparent);
}

.film-edge-overlay.bottom {
  bottom: 0;
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--glass-card-bg) 76%, transparent) 0%,
    color-mix(in srgb, var(--glass-card-bg) 48%, transparent) 36%,
    rgb(17 17 17 / 0.38) 68%,
    rgb(17 17 17 / 0) 100%
  );
  -webkit-mask-image: linear-gradient(to top, rgb(0 0 0 / 1) 0%, rgb(0 0 0 / 0.82) 36%, rgb(0 0 0 / 0) 100%);
  mask-image: linear-gradient(to top, rgb(0 0 0 / 1) 0%, rgb(0 0 0 / 0.82) 36%, rgb(0 0 0 / 0) 100%);
  border-top: 1px solid color-mix(in srgb, var(--glass-card-border) 85%, transparent);
}

.holes {
  position: absolute;
  left: 0;
  top: 0;
  width: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 8px 0;
  z-index: 2;
}

.holes.right {
  left: auto;
  right: 0;
}

.hole {
  width: 11px;
  height: 14px;
  margin: auto;
  background: color-mix(in srgb, var(--color-text) 36%, white);
  border-radius: 2px;
  opacity: 0.62;
}

.track {
  position: absolute;
  width: calc(100% - 54px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px 0;
  animation: scroll linear infinite;
}

.track.paused {
  animation-play-state: paused;
}

@keyframes scroll {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-50%);
  }
}

.frame {
  width: 100%;
  min-height: 180px;
  border: 1px solid color-mix(in srgb, var(--glass-card-border) 92%, white);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: color-mix(in srgb, var(--color-bg-surface) 84%, #0f1418);
  cursor: zoom-in;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 22px -16px rgb(0 0 0 / 0.48);
  transition:
    transform 0.25s ease,
    filter 0.25s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;
}

.track:hover .frame {
  filter: blur(1.2px) saturate(0.88) brightness(0.88);
  transform: scale(0.985);
}

.track:hover .frame:hover {
  filter: none;
  transform: scale(1.045);
  border-color: color-mix(in srgb, var(--color-accent) 45%, var(--glass-card-border));
  box-shadow:
    0 14px 34px -18px rgb(0 0 0 / 0.6),
    0 0 0 1px color-mix(in srgb, var(--color-accent) 28%, transparent);
  z-index: 2;
}

.frame img,
.frame video {
  width: 100%;
  height: auto;
  max-height: 340px;
  object-fit: contain;
  display: block;
}

.status-box {
  width: calc(100% - 54px);
  margin-top: 1rem;
  border: 1px dashed color-mix(in srgb, var(--glass-card-border) 88%, transparent);
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--glass-card-bg) 78%, transparent);
  border-radius: var(--radius-sm);
}

.film-skel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px 0;
  text-align: left;
}

.film-skel .sk-frame {
  cursor: default;
  pointer-events: none;
}

.viewer {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.84);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 120;
}

.viewer.active {
  opacity: 1;
  pointer-events: auto;
}

.viewer-content {
  max-width: min(92vw, 960px);
  max-height: 88vh;
}

.viewer-content img,
.viewer-content video {
  display: block;
  max-width: 100%;
  max-height: 88vh;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgb(0 0 0 / 0.6);
}

/* 首页窄屏：父级 height:auto 时避免 height:100% 塌成 0 */
@media (max-width: 1100px) {
  .film-container,
  .film {
    height: auto;
    min-height: min(52vh, 520px);
  }
}
</style>
