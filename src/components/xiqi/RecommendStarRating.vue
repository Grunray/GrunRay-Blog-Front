<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    /** 展示模式：已填充星数；筛选模式：当前选中的星数（null 为未筛选） */
    rating?: number | null
    max?: number
    /** display=只读展示 · filter=工具栏筛选 */
    mode?: 'display' | 'filter'
  }>(),
  {
    rating: 0,
    max: 5,
    mode: 'display',
  },
)

const emit = defineEmits<{
  'update:rating': [value: number | null]
  select: [value: number | null]
}>()

const { t } = useI18n()

const stars = computed(() => Array.from({ length: props.max }, (_, i) => i + 1))

const activeValue = computed(() => {
  if (props.rating == null) return 0
  const n = Number(props.rating)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(props.max, Math.max(1, Math.round(n)))
})

const isFilter = computed(() => props.mode === 'filter')

function starLabel(n: number): string {
  return t('recommend.ratingStarLabel', { count: n })
}

function onStarClick(n: number) {
  if (!isFilter.value) return
  const next = activeValue.value === n ? null : n
  emit('update:rating', next)
  emit('select', next)
}

function onReset() {
  if (!isFilter.value) return
  emit('update:rating', null)
  emit('select', null)
}
</script>

<template>
  <div
    class="recommend-stars"
    :class="{
      'recommend-stars--filter': isFilter,
      'recommend-stars--display': !isFilter,
    }"
    :role="isFilter ? 'group' : undefined"
    :aria-label="isFilter ? t('recommend.filterRating') : undefined"
  >
    <button
      v-for="n in stars"
      :key="n"
      type="button"
      class="recommend-star"
      :class="{
        'is-filled': n <= activeValue,
        'is-active-filter': isFilter && activeValue === n,
      }"
      :disabled="!isFilter"
      :aria-label="starLabel(n)"
      :aria-pressed="isFilter ? activeValue === n : undefined"
      @click.stop="onStarClick(n)"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d="M12 3.5 14.8 9l6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.4 20.5l1.1-6.2L3 9.9 9.2 9 12 3.5z"
          fill="currentColor"
        />
      </svg>
    </button>
    <button
      v-if="isFilter && activeValue > 0"
      type="button"
      class="recommend-stars-reset"
      :aria-label="t('recommend.filterRatingReset')"
      @click.stop="onReset"
    >
      {{ t('recommend.filterRatingReset') }}
    </button>
  </div>
</template>

<style scoped>
.recommend-stars {
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
}

.recommend-stars--display {
  gap: 0.08rem;
}

.recommend-stars--filter {
  padding: 0.18rem 0.35rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
  background: color-mix(in srgb, var(--color-bg-surface) 70%, transparent);
}

.recommend-star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.08rem;
  border: none;
  background: transparent;
  color: color-mix(in srgb, var(--color-text-muted) 42%, transparent);
  line-height: 0;
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.recommend-stars--display .recommend-star {
  padding: 0;
  cursor: default;
}

.recommend-star.is-filled {
  color: color-mix(in srgb, #e8b84a 88%, #c9922e);
}

.recommend-stars--filter .recommend-star {
  cursor: pointer;
  color: color-mix(in srgb, var(--color-text-muted) 55%, transparent);
}

.recommend-stars--filter .recommend-star.is-filled {
  color: color-mix(in srgb, #e8b84a 92%, #c9922e);
}

.recommend-stars--filter .recommend-star.is-active-filter {
  transform: scale(1.08);
  filter: drop-shadow(0 0 4px color-mix(in srgb, #e8b84a 45%, transparent));
}

.recommend-stars--filter .recommend-star:hover:not(:disabled) {
  color: color-mix(in srgb, #e8b84a 78%, #c9922e);
}

.recommend-stars-reset {
  margin-left: 0.28rem;
  padding: 0.12rem 0.45rem;
  border: none;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.recommend-stars-reset:hover {
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
}
</style>
