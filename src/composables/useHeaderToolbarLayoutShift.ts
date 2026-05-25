/** 顶栏工具槽 FLIP：消失后再移动 / 先移动再出现（overshoot 回弹） */

export type ToolbarFlipSnapshot = Map<string, DOMRectReadOnly>

const FLIP_DURATION_MS = 440

export function captureToolbarFlipSlots(root: HTMLElement | null): ToolbarFlipSnapshot {
  const map = new Map<string, DOMRectReadOnly>()
  if (!root) return map
  root.querySelectorAll<HTMLElement>('[data-toolbar-flip]').forEach((el) => {
    const id = el.dataset.toolbarFlip
    if (!id) return
    const r = el.getBoundingClientRect()
    if (r.width < 0.5 && r.height < 0.5) return
    map.set(id, r)
  })
  return map
}

function overshootKeyframes(dx: number, dy: number): Keyframe[] {
  const ox = -dx * 0.14
  const oy = -dy * 0.14
  return [
    { transform: `translate(${dx}px, ${dy}px)` },
    { transform: `translate(${ox}px, ${oy}px)`, offset: 0.68 },
    { transform: 'translate(0px, 0px)' },
  ]
}

export function playToolbarFlipAfterRemove(
  before: ToolbarFlipSnapshot,
  root: HTMLElement | null,
  prefersReducedMotion: boolean,
): Promise<void> {
  if (prefersReducedMotion || !root || before.size === 0) return Promise.resolve()

  const after = captureToolbarFlipSlots(root)
  const tasks: Promise<void>[] = []

  before.forEach((rB, id) => {
    const rA = after.get(id)
    const el = root.querySelector<HTMLElement>(`[data-toolbar-flip="${id}"]`)
    if (!rA || !el || rA.width < 0.5 || rA.height < 0.5) return
    const dx = rB.left - rA.left
    const dy = rB.top - rA.top
    if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) return

    el.style.transform = `translate(${dx}px, ${dy}px)`
    tasks.push(
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const anim = el.animate(overshootKeyframes(dx, dy), {
            duration: FLIP_DURATION_MS,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          })
          anim.onfinish = () => {
            el.style.transform = ''
            resolve()
          }
        })
      }),
    )
  })

  return tasks.length ? Promise.all(tasks).then(() => undefined) : Promise.resolve()
}

/** 从「未出现槽位」布局过渡到「已出现」布局：对槽位做 FLIP（可跳过新出现的槽 id，如 photo） */
export function playToolbarFlipBeforeReveal(
  narrow: ToolbarFlipSnapshot,
  wide: ToolbarFlipSnapshot,
  root: HTMLElement | null,
  prefersReducedMotion: boolean,
  skipIds: Set<string> = new Set(),
): Promise<void> {
  if (prefersReducedMotion || !root || narrow.size === 0) return Promise.resolve()

  const tasks: Promise<void>[] = []

  narrow.forEach((rN, id) => {
    if (skipIds.has(id)) return
    const rW = wide.get(id)
    const el = root.querySelector<HTMLElement>(`[data-toolbar-flip="${id}"]`)
    if (!rW || !el) return
    const dx = rN.left - rW.left
    const dy = rN.top - rW.top
    if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) return

    el.style.transform = `translate(${dx}px, ${dy}px)`
    tasks.push(
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const anim = el.animate(overshootKeyframes(dx, dy), {
            duration: FLIP_DURATION_MS,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          })
          anim.onfinish = () => {
            el.style.transform = ''
            resolve()
          }
        })
      }),
    )
  })

  return tasks.length ? Promise.all(tasks).then(() => undefined) : Promise.resolve()
}
