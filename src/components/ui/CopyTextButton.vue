<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCopyToClipboard } from '@/composables/useCopyToClipboard'

const props = defineProps<{
  text: string
  label?: string
}>()

const { t } = useI18n()
const { copyWithFeedback } = useCopyToClipboard()
const justCopied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function onCopy() {
  const ok = await copyWithFeedback(props.text)
  if (!ok) return
  justCopied.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    justCopied.value = false
    timer = null
  }, 1600)
}
</script>

<template>
  <button
    type="button"
    class="copy-text-btn"
    :title="justCopied ? t('friends.copyDone') : (label ?? t('friends.copy'))"
    :aria-label="justCopied ? t('friends.copyDone') : (label ?? t('friends.copy'))"
    @click="onCopy"
  >
    <svg
      v-if="!justCopied"
      class="copy-text-btn-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke-linecap="round" />
    </svg>
    <svg
      v-else
      class="copy-text-btn-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      aria-hidden="true"
    >
      <path d="M5 12l4 4L19 6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
</template>

<style scoped>
.copy-text-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-card-border);
  background: color-mix(in srgb, var(--glass-card-bg) 90%, transparent);
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.copy-text-btn:hover {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 40%, var(--glass-card-border));
  background: color-mix(in srgb, var(--color-accent) 10%, var(--glass-card-bg));
  transform: translateY(-1px);
}

.copy-text-btn-icon {
  display: block;
}
</style>
