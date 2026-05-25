<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { prefersReducedMotionMedia } from '@/composables/usePageEnterAnimation'
import { setXiqiSplitFooterLock } from '@/composables/useXiqiSplitFooter'

const selectedKey = defineModel<string | null>('selectedKey', { default: null })
const emit = defineEmits<{
  detailClosed: []
}>()

defineProps<{
  detailTitle?: string
}>()

const { t } = useI18n()

const splitMainRef = ref<HTMLElement | null>(null)
/** 控制分栏布局（含 footer 锁定）；关闭详情后需等过渡结束再解除 */
const layoutSplit = ref(false)
/** 详情 leave 过渡期间保持右侧轨道展开，避免面板被裁切 */
const detailLeaving = ref(false)

const isOpen = computed(() => selectedKey.value !== null)
/** 详情轨道：打开分栏时与主栏并排；关闭后仅做过渡离场（fixed 浮层） */
const detailRailOpen = computed(() => isOpen.value || detailLeaving.value)

const SPLIT_LAYOUT_MS = 580
const MAIN_INNER_FLIP_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** 打开分栏时主栏内滚动偏移，关闭时作 fallback */
let preservedMainScroll = 0

function getMainInner(): HTMLElement | null {
  return splitMainRef.value?.querySelector('.xiqi-split-main-inner') ?? null
}

/** 整页滚动时，主栏内容已向下滚动的距离 */
function measureMainScrollOffset(): number {
  const inner = getMainInner()
  if (!inner) return 0
  const innerDocTop = inner.getBoundingClientRect().top + window.scrollY
  return Math.max(0, window.scrollY - innerDocTop)
}

function restoreMainPanelScroll(offset: number) {
  const main = splitMainRef.value
  if (!main) return
  main.scrollTop = offset
}

function restoreWindowScrollFromPanel(panelScroll: number) {
  const inner = getMainInner()
  if (!inner) return
  const innerDocTop = inner.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top: Math.max(0, innerDocTop + panelScroll), behavior: 'auto' })
}

async function afterSplitLayout() {
  await nextTick()
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

function clearMainInnerFlipStyles(inner: HTMLElement) {
  inner.style.transition = ''
  inner.style.transform = ''
}

/** 分栏开关时主栏 FLIP：居中全宽 → 左侧固定宽（仅打开时使用） */
function flipMainInnerAfterLayout(before: DOMRect | null) {
  const inner = getMainInner()
  if (!inner || !before || prefersReducedMotionMedia()) return

  const after = inner.getBoundingClientRect()
  const dx = before.left - after.left
  const dy = before.top - after.top
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return

  clearMainInnerFlipStyles(inner)
  inner.style.transform = `translate(${dx}px, ${dy}px)`

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      inner.style.transition = `transform ${SPLIT_LAYOUT_MS}ms ${MAIN_INNER_FLIP_EASING}`
      inner.style.transform = ''

      const onEnd = (ev: TransitionEvent) => {
        if (ev.target !== inner || ev.propertyName !== 'transform') return
        inner.removeEventListener('transitionend', onEnd)
        clearMainInnerFlipStyles(inner)
      }
      inner.addEventListener('transitionend', onEnd)
    })
  })
}

function closeDetail() {
  selectedKey.value = null
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    closeDetail()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onDocumentKeydown)
})

watch(isOpen, async (open) => {
  const main = splitMainRef.value
  const mainInner = getMainInner()
  const beforeRect = mainInner?.getBoundingClientRect() ?? null

  if (open) {
    detailLeaving.value = false
    preservedMainScroll = measureMainScrollOffset()
    const scrollOffset = preservedMainScroll
    layoutSplit.value = true
    setXiqiSplitFooterLock(true)
    if (!main) return
    await nextTick()
    flipMainInnerAfterLayout(beforeRect)
    await afterSplitLayout()
    restoreMainPanelScroll(scrollOffset)
    return
  }

  if (!open && layoutSplit.value) {
    detailLeaving.value = true
    const scrollToRestore = main?.scrollTop ?? preservedMainScroll

    const inner = getMainInner()
    if (inner) clearMainInnerFlipStyles(inner)
    layoutSplit.value = false
    setXiqiSplitFooterLock(false, { deferRefresh: true })

    await nextTick()
    restoreWindowScrollFromPanel(scrollToRestore)
    requestAnimationFrame(() => {
      restoreWindowScrollFromPanel(scrollToRestore)
    })
  }
})

async function onDetailAfterLeave() {
  detailLeaving.value = false
  if (isOpen.value) return
  emit('detailClosed')
  preservedMainScroll = 0
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
  const inner = getMainInner()
  if (inner) clearMainInnerFlipStyles(inner)
  layoutSplit.value = false
  detailLeaving.value = false
  preservedMainScroll = 0
  setXiqiSplitFooterLock(false)
})
</script>

<template>
  <section class="xiqi-page" :class="{ 'xiqi-page--split': layoutSplit }">
    <div
      class="xiqi-split"
      :class="{
        'xiqi-split--open': detailRailOpen && layoutSplit,
        'xiqi-split--detail-leaving': detailLeaving && !layoutSplit,
      }"
    >
      <div ref="splitMainRef" class="xiqi-split-main">
        <div class="xiqi-split-main-inner">
          <slot />
        </div>
      </div>

      <div
        class="xiqi-split-detail-rail"
        :class="{ 'xiqi-split-detail-rail--open': detailRailOpen }"
      >
        <Transition name="xiqi-detail" @after-leave="onDetailAfterLeave">
          <aside
            v-if="isOpen"
            class="xiqi-split-detail card card-glass-dense"
            role="complementary"
            :aria-label="detailTitle || t('xiqi.detailPanel')"
          >
            <header class="xiqi-detail-head">
              <p v-if="detailTitle" class="xiqi-detail-title">{{ detailTitle }}</p>
              <button
                type="button"
                class="xiqi-detail-close"
                :aria-label="t('xiqi.closeDetail')"
                @click="closeDetail"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </header>
            <div class="xiqi-detail-body">
              <slot name="detail" />
            </div>
          </aside>
        </Transition>
      </div>
    </div>
  </section>
</template>
