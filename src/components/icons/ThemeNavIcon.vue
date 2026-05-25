<template>
  <!-- 浅色：太阳；深色：月亮；隐藏配色：错位双层方框（RGB 分离感） -->
  <svg
    v-if="theme === 'light'"
    class="theme-nav-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
  <svg
    v-else-if="theme === 'dark'"
    class="theme-nav-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
  <svg
    v-else
    class="theme-nav-icon theme-nav-icon--abstract"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="square"
    stroke-linejoin="miter"
    aria-hidden="true"
  >
    <rect class="theme-nav-icon__ghost" x="5.5" y="5.5" width="11" height="11" />
    <rect class="theme-nav-icon__front" x="8.5" y="8.5" width="11" height="11" />
  </svg>
</template>

<script setup lang="ts">
import type { ThemeId } from '@/types/content'

defineProps<{ theme: ThemeId }>()
</script>

<style scoped>
.theme-nav-icon {
  display: block;
  width: 0.94rem;
  height: 0.94rem;
  flex-shrink: 0;
  color: inherit;
}

.theme-nav-icon--abstract .theme-nav-icon__ghost {
  opacity: 0.52;
}

.theme-nav-icon--abstract .theme-nav-icon__front {
  opacity: 1;
}
</style>
