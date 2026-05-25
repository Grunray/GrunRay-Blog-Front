<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  icon: 'travellings' | 'acg-trip'
}>()

const gradId = `special-link-icon-bg-${useId()}`
</script>

<template>
  <svg
    class="special-link-icon"
    :class="`special-link-icon--${icon}`"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="gradId" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop class="special-link-icon-stop-a" />
        <stop offset="1" class="special-link-icon-stop-b" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="36" height="36" rx="10" :fill="`url(#${gradId})`" />

    <!-- 开往：骰子 + 网址 -->
    <template v-if="icon === 'travellings'">
      <rect x="9" y="9" width="18" height="18" rx="4" fill="rgba(255,255,255,0.95)" />
      <circle cx="14" cy="14" r="1.5" fill="var(--color-accent)" />
      <circle cx="22" cy="14" r="1.5" fill="var(--color-accent)" />
      <circle cx="18" cy="18" r="1.5" fill="var(--color-accent)" />
      <circle cx="14" cy="22" r="1.5" fill="var(--color-accent)" />
      <circle cx="22" cy="22" r="1.5" fill="var(--color-accent)" />
      <circle cx="28" cy="28" r="7" fill="rgba(255,255,255,0.96)" stroke="var(--color-accent)" stroke-width="1.2" />
      <path
        d="M25.2 28.2a2.2 2.2 0 0 1 3.1-3.1l0.9-0.9a2.2 2.2 0 1 1 3.1 3.1l-0.9 0.9"
        stroke="var(--color-accent)"
        stroke-width="1.35"
        stroke-linecap="round"
      />
      <path
        d="M30.8 27.8a2.2 2.2 0 0 0-3.1 3.1l-0.9 0.9a2.2 2.2 0 1 0-3.1-3.1l0.9-0.9"
        stroke="var(--color-accent)"
        stroke-width="1.35"
        stroke-linecap="round"
      />
      <path d="M26.5 31.5h3" stroke="var(--color-accent)" stroke-width="1.2" stroke-linecap="round" />
    </template>

    <!-- 异次元之旅：星球 + 轨道环 -->
    <template v-else>
      <rect x="9" y="9" width="18" height="18" rx="4" fill="rgba(255,255,255,0.95)" />
      <circle class="special-link-icon-planet" cx="18" cy="18" r="5" />
      <ellipse
        cx="18"
        cy="18"
        rx="8"
        ry="3"
        stroke="var(--color-accent)"
        stroke-width="1.3"
        transform="rotate(-24 18 18)"
      />
      <circle cx="12" cy="12" r="1.2" fill="var(--color-accent)" opacity="0.85" />
      <circle cx="24" cy="13" r="1" fill="var(--color-accent)" opacity="0.7" />
      <circle cx="23" cy="23" r="0.9" fill="var(--color-accent)" opacity="0.65" />
    </template>
  </svg>
</template>

<style scoped>
.special-link-icon {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.special-link-icon-stop-a {
  stop-color: var(--color-accent);
}

.special-link-icon-stop-b {
  stop-color: color-mix(in srgb, var(--color-accent) 55%, #6b5cff);
}

.special-link-icon--acg-trip .special-link-icon-stop-b {
  stop-color: color-mix(in srgb, var(--color-accent) 45%, #e879f9);
}

.special-link-icon-planet {
  fill: color-mix(in srgb, var(--color-accent) 70%, #c77dff);
}
</style>
