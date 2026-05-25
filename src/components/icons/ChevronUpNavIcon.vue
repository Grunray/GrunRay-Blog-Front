<template>
  <svg
    class="chevron-up-nav-icon"
    :class="{ 'chevron-up-nav-icon--open': open }"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m18 15-6-6-6 6" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ open?: boolean }>(), { open: false })
</script>

<style scoped>
.chevron-up-nav-icon {
  display: block;
  width: 0.94rem;
  height: 0.94rem;
  flex-shrink: 0;
  color: inherit;
  transition: transform 0.2s ease;
}

.chevron-up-nav-icon--open {
  transform: rotate(180deg);
}
</style>
