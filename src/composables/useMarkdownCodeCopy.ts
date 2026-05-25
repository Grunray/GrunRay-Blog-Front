import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

import { copyTextToClipboard } from '@/composables/useCopyToClipboard'

export interface MarkdownCodeCopyLabels {
  copy: string
  copyDone: string
}

const COPY_BTN_CLASS = 'md-code-copy-btn'
const COPY_RESET_MS = 1600

function extractCodeText(block: HTMLElement): string {
  const pre = block.matches('pre') ? block : block.querySelector('pre')
  const source = pre ?? block.querySelector('code') ?? block
  return (source.textContent ?? '').replace(/\n$/, '')
}

function createCopyButton(labels: MarkdownCodeCopyLabels): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = COPY_BTN_CLASS
  btn.setAttribute('aria-label', labels.copy)
  btn.title = labels.copy

  const icon = document.createElement('span')
  icon.className = 'md-code-copy-btn__icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke-linecap="round"/></svg>`

  const doneMark = document.createElement('span')
  doneMark.className = 'md-code-copy-btn__check'
  doneMark.setAttribute('aria-hidden', 'true')
  doneMark.textContent = '√'

  const doneLabel = document.createElement('span')
  doneLabel.className = 'md-code-copy-btn__label'
  doneLabel.textContent = labels.copyDone

  btn.append(icon, doneMark, doneLabel)
  return btn
}

/**
 * 为 v-html 渲染的 Markdown 正文中的 `.codehilite` 代码块注入右上角复制按钮。
 */
export function useMarkdownCodeCopy(
  containerRef: Ref<HTMLElement | null>,
  labels: Ref<MarkdownCodeCopyLabels>,
  contentKey: Ref<string>,
) {
  const cleanups: (() => void)[] = []

  function cleanup() {
    for (const fn of cleanups) fn()
    cleanups.length = 0
  }

  function attach() {
    cleanup()
    const root = containerRef.value
    if (!root) return

    const { copy, copyDone } = labels.value
    const blocks = root.querySelectorAll<HTMLElement>('.codehilite')

    for (const block of blocks) {
      if (block.querySelector(`.${COPY_BTN_CLASS}`)) continue

      block.classList.add('md-code-block--copyable')

      const btn = createCopyButton({ copy, copyDone })
      let resetTimer: ReturnType<typeof setTimeout> | null = null

      const onClick = async () => {
        const text = extractCodeText(block)
        const ok = await copyTextToClipboard(text)
        if (!ok) return

        btn.classList.add(`${COPY_BTN_CLASS}--done`)
        btn.setAttribute('aria-label', copyDone)
        btn.title = copyDone

        if (resetTimer) clearTimeout(resetTimer)
        resetTimer = setTimeout(() => {
          btn.classList.remove(`${COPY_BTN_CLASS}--done`)
          btn.setAttribute('aria-label', copy)
          btn.title = copy
          resetTimer = null
        }, COPY_RESET_MS)
      }

      btn.addEventListener('click', onClick)
      block.appendChild(btn)
      cleanups.push(() => {
        btn.removeEventListener('click', onClick)
        if (resetTimer) clearTimeout(resetTimer)
        btn.remove()
        block.classList.remove('md-code-block--copyable')
      })
    }
  }

  watch(
    [containerRef, contentKey, labels],
    async () => {
      await nextTick()
      attach()
    },
    { flush: 'post' },
  )

  onBeforeUnmount(cleanup)

  return { refresh: attach }
}
