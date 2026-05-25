<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { fetchXiqiPageConfig } from '@/services/fragmentsApi'
import { resolveXiqiHeroImage } from '@/theme/xiqiHeroMedia'
import { resolvePublicUrl } from '@/utils/resolvePublicUrl'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    subtitle: string
    /** 覆盖 API / 路由默认 hero 图 */
    mediaSrc?: string
    mediaAlt?: string
    /** fragments | about | recommend；不传则从 route.name 推断 */
    page?: string
  }>(),
  {
    mediaAlt: '',
  },
)

const route = useRoute()
const heroRef = ref<HTMLElement | null>(null)
const apiHeroUrl = ref<string | null>(null)

const pageKey = computed(() => {
  if (props.page) return props.page
  const name = typeof route.name === 'string' ? route.name : ''
  if (name === 'fragments' || name === 'about' || name === 'recommend') return name
  return 'fragments'
})

const resolvedMedia = computed(() => {
  const override = props.mediaSrc?.trim()
  if (override) return resolvePublicUrl(override)
  if (apiHeroUrl.value) return apiHeroUrl.value
  return resolveXiqiHeroImage(pageKey.value)
})

const hasMedia = computed(() => Boolean(resolvedMedia.value))

async function loadHeroFromApi() {
  if (props.mediaSrc?.trim()) return
  try {
    const cfg = await fetchXiqiPageConfig(pageKey.value)
    const raw = cfg.heroImageUrl?.trim()
    apiHeroUrl.value = raw ? resolvePublicUrl(raw) : null
  } catch {
    apiHeroUrl.value = null
  }
}

watch(pageKey, () => {
  void loadHeroFromApi()
})

onMounted(() => {
  void loadHeroFromApi()
})

function setPointerVars(x: number, y: number) {
  const el = heroRef.value
  if (!el) return
  el.style.setProperty('--hero-pointer-x', x.toFixed(3))
  el.style.setProperty('--hero-pointer-y', y.toFixed(3))
}

function onPointerMove(event: PointerEvent) {
  if (!hasMedia.value || event.pointerType !== 'mouse') return
  const el = heroRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5
  setPointerVars(x, y)
}

function onPointerLeave() {
  setPointerVars(0, 0)
}
</script>

<template>
  <header
    ref="heroRef"
    class="xiqi-hero card card-glass-dense"
    :class="{ 'xiqi-hero--has-media': hasMedia }"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <div class="xiqi-hero-glow" aria-hidden="true" />

    <template v-if="hasMedia">
      <div class="xiqi-hero-media" aria-hidden="true">
        <img
          :src="resolvedMedia"
          :alt="mediaAlt"
          loading="eager"
          decoding="async"
        />
      </div>
    </template>

    <div class="xiqi-hero-inner xiqi-hero-content">
      <div class="xiqi-hero-chips" :class="{ 'xiqi-hero-chips--media': hasMedia }">
        <p
          class="xiqi-hero-eyebrow"
          :class="{ 'xiqi-hero-chip': hasMedia }"
        >
          {{ eyebrow }}
        </p>
        <h1
          class="xiqi-hero-title"
          :class="{ 'xiqi-hero-chip xiqi-hero-chip--title': hasMedia }"
        >
          {{ title }}
        </h1>
        <p
          class="xiqi-hero-sub"
          :class="{ 'xiqi-hero-chip': hasMedia }"
        >
          {{ subtitle }}
        </p>
      </div>
    </div>
  </header>
</template>
