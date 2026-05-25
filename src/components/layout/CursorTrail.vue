<script setup lang="ts">
import gsap from 'gsap'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

import { useUiStore } from '@/stores/ui'

import '@/styles/cursor-trail.css'

const props = withDefaults(
  defineProps<{
    /** 按原样显示（含大小写、中文）；不再强制 CSS 大写 */
    text?: string
  }>(),
  { text: 'GrunRay' },
)

const ui = useUiStore()
const rootRef = ref<HTMLElement | null>(null)

const chars = computed(() => props.text.split(''))

let moveHandler: ((e: PointerEvent) => void) | null = null

function teardown() {
  if (moveHandler) {
    window.removeEventListener('pointermove', moveHandler)
    moveHandler = null
  }
  const el = rootRef.value
  if (el) {
    gsap.killTweensOf(el.querySelectorAll('.cursor-trail__char'))
  }
}

function bindTrail() {
  teardown()
  if (!ui.cursorTrailActive) return
  const el = rootRef.value
  if (!el) return
  const arr = Array.from(el.querySelectorAll('.cursor-trail__char')) as HTMLElement[]
  if (!arr.length) return

  moveHandler = (e: PointerEvent) => {
    if (!e.isPrimary) return
    gsap.to(arr, {
      x: e.clientX,
      y: e.clientY,
      stagger: 0.05,
      overwrite: 'auto',
    })
  }
  window.addEventListener('pointermove', moveHandler, { passive: true })
}

watch(
  () => ui.cursorTrailActive,
  async (active) => {
    if (!active) {
      teardown()
      return
    }
    await nextTick()
    bindTrail()
  },
  { flush: 'post', immediate: true },
)

/** v-if 挂载后 ref 才存在，需在下一帧再绑一次 */
watch(rootRef, async () => {
  if (!ui.cursorTrailActive) return
  await nextTick()
  bindTrail()
})

onUnmounted(() => {
  teardown()
})

function charStyle(i: number) {
  return {
    '--i': String(i + 1),
    left: `${i * 0.6}em`,
    filter: `hue-rotate(${i * 10}deg)`,
  } as Record<string, string>
}
</script>

<template>
  <Teleport to="body">
    <div v-if="ui.cursorTrailActive" class="cursor-trail-layer" aria-hidden="true">
      <div ref="rootRef" class="cursor-trail">
        <span
          v-for="(char, i) in chars"
          :key="i"
          class="cursor-trail__char"
          :style="charStyle(i)"
        >
          {{ char === ' ' ? '\u00a0' : char }}
        </span>
      </div>
    </div>
  </Teleport>
</template>
