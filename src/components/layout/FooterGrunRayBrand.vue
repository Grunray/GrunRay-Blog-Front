<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { FooterGrunRaySliceEntry } from '@/composables/useFooterGrunRayReveal'

const SLICE_COUNT = 20

const LETTER_ASSETS = [
  { src: '/footer/16gl-G.svg', char: 'G' },
  { src: '/footer/16gl-R.svg', char: 'R' },
  { src: '/footer/16gl-U.svg', char: 'U' },
  { src: '/footer/16gl-N.svg', char: 'N' },
  { src: '/footer/16gl-R.svg', char: 'R' },
  { src: '/footer/16gl-A.svg', char: 'A' },
  { src: '/footer/16gl-Y.svg', char: 'Y' },
] as const

const brandWordRef = ref<HTMLElement | null>(null)

const emit = defineEmits<{
  ready: [payload: { entries: FooterGrunRaySliceEntry[]; wordEl: HTMLElement }]
}>()

function buildBrand() {
  const root = brandWordRef.value
  if (!root) return

  root.innerHTML = ''
  const entries: FooterGrunRaySliceEntry[] = []

  for (const asset of LETTER_ASSETS) {
    const letter = document.createElement('div')
    letter.className = 'footer-grunray-letter'
    letter.dataset.char = asset.char

    const slicesWrap = document.createElement('div')
    slicesWrap.className = 'footer-grunray-letter__slices'

    for (let i = 0; i < SLICE_COUNT; i++) {
      const slice = document.createElement('div')
      slice.className = 'footer-grunray-letter__slice'

      const inner = document.createElement('div')
      inner.className = 'footer-grunray-letter__slice-inner'
      inner.style.setProperty('--slice-index', String(i))

      const img = document.createElement('img')
      img.className = 'footer-grunray-letter__glyph'
      img.src = asset.src
      img.alt = ''
      img.setAttribute('aria-hidden', 'true')
      img.draggable = false

      inner.appendChild(img)
      slice.appendChild(inner)
      slicesWrap.appendChild(slice)

      entries.push({ band: slice, inner, sliceIndex: i })
    }

    letter.appendChild(slicesWrap)
    root.appendChild(letter)
  }

  emit('ready', { entries, wordEl: root })
}

onMounted(() => {
  buildBrand()
})
</script>

<template>
  <div ref="brandWordRef" class="footer-grunray-brand-word" role="img" aria-label="GRUNRAY" />
</template>
