<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ProjectLayoutBlock } from '@/types/content'

const props = defineProps<{ block: ProjectLayoutBlock }>()
const { t } = useI18n()

const embedHtml = computed(() => {
  const maybe = props.block.meta?.demo_embed_html
  if (typeof maybe !== 'string') return ''
  return maybe.trim()
})

const hasEmbedHtml = computed(() => Boolean(embedHtml.value))
const hasDemoUrl = computed(() => Boolean(props.block.demoUrl))
</script>

<template>
  <section class="block card">
    <h2 v-if="block.title" class="title">{{ block.title }}</h2>
    <p v-if="block.body" class="prose body">{{ block.body }}</p>

    <div class="demo-shell">
      <iframe
        v-if="hasEmbedHtml"
        class="demo-iframe"
        :srcdoc="embedHtml"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        loading="lazy"
        :title="block.title || 'project demo'"
      />
      <iframe
        v-else-if="hasDemoUrl"
        class="demo-iframe"
        :src="block.demoUrl"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        loading="lazy"
        :title="block.title || 'project demo'"
      />
      <div v-else class="demo-placeholder">
        <p class="demo-placeholder-title">
          {{ t('projects.demoEmpty') }}
        </p>
        <p class="demo-placeholder-sub">
          {{ t('projects.demoPlaceholderHint') }}
        </p>
      </div>
    </div>

    <p class="actions">
      <a v-if="hasDemoUrl" :href="block.demoUrl" target="_blank" rel="noreferrer noopener">
        {{ t('projects.openDemo') }}
      </a>
      <span v-else class="action-disabled">{{ t('projects.demoLinkMissing') }}</span>
    </p>
  </section>
</template>

<style scoped>
.block {
  margin-bottom: 0;
  padding: 0.95rem 1rem;
}

.title {
  margin: 0 0 0.4rem;
  font-size: 1.1rem;
}

.body {
  margin: 0;
}

.demo-shell {
  margin-top: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-surface) 82%, transparent);
  min-height: clamp(420px, 65vh, 760px);
  overflow: hidden;
}

.demo-iframe {
  width: 100%;
  min-height: clamp(420px, 65vh, 760px);
  border: none;
  display: block;
  background: #fff;
}

.demo-placeholder {
  min-height: clamp(420px, 65vh, 760px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem;
  text-align: center;
}

.demo-placeholder-title {
  margin: 0;
  font-size: 0.95rem;
}

.demo-placeholder-sub {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.actions {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
}

.action-disabled {
  color: var(--color-text-muted);
}

@media (max-width: 760px) {
  .demo-shell,
  .demo-iframe,
  .demo-placeholder {
    min-height: 360px;
  }
}
</style>
