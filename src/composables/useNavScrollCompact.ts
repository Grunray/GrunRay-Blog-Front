import { onMounted, onUnmounted, ref } from 'vue'

export interface NavScrollCompactOptions {
  /** 向下滚动超过该值 → 进入紧凑（胶囊）态，应明显大于 exitPx */
  enterPx?: number
  /** 向上滚动低于该值 → 恢复横条态；与 enter 形成滞回，避免形态切换时布局变化导致来回抖动 */
  exitPx?: number
}

const DEFAULT_ENTER = 56
const DEFAULT_EXIT = 8

/**
 * 参考 LiquidGlass 类站点顶栏：滚动后紧凑。
 * 必须用双阈值滞回：单阈值时，横条↔胶囊高度差会改变文档布局，易使 scrollY 在阈值附近反复横跳。
 */
export function useNavScrollCompact(opts: NavScrollCompactOptions = {}) {
  const enterPx = opts.enterPx ?? DEFAULT_ENTER
  const exitPx = Math.min(opts.exitPx ?? DEFAULT_EXIT, enterPx - 1)

  const compact = ref(false)

  function syncFromScrollY(y: number) {
    if (compact.value) {
      if (y < exitPx) compact.value = false
    } else {
      if (y >= enterPx) compact.value = true
    }
  }

  function tick() {
    syncFromScrollY(window.scrollY)
  }

  onMounted(() => {
    tick()
    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', tick, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', tick)
    window.removeEventListener('resize', tick)
  })

  return { compact }
}
