<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { RecommendCategory } from '@/services/recommendApi'

const props = withDefaults(
  defineProps<{
    category: RecommendCategory
    size?: 'sm' | 'md'
  }>(),
  { size: 'sm' },
)

const { t } = useI18n()

const label = computed(() => {
  const map: Record<RecommendCategory, string> = {
    software: t('recommend.categorySoftware'),
    opensource: t('recommend.categoryOpensource'),
    anime: t('recommend.categoryAnime'),
  }
  return map[props.category]
})

const hint = computed(() => {
  const map: Record<RecommendCategory, string> = {
    software: t('recommend.categorySoftwareHint'),
    opensource: t('recommend.categoryOpensourceHint'),
    anime: t('recommend.categoryAnimeHint'),
  }
  return map[props.category]
})
</script>

<template>
  <span
    class="recommend-category"
    :class="[`recommend-category--${category}`, `recommend-category--${size}`]"
    :title="hint"
    :aria-label="hint"
  >
    <svg
      class="recommend-category-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <template v-if="category === 'software'">
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 18v2" />
      </template>
      <template v-else-if="category === 'opensource'">
        <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .7-1.4 1.5-2 1.3-1 2.5-2.2 2.5-4.8 0-3.5-2.8-6-6.5-6S4 8.2 4 11.7c0 2.6 1.2 3.8 2.5 4.8.8.6 1.5 1 1.5 2V22" />
      </template>
      <template v-else>
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M10 9l5 3-5 3V9z" />
      </template>
    </svg>
    <span class="recommend-category-label">{{ label }}</span>
  </span>
</template>
