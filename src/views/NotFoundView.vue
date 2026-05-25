<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'
import { useUiStore } from '@/stores/ui'
import { setPageCorruptState } from '@/theme/pageCorruptState'
import { corruptText } from '@/utils/corruptText'

const { t } = useI18n()
const route = useRoute()
const ui = useUiStore()

const titleCorrupt = ref('404')
const messageCorrupt = ref('')
const hintCorrupt = ref('')

let corruptTimer: ReturnType<typeof setInterval> | null = null
let replayTimer: ReturnType<typeof setTimeout> | null = null

const glitchActive = computed(() => ui.theme !== 'abstract')
const showUnlock = computed(() => !ui.abstractThemeUnlocked)
const showApplyTheme = computed(() => ui.abstractThemeUnlocked && ui.theme !== 'abstract')
const showReplayGlitch = computed(() => ui.abstractThemeUnlocked)
const showStableLayout = computed(() => ui.theme === 'abstract')

function refreshCorruptCopy() {
  titleCorrupt.value = corruptText('404', 0.55)
  messageCorrupt.value = corruptText(t('common.notFound'), 0.42)
  hintCorrupt.value = corruptText(t('notFound.glitchHint'), 0.35)
}

function startGlitch() {
  if (!glitchActive.value) return
  setPageCorruptState(true)
  refreshCorruptCopy()
  if (corruptTimer !== null) clearInterval(corruptTimer)
  corruptTimer = window.setInterval(refreshCorruptCopy, 900)
}

function stopGlitch() {
  setPageCorruptState(false)
  if (corruptTimer !== null) {
    clearInterval(corruptTimer)
    corruptTimer = null
  }
}

function unlockHiddenTheme() {
  ui.unlockAbstractTheme()
}

function applyHiddenTheme() {
  ui.setTheme('abstract')
}

function replayGlitch() {
  startGlitch()
  if (replayTimer !== null) clearTimeout(replayTimer)
  replayTimer = window.setTimeout(() => {
    replayTimer = null
    if (ui.theme === 'abstract') stopGlitch()
  }, 8000)
}

useSeoMeta(() => ({
  title: `404 | ${SITE_NAME}`,
  description: t('common.notFound'),
  path: route.path,
  type: 'website',
  robots: 'noindex, nofollow',
}))

watch(
  () => ui.theme,
  () => {
    if (route.name !== 'not-found') return
    if (glitchActive.value) startGlitch()
    else stopGlitch()
  },
)

onMounted(() => {
  if (glitchActive.value) startGlitch()
  else stopGlitch()
})

onUnmounted(() => {
  stopGlitch()
  if (replayTimer !== null) {
    clearTimeout(replayTimer)
    replayTimer = null
  }
})
</script>

<template>
  <section class="not-found" :class="{ 'not-found--stable': showStableLayout }">
    <div class="not-found__signal" aria-hidden="true" />

    <p class="not-found__code" aria-hidden="true">{{ titleCorrupt }}</p>
    <h1 class="not-found__title">{{ titleCorrupt }}</h1>

    <p class="not-found__message">{{ messageCorrupt }}</p>
    <p v-if="glitchActive" class="not-found__hint">{{ hintCorrupt }}</p>
    <p v-else class="not-found__unlocked">{{ t('notFound.themeUnlocked') }}</p>

    <div class="not-found__actions">
      <button
        v-if="showUnlock"
        type="button"
        class="not-found__unlock"
        @click="unlockHiddenTheme"
      >
        {{ t('notFound.unlockTheme') }}
      </button>
      <button
        v-if="showApplyTheme"
        type="button"
        class="not-found__unlock"
        @click="applyHiddenTheme"
      >
        {{ t('notFound.applyTheme') }}
      </button>
      <button
        v-if="showReplayGlitch"
        type="button"
        class="not-found__replay"
        @click="replayGlitch"
      >
        {{ t('notFound.replayGlitch') }}
      </button>
      <RouterLink class="not-found__home" to="/">{{ t('nav.home') }}</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.not-found {
  position: relative;
  min-height: min(88vh, 820px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 3rem 1.25rem 4rem;
  text-align: center;
  isolation: isolate;
}

.not-found__signal {
  position: absolute;
  inset: 10% 6%;
  border: 1px solid rgb(255 219 0 / 0.35);
  pointer-events: none;
  animation: not-found-frame 1.4s steps(2, end) infinite;
}

.not-found__signal::before,
.not-found__signal::after {
  content: '';
  position: absolute;
  background: rgb(255 219 0 / 0.7);
}

.not-found__signal::before {
  top: -1px;
  left: 18%;
  right: 18%;
  height: 2px;
}

.not-found__signal::after {
  bottom: -1px;
  left: 24%;
  right: 24%;
  height: 2px;
}

.not-found__code {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: 0;
  font-size: clamp(5rem, 22vw, 11rem);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: rgb(255 255 255 / 0.06);
  transform: translate(-50%, -52%) skewX(-8deg);
  user-select: none;
  pointer-events: none;
}

.not-found__title {
  position: relative;
  margin: 0;
  font-size: clamp(2.8rem, 12vw, 4.5rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1;
  color: var(--color-text);
  animation: not-found-title-glitch 0.85s steps(2, end) infinite;
}

.not-found__message,
.not-found__hint,
.not-found__unlocked {
  position: relative;
  max-width: 34rem;
  margin: 0;
  line-height: 1.65;
}

.not-found__message {
  font-size: 1.05rem;
  color: var(--color-text);
}

.not-found__hint {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  opacity: 0.92;
}

.not-found__unlocked {
  font-size: 0.9rem;
  color: var(--color-accent-muted, #d4bc00);
}

.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem 1rem;
  margin-top: 1rem;
}

.not-found__unlock,
.not-found__replay {
  appearance: none;
  border: 2px solid var(--color-border, #ffdb00);
  background: rgb(10 35 48 / 0.72);
  color: var(--color-accent, #ffdb00);
  padding: 0.65rem 1.15rem;
  font: inherit;
  font-size: 0.92rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--color-border, #ffdb00);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.not-found__replay {
  border-color: color-mix(in srgb, var(--color-border, #ffdb00) 65%, var(--color-text-muted));
  color: var(--color-text);
  box-shadow: 3px 3px 0 color-mix(in srgb, var(--color-border, #ffdb00) 65%, var(--color-text-muted));
}

.not-found__unlock:hover,
.not-found__replay:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--color-border, #ffdb00);
  background: rgb(18 56 72 / 0.88);
}

.not-found__replay:hover {
  box-shadow: 4px 4px 0 color-mix(in srgb, var(--color-border, #ffdb00) 65%, var(--color-text-muted));
}

.not-found__unlock:active,
.not-found__replay:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--color-border, #ffdb00);
}

.not-found__home {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  text-decoration: none;
}

.not-found__home:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.not-found--stable .not-found__title,
.not-found--stable .not-found__signal {
  animation: none;
}

@keyframes not-found-frame {
  0%,
  100% {
    transform: skewX(0deg);
    opacity: 0.55;
  }

  50% {
    transform: skewX(-2deg);
    opacity: 0.85;
  }
}

@keyframes not-found-title-glitch {
  0%,
  100% {
    transform: translate(0, 0);
    text-shadow:
      2px 0 rgb(255 0 90 / 0.65),
      -2px 0 rgb(0 210 255 / 0.65);
  }

  50% {
    transform: translate(2px, -1px);
    text-shadow:
      -3px 0 rgb(255 0 90 / 0.75),
      3px 0 rgb(0 210 255 / 0.75);
  }
}

@media (prefers-reduced-motion: reduce) {
  .not-found__title,
  .not-found__signal {
    animation: none;
  }
}
</style>
