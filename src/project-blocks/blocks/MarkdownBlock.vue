<script setup lang="ts">
import DOMPurify from 'dompurify'
import { Marked } from 'marked'
import { computed } from 'vue'

import type { ProjectLayoutBlock } from '@/types/content'
import { rewriteHtmlMediaUrls } from '@/utils/resolvePublicUrl'

const props = defineProps<{ block: ProjectLayoutBlock }>()

const md = new Marked({ gfm: true, breaks: true })

const bodyHtml = computed(() => {
  const raw = props.block.body?.trim()
  if (!raw) return ''
  const parsed = md.parse(raw, { async: false }) as string
  return rewriteHtmlMediaUrls(DOMPurify.sanitize(parsed))
})
</script>

<template>
  <!-- 与 PostDetailView 正文 `.body` 同款阅读区底，不用全局 `.card` 玻璃 -->
  <section class="block-markdown-reading">
    <h2 v-if="block.title" class="title">{{ block.title }}</h2>
    <div v-if="bodyHtml" class="project-md markdown-reading" v-html="bodyHtml" />
  </section>
</template>

<style scoped>
.block-markdown-reading {
  margin-bottom: 0;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-reading-bg, var(--color-bg-surface));
  box-shadow: var(--shadow-card);
}

.title {
  margin: 0 0 0.65rem;
  font-size: 1.15rem;
  color: var(--color-text);
}
</style>
