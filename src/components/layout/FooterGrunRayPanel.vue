<script setup lang="ts">
import { computed, ref } from 'vue'

import { useFooterGrunRayReveal } from '@/composables/useFooterGrunRayReveal'

import FooterGrunRayBrand from './FooterGrunRayBrand.vue'
import FooterGrunRayMetaBar from './FooterGrunRayMetaBar.vue'

const footerRootRef = ref<HTMLElement | null>(null)
const brandWordRef = ref<HTMLElement | null>(null)

const { metaBarVisible, isInteractive, isFullyRevealed, registerSlices, syncBrandLayout } =
  useFooterGrunRayReveal(footerRootRef, brandWordRef)

const rootClasses = computed(() => ({
  'is-interactive': isInteractive.value,
  'is-fully-revealed': isFullyRevealed.value,
}))

function onBrandReady(payload: {
  entries: Parameters<typeof registerSlices>[0]
  wordEl: HTMLElement
}) {
  brandWordRef.value = payload.wordEl
  registerSlices(payload.entries)
  syncBrandLayout()
}
</script>

<template>
  <div
    ref="footerRootRef"
    class="footer-grunray-root"
    data-footer-reveal
    :class="rootClasses"
  >
    <footer class="footer-grunray-container">
      <div class="footer-grunray-brand-wrap">
        <div class="footer-grunray-brand-reveal">
          <div class="footer-grunray-content">
            <FooterGrunRayBrand @ready="onBrandReady" />
          </div>
        </div>
      </div>
      <FooterGrunRayMetaBar :meta-visible="metaBarVisible" />
    </footer>
  </div>
</template>
