<!--
  浅色 / 深色 / 隐藏配色（解锁后三档轮换）；扩散层 Teleport 到 body（z-index:0）。
-->
<template>
  <button
    ref="anchorRef"
    type="button"
    class="theme-nav-btn"
    :class="{
      'theme-nav-btn--light': ui.theme === 'light',
      'theme-nav-btn--dark': ui.theme === 'dark',
      'theme-nav-btn--abstract': ui.theme === 'abstract',
    }"
    :aria-label="themeHoverTitle"
    :title="themeHoverTitle"
    @click="toggle($event)"
    @keydown.enter.prevent="toggle()"
    @keydown.space.prevent="toggle()"
  >
    <span class="theme-nav-btn-icon" aria-hidden="true">
      <ThemeNavIcon :theme="ui.theme" />
    </span>
  </button>

  <Teleport to="body">
    <div v-if="ripple.show" class="theme-toggle-ripple-root" aria-hidden="true">
      <div :key="ripple.key" class="theme-toggle-ripple-disk" :style="diskStyle" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import ThemeNavIcon from '@/components/icons/ThemeNavIcon.vue'
import { useUiStore } from '@/stores/ui'
import { DARK_MODE_PAGE_BACKGROUND, LIGHT_MODE_PAGE_BACKGROUND } from '@/theme/pageBackgrounds'

const { t } = useI18n()
const ui = useUiStore()

const themeHoverTitle = computed(() => {
  if (ui.theme === 'abstract') return t('ui.themeTitleAbstract')
  if (ui.theme === 'dark') {
    return ui.abstractThemeUnlocked
      ? t('ui.themeTitleDarkUnlocked')
      : t('ui.themeTitleDark')
  }
  return t('ui.themeTitleLight')
})

const anchorRef = ref<HTMLElement | null>(null)

const ripple = reactive({
  show: false,
  key: 0,
  x: 0,
  y: 0,
  surface: 'light' as 'light' | 'dark',
})

const diskStyle = computed(() => ({
  '--ripple-x': `${ripple.x}px`,
  '--ripple-y': `${ripple.y}px`,
  background:
    ripple.surface === 'light' ? LIGHT_MODE_PAGE_BACKGROUND : DARK_MODE_PAGE_BACKGROUND,
}))

let rippleClearTimer: ReturnType<typeof setTimeout> | null = null

function playRippleFromAnchor(ev?: MouseEvent) {
  if (ui.prefersReducedMotion) return
  const el = anchorRef.value
  if (!el) return

  if (ev instanceof MouseEvent) {
    ripple.x = ev.clientX
    ripple.y = ev.clientY
  } else {
    const r = el.getBoundingClientRect()
    ripple.x = r.left + r.width / 2
    ripple.y = r.top + r.height / 2
  }
  ripple.surface = ui.theme === 'light' ? 'light' : 'dark'
  ripple.key += 1
  ripple.show = true

  if (rippleClearTimer) clearTimeout(rippleClearTimer)
  rippleClearTimer = setTimeout(() => {
    ripple.show = false
    rippleClearTimer = null
  }, 620)
}

watch(
  () => ui.prefersReducedMotion,
  (reduce) => {
    if (reduce) {
      ripple.show = false
      if (rippleClearTimer) {
        clearTimeout(rippleClearTimer)
        rippleClearTimer = null
      }
    }
  },
)

function toggle(ev?: MouseEvent) {
  ui.cycleTheme()
  playRippleFromAnchor(ev instanceof MouseEvent ? ev : undefined)
}
</script>

<style scoped>
.theme-nav-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--glass-nav-border);
  background: color-mix(in srgb, var(--glass-nav-bg) 76%, #8a8a8a);
  color: #8d9298;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.theme-nav-btn:hover {
  transform: scale(1.08);
  border-color: color-mix(in srgb, var(--color-accent) 42%, var(--glass-nav-border));
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-accent) 35%, transparent);
}

.theme-nav-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  transition: filter 0.2s ease, transform 0.2s ease;
}

.theme-nav-btn:hover .theme-nav-btn-icon {
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-accent) 50%, transparent));
}

/* 浅色当前主题：与拖尾开启态一致的渐变高亮，太阳图标发光 */
.theme-nav-btn--light {
  color: #fff6cf;
  border-color: color-mix(in srgb, var(--color-accent) 55%, var(--glass-nav-border));
  background: linear-gradient(135deg, #8f7cff 0%, #4fc3ff 46%, #7fffd0 100%);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--color-accent) 35%, transparent),
    0 0 14px color-mix(in srgb, var(--color-accent) 45%, transparent);
}

.theme-nav-btn--light .theme-nav-btn-icon {
  filter:
    drop-shadow(0 0 6px color-mix(in srgb, var(--color-accent) 80%, white))
    drop-shadow(0 0 14px color-mix(in srgb, var(--color-accent) 58%, transparent));
}

.theme-nav-btn--light:hover {
  border-color: color-mix(in srgb, var(--color-accent) 62%, var(--glass-nav-border));
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--color-accent) 42%, transparent),
    0 0 18px color-mix(in srgb, var(--color-accent) 52%, transparent);
}

.theme-nav-btn--light:hover .theme-nav-btn-icon {
  filter:
    drop-shadow(0 0 6px color-mix(in srgb, var(--color-accent) 80%, white))
    drop-shadow(0 0 14px color-mix(in srgb, var(--color-accent) 58%, transparent));
}

/* 深色当前主题：冷色底 + 月亮发白光 */
.theme-nav-btn--dark {
  color: #f1f5f9;
  border-color: color-mix(in srgb, #94a3b8 48%, var(--glass-nav-border));
  background: linear-gradient(145deg, #1e293b 0%, #334155 52%, #475569 100%);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 14%),
    0 0 18px rgb(148 163 184 / 38%);
}

.theme-nav-btn--dark .theme-nav-btn-icon {
  filter:
    drop-shadow(0 0 8px rgb(255 255 255 / 0.9))
    drop-shadow(0 0 16px rgb(226 232 240 / 0.5));
}

.theme-nav-btn--dark:hover {
  border-color: color-mix(in srgb, #cbd5e1 55%, var(--glass-nav-border));
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 18%),
    0 0 22px rgb(203 213 225 / 42%);
}

.theme-nav-btn--dark:hover .theme-nav-btn-icon {
  filter:
    drop-shadow(0 0 8px rgb(255 255 255 / 0.9))
    drop-shadow(0 0 16px rgb(226 232 240 / 0.5));
}

/* 隐藏配色（abstract）：青蓝底 + 亮黄描边 */
.theme-nav-btn--abstract {
  color: #ffdb00;
  border-color: #ffdb00;
  background: linear-gradient(145deg, #0a2330 0%, #123848 52%, #167095 100%);
  box-shadow:
    0 0 0 1px rgb(255 219 0 / 35%),
    3px 3px 0 rgb(255 219 0 / 85%);
  border-radius: 0;
}

.theme-nav-btn--abstract .theme-nav-btn-icon {
  filter:
    drop-shadow(0 0 6px rgb(255 219 0 / 0.85))
    drop-shadow(0 0 12px rgb(22 112 149 / 0.65));
}

.theme-nav-btn--abstract:hover {
  border-color: #ffdb00;
  box-shadow:
    0 0 0 1px rgb(255 219 0 / 45%),
    4px 4px 0 rgb(255 219 0 / 0.95);
}

.theme-nav-btn--abstract:hover .theme-nav-btn-icon {
  filter:
    drop-shadow(0 0 8px rgb(255 219 0 / 0.95))
    drop-shadow(0 0 14px rgb(22 112 149 / 0.75));
}

@media (prefers-reduced-motion: reduce) {
  .theme-nav-btn {
    transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  }

  .theme-nav-btn:hover {
    transform: none;
  }
}
</style>

<!--
  扩散层在 #app 之下（z-index:0），透过透明 #app 与留白区可见，卡片/正文始终在上层。
-->
<style lang="css">
.theme-toggle-ripple-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.theme-toggle-ripple-disk {
  position: fixed;
  left: var(--ripple-x, 50%);
  top: var(--ripple-y, 50%);
  width: 0;
  height: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  will-change: width, height, opacity, filter;
  animation: theme-toggle-ripple-pulse 0.55s ease-out forwards;
}

@keyframes theme-toggle-ripple-pulse {
  0% {
    width: 0;
    height: 0;
    opacity: 0;
    filter: brightness(1);
  }
  10% {
    opacity: 0.92;
    filter: brightness(1.14);
  }
  35% {
    opacity: 0.88;
    filter: brightness(1.08);
  }
  70% {
    opacity: 0.45;
    filter: brightness(1.02);
  }
  100% {
    width: 250vmax;
    height: 250vmax;
    opacity: 0;
    filter: brightness(1);
  }
}
</style>
