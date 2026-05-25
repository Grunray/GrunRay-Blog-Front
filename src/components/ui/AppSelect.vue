<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface AppSelectOption<T extends string = string> {
  value: T
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: AppSelectOption[]
    ariaLabel?: string
    minWidth?: string
  }>(),
  {
    minWidth: '240px',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(
  () => props.options.find((item) => item.value === props.modelValue)?.label ?? props.modelValue,
)

function toggleMenu() {
  open.value = !open.value
}

function closeMenu() {
  open.value = false
}

function selectOption(value: string) {
  emit('update:modelValue', value)
  closeMenu()
}

function onDocumentPointerDown(event: MouseEvent) {
  const root = rootRef.value
  if (!root) return
  const target = event.target as Node | null
  if (target && !root.contains(target)) closeMenu()
}

onMounted(() => document.addEventListener('mousedown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocumentPointerDown))
</script>

<template>
  <div ref="rootRef" class="select-wrap" :class="{ 'select-wrap--open': open }" :style="{ minWidth: minWidth === '0' ? '0' : minWidth }">
    <button
      class="select-btn"
      type="button"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="ariaLabel"
      @click="toggleMenu"
    >
      <span class="select-btn-label">{{ selectedLabel }}</span>
      <span class="select-btn-caret" aria-hidden="true">▾</span>
    </button>
    <div v-if="open" class="select-menu card" role="listbox">
      <button
        v-for="option in options"
        :key="option.value"
        class="select-option"
        type="button"
        role="option"
        :aria-selected="modelValue === option.value"
        :class="{ 'select-option--active': modelValue === option.value }"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.select-wrap {
  position: relative;
  display: inline-block;
  width: 100%;
}

.select-wrap--open {
  z-index: 40;
}

.select-btn {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  padding: 0.42rem 0.62rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg-surface) 88%, transparent);
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.2;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.select-btn:hover {
  border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
}

.select-btn:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--color-accent) 58%, var(--color-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.select-btn-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-btn-caret {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.select-menu {
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 0;
  z-index: 41;
  width: 100%;
  max-height: 260px;
  overflow: auto;
  padding: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-surface) 92%, transparent);
  box-shadow: var(--shadow-card);
}

.select-option {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.55rem;
  margin: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.select-option:hover {
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
}

.select-option--active {
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  color: var(--color-accent);
}
</style>
