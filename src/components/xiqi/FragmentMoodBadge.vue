<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { FragmentMood } from '@/content/data/mockFragments'

const props = withDefaults(
  defineProps<{
    mood: FragmentMood
    size?: 'sm' | 'md'
  }>(),
  { size: 'sm' },
)

const { t } = useI18n()

const label = computed(() => {
  const map: Record<FragmentMood, string> = {
    rant: t('fragments.moodRant'),
    sketch: t('fragments.moodSketch'),
    flash: t('fragments.moodFlash'),
    daily: t('fragments.moodDaily'),
  }
  return map[props.mood]
})

const hint = computed(() => {
  const map: Record<FragmentMood, string> = {
    rant: t('fragments.moodRantHint'),
    sketch: t('fragments.moodSketchHint'),
    flash: t('fragments.moodFlashHint'),
    daily: t('fragments.moodDailyHint'),
  }
  return map[props.mood]
})
</script>

<template>
  <span
    class="fragment-mood"
    :class="[`fragment-mood--${mood}`, `fragment-mood--${size}`]"
    :title="hint"
    :aria-label="hint"
  >
    <svg
      class="fragment-mood-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <!-- rant: 气泡 + 叹号 -->
      <template v-if="mood === 'rant'">
        <path d="M7 9.5a4.5 4.5 0 0 1 9 0c0 2.2-1.6 3.4-3 4.2-.8.4-1.2.9-1.2 1.8v.5" />
        <path d="M12 17.5h.01" />
        <path d="M11 20.5h2" />
      </template>
      <!-- sketch: 笔 -->
      <template v-else-if="mood === 'sketch'">
        <path d="M4 20h4l9.5-9.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
        <path d="M13.5 6.5l3 3" />
      </template>
      <!-- flash: 闪电 -->
      <template v-else-if="mood === 'flash'">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
      </template>
      <!-- daily: 叶子 -->
      <template v-else>
        <path d="M12 21c-4-3.5-6-7.5-6-11a6 6 0 0 1 12 0c0 3.5-2 7.5-6 11z" />
        <path d="M12 21V10" />
      </template>
    </svg>
    <span class="fragment-mood-label">{{ label }}</span>
  </span>
</template>
