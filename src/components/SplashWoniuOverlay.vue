<script setup lang="ts">
/**
 * 蜗牛开屏：动画逻辑在 `public/splash-woniu/index.html`（独立静态页 + iframe）。
 * path_walk 结束后 iframe 发 `grunray-splash-avatar-start`，本组件在螺旋壳屏幕坐标处放大头像并飞入首页 `[data-splash-avatar-target]`。
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useUiStore } from '@/stores/ui'

const STORAGE_KEY = 'grunray_splash_woniu_v1'

const { t } = useI18n()
const route = useRoute()
const ui = useUiStore()

const visible = ref(false)
/** 与 store 的 tick 同步，用于强制 iframe 重载 */
const iframeKey = ref(0)
const splashIframeRef = ref<HTMLIFrameElement | null>(null)
const flyVisible = ref(false)
const flyAvatarSrc = ref('')
const flyImgRef = ref<HTMLImageElement | null>(null)
const handoffRunning = ref(false)
/** 落地后透明遮罩 + 隐藏 iframe，便于与首页头像交叉淡化，避免「整块底色」闪烁 */
const revealBeneath = ref(false)
/** 圆形揭幕层：实心背景 + 径向 mask 扩大透明孔，从头像中心「撑开」露出首页 */
const irisVeilActive = ref(false)
const irisVeilRef = ref<HTMLElement | null>(null)

const iframeSrc = computed(() => {
  const theme = ui.theme === 'dark' ? 'dark' : 'light'
  return `/splash-woniu/index.html?theme=${theme}`
})

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function ackHandoffToIframe() {
  splashIframeRef.value?.contentWindow?.postMessage({ type: 'grunray-splash-handoff-done' }, '*')
}

function dismiss() {
  if (!visible.value) return
  flyImgRef.value?.getAnimations?.().forEach((a) => a.cancel())
  flyVisible.value = false
  flyAvatarSrc.value = ''
  irisVeilActive.value = false
  clearIrisVeilStyles()
  revealBeneath.value = false
  ui.setSplashAvatarHandoff(false)
  visible.value = false
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function clearIrisVeilStyles() {
  const el = irisVeilRef.value
  if (!el) return
  el.style.maskImage = ''
  el.style.removeProperty('-webkit-mask-image')
  el.style.maskRepeat = ''
  el.style.removeProperty('-webkit-mask-repeat')
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

/** 从 (cx,cy) 扩大透明孔，露出下层页面；末段可顺带降低 fly 图层不透明度 */
async function playIrisReveal(
  veilEl: HTMLElement,
  cx: number,
  cy: number,
  rStartPx: number,
  rEndPx: number,
  durationMs: number,
  flyEl: HTMLImageElement | null,
  flyFadeFromU: number,
) {
  const t0 = performance.now()
  await new Promise<void>((resolve) => {
    function frame(now: number) {
      const u = Math.min(1, (now - t0) / durationMs)
      const eased = easeOutCubic(u)
      const r = rStartPx + (rEndPx - rStartPx) * eased
      const inner = Math.max(0, r - 2)
      const grad = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${inner}px, black ${r}px)`
      veilEl.style.maskImage = grad
      veilEl.style.setProperty('-webkit-mask-image', grad)
      veilEl.style.maskRepeat = 'no-repeat'
      veilEl.style.setProperty('-webkit-mask-repeat', 'no-repeat')

      if (flyEl && u >= flyFadeFromU) {
        const fu = (u - flyFadeFromU) / (1 - flyFadeFromU)
        flyEl.style.opacity = String(Math.max(0, 1 - easeOutCubic(fu)))
      }

      if (u < 1) {
        requestAnimationFrame(frame)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(frame)
  })
}

async function runAvatarHandoff(startX: number, startY: number) {
  if (handoffRunning.value) return
  handoffRunning.value = true
  let landedCrossfade = false
  try {
    await nextTick()
    await new Promise<void>((r) => requestAnimationFrame(() => r()))

    const target = document.querySelector<HTMLImageElement>('[data-splash-avatar-target]')
    const onHome = route.name === 'home'

    if (!onHome || !target?.src || prefersReducedMotion()) {
      return
    }

    const rect = target.getBoundingClientRect()
    const src = target.currentSrc || target.src
    if (rect.width < 8 || rect.height < 8) {
      return
    }

    const doubleRaf = () =>
      new Promise<void>((r) => {
        requestAnimationFrame(() => requestAnimationFrame(() => r()))
      })

    /** 与首页 `.avatar` 一致：正圆裁切，边长取可视区域较小边 */
    const dFinal = Math.min(rect.width, rect.height)
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const leftFinal = cx - dFinal / 2
    const topFinal = cy - dFinal / 2
    const br = '50%'

    const w0 = 48
    const wMid = Math.min(260, Math.max(168, dFinal * 0.45))

    ui.setSplashAvatarHandoff(true)
    flyAvatarSrc.value = src
    flyVisible.value = true

    await nextTick()
    const img = flyImgRef.value
    if (!img) {
      return
    }

    img.style.position = 'fixed'
    img.style.zIndex = '260'
    img.style.objectFit = 'cover'
    img.style.pointerEvents = 'none'
    img.style.borderRadius = br
    img.style.overflow = 'hidden'
    img.style.boxShadow = '0 16px 48px rgb(0 0 0 / 22%)'
    img.style.filter = 'brightness(1.04) saturate(1.03)'
    img.style.left = `${startX - w0 / 2}px`
    img.style.top = `${startY - w0 / 2}px`
    img.style.width = `${w0}px`
    img.style.height = `${w0}px`

    const easingPop = 'cubic-bezier(0.34, 1.35, 0.64, 1)'
    /** 飞行末段略「冲」再收束，配合阴影/亮度变化 */
    const easingMove = 'cubic-bezier(0.22, 1.12, 0.28, 1)'

    const a1 = img.animate(
      [
        {
          left: `${startX - w0 / 2}px`,
          top: `${startY - w0 / 2}px`,
          width: `${w0}px`,
          height: `${w0}px`,
          borderRadius: br,
          opacity: 0.72,
          boxShadow: '0 12px 36px rgb(0 0 0 / 20%)',
          filter: 'brightness(1.02) saturate(1.02)',
        },
        {
          left: `${startX - wMid / 2}px`,
          top: `${startY - wMid / 2}px`,
          width: `${wMid}px`,
          height: `${wMid}px`,
          borderRadius: br,
          opacity: 1,
          boxShadow: '0 20px 56px rgb(0 0 0 / 26%)',
          filter: 'brightness(1.06) saturate(1.04)',
        },
      ],
      { duration: 540, easing: easingPop, fill: 'forwards' },
    )
    await a1.finished.catch(() => {})
    await new Promise((r) => setTimeout(r, 200))

    const settle = 1.038
    const dBurst = dFinal * settle
    const leftBurst = cx - dBurst / 2
    const topBurst = cy - dBurst / 2

    const a2 = img.animate(
      [
        {
          left: `${startX - wMid / 2}px`,
          top: `${startY - wMid / 2}px`,
          width: `${wMid}px`,
          height: `${wMid}px`,
          borderRadius: br,
          boxShadow: '0 22px 60px rgb(0 0 0 / 28%)',
          filter: 'brightness(1.06) saturate(1.05)',
        },
        {
          offset: 0.8,
          left: `${leftBurst}px`,
          top: `${topBurst}px`,
          width: `${dBurst}px`,
          height: `${dBurst}px`,
          borderRadius: br,
          boxShadow: '0 26px 64px rgb(56 189 248 / 22%)',
          filter: 'brightness(1.08) saturate(1.06)',
        },
        {
          left: `${leftFinal}px`,
          top: `${topFinal}px`,
          width: `${dFinal}px`,
          height: `${dFinal}px`,
          borderRadius: br,
          boxShadow: '0 6px 20px rgb(0 0 0 / 12%)',
          filter: 'brightness(1) saturate(1)',
        },
      ],
      { duration: 1080, easing: easingMove, fill: 'forwards' },
    )
    await a2.finished.catch(() => {})

    landedCrossfade = true
    revealBeneath.value = true
    await nextTick()
    await doubleRaf()

    ui.setSplashAvatarHandoff(false)
    await nextTick()
    await doubleRaf()

    const vw = window.innerWidth
    const vh = window.innerHeight
    const rEnd =
      Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) + Math.max(vw, vh) * 0.08
    const rStart = Math.max(12, dFinal * 0.44)

    irisVeilActive.value = true
    await nextTick()
    const veil = irisVeilRef.value
    if (veil) {
      await playIrisReveal(veil, cx, cy, rStart, rEnd, 820, img, 0.62)
    } else if (img) {
      img.style.opacity = '0'
    }

    clearIrisVeilStyles()
    irisVeilActive.value = false
    if (img) img.style.opacity = ''
    flyVisible.value = false
    flyAvatarSrc.value = ''
  } finally {
    flyImgRef.value?.getAnimations?.().forEach((a) => a.cancel())
    if (!landedCrossfade) {
      flyVisible.value = false
      flyAvatarSrc.value = ''
      irisVeilActive.value = false
      clearIrisVeilStyles()
      ui.setSplashAvatarHandoff(false)
      revealBeneath.value = false
    }
    handoffRunning.value = false
    ackHandoffToIframe()
  }
}

function onMessage(ev: MessageEvent) {
  const t = ev.data?.type
  if (t === 'grunray-splash-complete') {
    dismiss()
    return
  }
  if (t === 'grunray-splash-avatar-start') {
    const x = Number(ev.data?.x)
    const y = Number(ev.data?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      ackHandoffToIframe()
      return
    }
    void runAvatarHandoff(x, y)
  }
}

watch(
  () => ui.splashWoniuReplayTick,
  (tick) => {
    if (tick <= 0) return
    iframeKey.value = tick
    revealBeneath.value = false
    irisVeilActive.value = false
    clearIrisVeilStyles()
    visible.value = true
  },
)

onMounted(() => {
  window.addEventListener('message', onMessage)
  let reduced = false
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    /* ignore */
  }
  if (reduced) return
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return
  } catch {
    /* ignore */
  }
  visible.value = true
})

onUnmounted(() => {
  window.removeEventListener('message', onMessage)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="splash-woniu"
      :class="{ 'splash-woniu--reveal-beneath': revealBeneath }"
      role="dialog"
      aria-modal="true"
      aria-label="开屏"
    >
      <button type="button" class="splash-woniu__skip" @click="dismiss">
        {{ t('splash.skip') }}
      </button>
      <iframe
        ref="splashIframeRef"
        :key="iframeKey"
        class="splash-woniu__frame"
        :src="iframeSrc"
        title="开屏动画"
        referrerpolicy="no-referrer"
      />
      <div
        v-show="irisVeilActive"
        ref="irisVeilRef"
        class="splash-woniu__iris-veil"
        aria-hidden="true"
      />
      <img
        v-show="flyVisible"
        ref="flyImgRef"
        class="splash-woniu__fly-avatar"
        :src="flyAvatarSrc"
        alt=""
        width="1"
        height="1"
        aria-hidden="true"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.splash-woniu {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100dvh;
  padding: 0;
  margin: 0;
  background: var(--color-bg-base);
}

/** 落地后立刻透出主页，避免飞层与真实头像之间夹一层纯色遮罩造成闪烁 */
.splash-woniu--reveal-beneath {
  background-color: transparent;
}

.splash-woniu--reveal-beneath .splash-woniu__frame {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.splash-woniu--reveal-beneath .splash-woniu__skip {
  opacity: 0;
  pointer-events: none;
}

.splash-woniu__skip {
  position: absolute;
  top: max(12px, env(safe-area-inset-top, 0px));
  right: max(12px, env(safe-area-inset-right, 0px));
  z-index: 1;
  padding: 8px 14px;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--color-border);
  background: var(--color-bg-surface);
  color: var(--color-text-muted);
  font-family: var(--font-sans);
  font-size: 14px;
  cursor: pointer;
}

.splash-woniu__skip:hover {
  color: var(--color-text);
  border-color: var(--color-accent-muted);
}

/** 盖在 iframe 之上、飞层之下：用 mask 在中心「挖洞」并扩大，类似主题按钮 hover 的亮块向外推开 */
.splash-woniu__iris-veil {
  position: fixed;
  inset: 0;
  z-index: 250;
  pointer-events: none;
  background: var(--color-bg-base);
}

.splash-woniu__fly-avatar {
  position: fixed;
  inset: 0 auto auto 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  border: none;
  pointer-events: none;
  z-index: 260;
  object-fit: cover;
  object-position: center;
  border-radius: 50%;
  overflow: hidden;
}

.splash-woniu__frame {
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  height: 100%;
  min-height: 100%;
  border: 0;
  background: transparent;
}
</style>
