<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { MessageProvider } from '@/content/data/mockMessages'

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt: string
    fallbackLetter: string
    provider?: MessageProvider | null
    size?: 'md' | 'sm'
    fallbackHue?: number
  }>(),
  {
    size: 'md',
    fallbackHue: 200,
  },
)

const { t } = useI18n()

const sizePx = computed(() => (props.size === 'sm' ? 28 : 32))

const providerTitle = computed(() => {
  if (props.provider === 'github') return t('messages.providerGithub')
  if (props.provider === 'google') return t('messages.providerGoogle')
  return ''
})

function fallbackStyle() {
  const hue = props.fallbackHue ?? 200
  return {
    background: `linear-gradient(135deg, hsl(${hue} 72% 62%) 0%, hsl(${(hue + 48) % 360} 68% 48%) 100%)`,
  }
}
</script>

<template>
  <div class="msg-avatar" :class="`msg-avatar--${size}`">
    <img
      v-if="src"
      class="msg-avatar-img"
      :src="src"
      :alt="alt"
      :width="sizePx"
      :height="sizePx"
      loading="lazy"
    />
    <span
      v-else
      class="msg-avatar-img msg-avatar-img--fallback"
      :style="fallbackStyle()"
      aria-hidden="true"
    >{{ fallbackLetter.slice(0, 1) }}</span>

    <span
      v-if="provider"
      class="msg-avatar-provider"
      :class="`msg-avatar-provider--${provider}`"
      :title="providerTitle"
      :aria-label="providerTitle"
    >
      <svg
        v-if="provider === 'github'"
        class="msg-avatar-provider-icon"
        viewBox="0 0 24 24"
        width="10"
        height="10"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
      <svg
        v-else
        class="msg-avatar-provider-icon msg-avatar-provider-icon--google"
        viewBox="0 0 24 24"
        width="10"
        height="10"
        aria-hidden="true"
      >
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    </span>
  </div>
</template>

<style scoped>
.msg-avatar {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  line-height: 0;
}

.msg-avatar-img {
  display: block;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 1px 6px color-mix(in srgb, #000 14%, transparent);
}

.msg-avatar--md .msg-avatar-img {
  width: 2rem;
  height: 2rem;
}

.msg-avatar--sm .msg-avatar-img {
  width: 1.75rem;
  height: 1.75rem;
}

.msg-avatar-img--fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
}

.msg-avatar--md .msg-avatar-img--fallback {
  font-size: 0.82rem;
}

.msg-avatar--sm .msg-avatar-img--fallback {
  font-size: 0.75rem;
}

/* 参考 innei：头像右下角登录来源角标 */
.msg-avatar-provider {
  position: absolute;
  right: -0.38rem;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: var(--color-bg-base);
  border: 1.5px solid var(--glass-card-border);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-bg-base) 80%, transparent);
  color: var(--color-text);
  overflow: hidden;
}

.msg-avatar-provider--github {
  color: #24292f;
  background: color-mix(in srgb, var(--color-bg-base) 92%, #f6f8fa);
}

.msg-avatar-provider--google {
  background: var(--color-bg-base);
}

.msg-avatar-provider-icon {
  display: block;
}

.msg-avatar-provider-icon--google {
  transform: scale(1.05);
}
</style>
