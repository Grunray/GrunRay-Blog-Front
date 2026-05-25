<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import ChevronNavIcon from '../icons/ChevronNavIcon.vue'

export type SiteNavDropdownItem = {
  to: string
  label: string
  desc: string
  icon: Component
}

const props = defineProps<{
  label: string
  icon: Component
  items: SiteNavDropdownItem[]
  menuId: string
}>()

const route = useRoute()
const isHover = ref(false)
const isOpen = ref(false)
let leaveTimer = 0

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

const groupActive = computed(() => props.items.some((item) => isActive(item.to)))
const expanded = computed(() => isHover.value || isOpen.value)

function onEnter() {
  window.clearTimeout(leaveTimer)
  isHover.value = true
}

function onLeave() {
  window.clearTimeout(leaveTimer)
  leaveTimer = window.setTimeout(() => {
    isHover.value = false
  }, 80)
}

function onFocusOut(event: FocusEvent) {
  const group = event.currentTarget as HTMLElement | null
  const next = event.relatedTarget
  if (group && next instanceof Node && group.contains(next)) return
  onLeave()
}

function onTriggerClick() {
  isOpen.value = !isOpen.value
}

watch(
  () => route.path,
  () => {
    isOpen.value = false
    isHover.value = false
  },
)
</script>

<template>
  <div
    class="nav-group"
    :class="{ 'is-expanded': expanded }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onEnter"
    @focusout="onFocusOut"
  >
    <button
      type="button"
      class="group-trigger"
      :class="{ active: groupActive, 'is-expanded': expanded }"
      :aria-expanded="expanded ? 'true' : 'false'"
      :aria-controls="menuId"
      @click="onTriggerClick"
    >
      <span class="link-icon" aria-hidden="true">
        <component :is="icon" />
      </span>
      <span class="link-label">{{ label }}</span>
      <span class="link-icon link-icon--chevron" aria-hidden="true">
        <ChevronNavIcon />
      </span>
      <span class="leaf-glow" aria-hidden="true" />
      <span class="grow-line" aria-hidden="true" />
    </button>

    <Transition name="nav-group-dropdown">
      <div v-if="expanded" :id="menuId" class="dropdown" role="menu">
        <RouterLink
          v-for="(item, index) in items"
          :key="item.to"
          :to="item.to"
          class="dropdown-item"
          :class="{ active: isActive(item.to) }"
          :style="{ '--nav-item-i': index }"
          role="menuitem"
          @click="isOpen = false"
        >
          <span class="link-icon" aria-hidden="true">
            <component :is="item.icon" />
          </span>
          <span class="meta">
            <span class="meta-title">{{ item.label }}</span>
            <span class="meta-desc">{{ item.desc }}</span>
          </span>
        </RouterLink>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.nav-group {
  position: relative;
}

.group-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font: inherit;
  font-weight: 500;
  font-size: 0.92rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
  white-space: nowrap;
  padding: 0.7rem 1.05rem;
  border-radius: 999px;
  border: 1px solid transparent;
  background-color: transparent;
  cursor: pointer;
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.35s ease,
    background-color 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.45s ease;
}

.link-icon {
  display: inline-flex;
  flex-shrink: 0;
  line-height: 0;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-group.is-expanded .link-icon--chevron :deep(.shell-nav-icon--chevron) {
  transform: rotate(180deg);
}

.link-icon--chevron :deep(.shell-nav-icon--chevron) {
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.group-trigger:hover,
.nav-group:focus-within > .group-trigger,
.nav-group.is-expanded > .group-trigger,
.group-trigger.active {
  color: var(--color-text);
  background-color: color-mix(in srgb, var(--color-accent) 18%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 16%, transparent);
  transform: translateY(-2px) scale(1.015);
}

.group-trigger:hover .link-icon:not(.link-icon--chevron),
.nav-group:focus-within > .group-trigger .link-icon:not(.link-icon--chevron),
.nav-group.is-expanded > .group-trigger .link-icon:not(.link-icon--chevron) {
  transform: translateY(-1px) rotate(-2deg);
}

.group-trigger.active {
  color: #6fad87;
  background-color: rgb(204 229 213 / 42%);
  border-color: rgb(180 210 192 / 55%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 75%),
    0 4px 14px rgb(170 205 185 / 15%);
  animation: shell-nav-group-breath 4s ease-in-out infinite;
}

.group-trigger:active:not(.active) {
  transform: translateY(-1px) scale(0.985);
  transition-duration: 0.12s;
}

:global([data-theme='dark']) .group-trigger.active {
  color: color-mix(in srgb, var(--color-accent) 88%, #b8e6c8);
  background-color: color-mix(in srgb, var(--color-accent) 14%, rgb(30 44 46 / 55%));
  border-color: color-mix(in srgb, var(--color-accent) 28%, transparent);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 8%),
    0 4px 14px rgb(0 0 0 / 18%);
}

.grow-line {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 0;
  height: 2px;
  border-radius: 10px;
  background: linear-gradient(90deg, transparent, rgb(153 210 174 / 70%), transparent);
  transition: width 0.5s ease, left 0.5s ease, opacity 0.35s ease;
  pointer-events: none;
}

.group-trigger:hover .grow-line,
.nav-group.is-expanded .grow-line {
  width: 70%;
  left: 15%;
}

.leaf-glow {
  position: absolute;
  width: 8px;
  height: 8px;
  right: 10px;
  top: 8px;
  border-radius: 100%;
  background: rgb(172 222 186 / 45%);
  filter: blur(3px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.45s ease;
}

.group-trigger.active .leaf-glow {
  opacity: 1;
}

@keyframes shell-nav-group-breath {
  0%,
  100% {
    transform: translateY(-2px) scale(1.015);
  }
  50% {
    transform: translateY(-2px) scale(1.035);
  }
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 60;
  min-width: 15rem;
  margin-top: 0.45rem;
  padding: 0.65rem;
  border-radius: 1.25rem;
  background: color-mix(in srgb, var(--glass-nav-bg) 72%, rgb(248 252 249 / 55%));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid color-mix(in srgb, var(--glass-nav-border) 55%, rgb(220 234 226 / 70%));
  box-shadow: 0 16px 40px rgb(124 148 136 / 12%);
  transform-origin: top left;
}

.dropdown::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -0.55rem;
  height: 0.55rem;
}

:global([data-theme='dark']) .dropdown {
  background: color-mix(in srgb, var(--glass-nav-bg) 88%, rgb(30 44 46 / 65%));
  box-shadow: 0 16px 40px rgb(0 0 0 / 28%);
}

.nav-group-dropdown-enter-active {
  transition:
    opacity 0.46s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-group-dropdown-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.34s ease;
}

.nav-group-dropdown-enter-from,
.nav-group-dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
}

.nav-group-dropdown-enter-active .dropdown-item {
  animation: nav-dropdown-item-in 0.44s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--nav-item-i, 0) * 0.055s + 0.08s);
}

@keyframes nav-dropdown-item-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 0.95rem;
  border-radius: 1rem;
  color: var(--color-text-muted);
  text-decoration: none;
  transition:
    transform 0.35s ease,
    background-color 0.35s ease,
    color 0.35s ease;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
  color: var(--color-text);
  transform: translateX(4px);
}

.dropdown-item:hover .link-icon,
.dropdown-item.active .link-icon {
  transform: translateY(-1px) rotate(-3deg);
}

.dropdown-item .link-icon {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  text-align: left;
}

.meta-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.meta-desc {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  line-height: 1.35;
}

@media (max-width: 720px) {
  .group-trigger {
    padding: 0.52rem 0.72rem;
    font-size: 0.86rem;
    gap: 0.4rem;
  }

  .dropdown {
    left: 50%;
    transform: translateX(-50%);
    transform-origin: top center;
  }

  .nav-group-dropdown-enter-from,
  .nav-group-dropdown-leave-to {
    transform: translateX(-50%) translateY(10px) scale(0.96);
  }

  .nav-group-dropdown-enter-to,
  .nav-group-dropdown-leave-from {
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .group-trigger,
  .group-trigger:hover,
  .group-trigger.active,
  .nav-group.is-expanded > .group-trigger {
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
    transform: none;
    animation: none;
  }

  .group-trigger:hover .link-icon,
  .nav-group.is-expanded > .group-trigger .link-icon:not(.link-icon--chevron) {
    transform: none;
  }

  .nav-group-dropdown-enter-active,
  .nav-group-dropdown-leave-active {
    transition: opacity 0.16s ease;
  }

  .nav-group-dropdown-enter-from,
  .nav-group-dropdown-leave-to {
    transform: none;
  }

  .nav-group-dropdown-enter-active .dropdown-item {
    animation: none;
  }

  .dropdown-item:hover,
  .dropdown-item.active {
    transform: none;
  }

  .dropdown-item:hover .link-icon,
  .dropdown-item.active .link-icon {
    transform: none;
  }
}
</style>
