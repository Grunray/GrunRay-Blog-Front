<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t, locale } = useI18n()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const draftDate = ref('')
const draftHour = ref('12')
const draftMinute = ref('00')

const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const v = String(i).padStart(2, '0')
  return { value: v, label: v }
})

const minuteOptions = Array.from({ length: 60 }, (_, i) => {
  const v = String(i).padStart(2, '0')
  return { value: v, label: v }
})

const displayLabel = computed(() => {
  const raw = props.modelValue.trim()
  if (!raw) return t('fragments.compose.createdAtEmpty')
  const d = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return raw.replace('T', ' ')
  const loc = locale.value === 'zh' ? 'zh-CN' : 'en-US'
  return d.toLocaleString(loc, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

function parseModelToDraft(value: string) {
  const raw = value.trim()
  if (!raw) {
    const now = new Date()
    draftDate.value = now.toISOString().slice(0, 10)
    draftHour.value = String(now.getHours()).padStart(2, '0')
    draftMinute.value = String(now.getMinutes()).padStart(2, '0')
    return
  }
  const normalized = raw.replace(' ', 'T')
  draftDate.value = normalized.slice(0, 10)
  const timePart = normalized.slice(11, 16)
  const [h = '12', m = '00'] = timePart.split(':')
  draftHour.value = h.padStart(2, '0').slice(0, 2)
  draftMinute.value = m.padStart(2, '0').slice(0, 2)
}

function toggleMenu() {
  if (!open.value) parseModelToDraft(props.modelValue)
  open.value = !open.value
}

function closeMenu() {
  open.value = false
}

function applyDraft() {
  if (!draftDate.value) return
  emit('update:modelValue', `${draftDate.value}T${draftHour.value}:${draftMinute.value}:00`)
  closeMenu()
}

function setNow() {
  const now = new Date()
  draftDate.value = now.toISOString().slice(0, 10)
  draftHour.value = String(now.getHours()).padStart(2, '0')
  draftMinute.value = String(now.getMinutes()).padStart(2, '0')
}

function onDocumentPointerDown(event: MouseEvent) {
  const root = rootRef.value
  if (!root) return
  const target = event.target as Node | null
  if (target && !root.contains(target)) closeMenu()
}

watch(
  () => props.modelValue,
  (value) => {
    if (!open.value) parseModelToDraft(value)
  },
  { immediate: true },
)

onMounted(() => document.addEventListener('mousedown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocumentPointerDown))
</script>

<template>
  <div ref="rootRef" class="datetime-field" :class="{ 'datetime-field--open': open }">
    <div class="datetime-display" :aria-label="ariaLabel">
      <span class="datetime-display-label">{{ displayLabel }}</span>
    </div>
    <button
      type="button"
      class="datetime-trigger"
      :aria-expanded="open"
      aria-haspopup="dialog"
      :aria-label="t('fragments.compose.createdAtPick')"
      @click="toggleMenu"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round" />
      </svg>
    </button>

    <div v-if="open" class="select-menu card datetime-menu" role="dialog" :aria-label="t('fragments.compose.createdAtPick')">
      <p class="datetime-menu-title">{{ t('fragments.compose.createdAtPick') }}</p>
      <label class="datetime-menu-field">
        <span>{{ t('fragments.compose.createdAtDate') }}</span>
        <input v-model="draftDate" type="date" class="datetime-date-input" />
      </label>
      <div class="datetime-menu-time">
        <label class="datetime-menu-field">
          <span>{{ t('fragments.compose.createdAtHour') }}</span>
          <select v-model="draftHour" class="datetime-time-select">
            <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
        <label class="datetime-menu-field">
          <span>{{ t('fragments.compose.createdAtMinute') }}</span>
          <select v-model="draftMinute" class="datetime-time-select">
            <option v-for="opt in minuteOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
      </div>
      <div class="datetime-menu-actions">
        <button type="button" class="btn-accent datetime-menu-btn" @click="setNow">
          {{ t('fragments.compose.createdAtNow') }}
        </button>
        <button type="button" class="btn-accent datetime-menu-btn datetime-menu-btn--primary" @click="applyDraft">
          {{ t('fragments.compose.createdAtConfirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.datetime-field {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 0.45rem;
  min-width: 0;
  width: 100%;
}

.datetime-field--open {
  z-index: 40;
}

.datetime-display {
  flex: 1 1 auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  padding: 0.42rem 0.62rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg-surface) 88%, transparent);
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.2;
}

.datetime-display-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datetime-trigger {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.05rem;
  height: 2.05rem;
  padding: 0;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 36%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.datetime-trigger:hover {
  border-color: color-mix(in srgb, var(--color-accent) 56%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  transform: translateY(-1px);
}

.datetime-trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.select-menu {
  position: absolute;
  top: calc(100% + 0.45rem);
  right: 0;
  z-index: 41;
  width: min(18rem, 92vw);
  padding: 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-surface) 92%, transparent);
  box-shadow: var(--shadow-card);
}

.datetime-menu-title {
  margin: 0 0 0.55rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.datetime-menu-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.datetime-menu-field + .datetime-menu-field,
.datetime-menu-time {
  margin-top: 0.55rem;
}

.datetime-menu-time {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
}

.datetime-date-input,
.datetime-time-select {
  width: 100%;
  padding: 0.42rem 0.55rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg-surface) 88%, transparent);
  color: var(--color-text);
  font: inherit;
  font-size: 0.88rem;
}

.datetime-menu-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-top: 0.65rem;
}

.datetime-menu-btn {
  min-height: 1.85rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.82rem;
}

.datetime-menu-btn--primary {
  border-color: color-mix(in srgb, var(--color-accent) 56%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 20%, var(--color-bg-surface));
}
</style>
