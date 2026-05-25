<script setup lang="ts">
import { EXTERNAL_LINKS } from '@/config/externalLinks'
import { useExternalLinkCopy } from '@/composables/useExternalLinkCopy'

const { copyToastVisible, copyToastColor, handleExternalLinkClick } = useExternalLinkCopy()
</script>

<template>
  <div class="footer-external-links">
    <nav class="footer-external-links-row" aria-label="External links">
      <a
        v-for="item in EXTERNAL_LINKS"
        :key="item.href + item.label"
        class="footer-icon-btn"
        :style="{ '--icon-color': item.color }"
        :href="item.href"
        target="_blank"
        rel="noopener noreferrer"
        @click="handleExternalLinkClick(item, $event)"
      >
        <span class="footer-icon-btn__glass" />
        <svg :viewBox="item.viewBox" class="footer-icon-btn__icon" aria-hidden="true">
          <path :d="item.path" />
        </svg>
        <span class="footer-icon-btn__label">{{ item.label }}</span>
      </a>
    </nav>
    <transition name="footer-copy-toast-fade">
      <div
        v-if="copyToastVisible"
        class="footer-copy-toast"
        :style="{ '--toast-color': copyToastColor }"
      >
        邮箱地址已复制
      </div>
    </transition>
  </div>
</template>

<style scoped>
.footer-external-links {
  position: relative;
  display: flex;
  align-items: center;
}

.footer-external-links-row {
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
}

.footer-icon-btn {
  --icon-color: var(--color-accent);
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  cursor: pointer;
  color: color-mix(in srgb, var(--icon-color) 76%, white);
  text-decoration: none;
  transition: transform 0.25s ease, color 0.25s ease;
}

.footer-icon-btn__glass {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--glass-card-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%) brightness(1.02);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%) brightness(1.02);
  box-shadow:
    inset 0 3px 8px rgb(255 255 255 / 0.38),
    inset 0 -5px 10px rgb(0 0 0 / 0.18),
    var(--shadow-card);
}

.footer-icon-btn__glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(120deg, rgb(255 255 255 / 0.56), transparent 42%);
  opacity: 0.65;
}

.footer-icon-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--icon-color) 36%, white);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.footer-icon-btn__icon {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 55%;
  height: 55%;
}

.footer-icon-btn__icon path {
  fill: currentColor;
  transition: filter 0.25s ease;
}

.footer-icon-btn:hover {
  color: var(--icon-color);
  transform: scale(1.08);
}

.footer-icon-btn:hover::after {
  border-color: var(--icon-color);
  box-shadow: 0 0 10px color-mix(in srgb, var(--icon-color) 70%, white);
}

.footer-icon-btn:hover .footer-icon-btn__icon {
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--icon-color) 78%, white));
}

.footer-icon-btn:active {
  transform: scale(0.95);
}

.footer-icon-btn__label {
  position: absolute;
  bottom: calc(100% + 0.38rem);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  opacity: 0;
  visibility: hidden;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  white-space: nowrap;
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--icon-color);
  border: 1px solid color-mix(in srgb, var(--icon-color) 30%, var(--glass-card-border));
  background: var(--glass-card-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%) brightness(1.02);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%) brightness(1.02);
  box-shadow: var(--shadow-card);
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 20;
  pointer-events: none;
}

.footer-icon-btn:hover .footer-icon-btn__label {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.footer-copy-toast {
  --toast-color: #9b7bff;
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.45rem);
  transform: translateX(-50%);
  width: fit-content;
  border-radius: 999px;
  padding: 0.33rem 0.75rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--toast-color);
  border: 1px solid color-mix(in srgb, var(--toast-color) 36%, var(--glass-card-border));
  background: var(--glass-card-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%) brightness(1.02);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%) brightness(1.02);
  box-shadow: var(--shadow-card);
  white-space: nowrap;
  z-index: 30;
}

.footer-copy-toast-fade-enter-active,
.footer-copy-toast-fade-leave-active {
  transition: all 0.22s ease;
}

.footer-copy-toast-fade-enter-from,
.footer-copy-toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

@media (max-width: 768px) {
  .footer-external-links {
    width: 100%;
    justify-content: center;
  }

  .footer-external-links-row {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
  }
}
</style>
