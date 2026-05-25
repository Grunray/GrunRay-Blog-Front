<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import { ensureProjectsLoaded, getProjectById } from '@/services/contentRepository'
import type { AlgorithmPost, Post, ProjectNote } from '@/types/content'

const props = defineProps<{ post: Post }>()

const { t } = useI18n()

const projectTitle = computed(() => {
  if (props.post.type !== 'project_note') return null
  return getProjectById((props.post as ProjectNote).project_id)?.title ?? null
})

const postLink = computed(() => `/blog/${props.post.slug}`)

onMounted(() => {
  void ensureProjectsLoaded()
})
</script>

<template>
  <article class="card item">
    <div class="head">
      <h2 class="title">
        <RouterLink :to="postLink">{{ post.title }}</RouterLink>
      </h2>
      <span v-if="post.pinned" class="badge">{{ t('blog.pinned') }}</span>
    </div>
    <p class="summary">{{ post.summary }}</p>
    <p v-if="post.type === 'algorithm' && (post as AlgorithmPost).series" class="meta">
      {{ t('post.series') }}: {{ (post as AlgorithmPost).series }}
    </p>
    <p v-if="post.type === 'project_note' && projectTitle" class="meta">
      {{ t('post.projectNote') }} · {{ projectTitle }}
    </p>
    <div class="tags">
      <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <time v-if="post.published_at" class="time" :datetime="post.published_at">{{
      post.published_at.slice(0, 10)
    }}</time>
  </article>
</template>

<style scoped>
.item {
  margin-bottom: 1rem;
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}
.title {
  margin: 0;
  font-size: 1.05rem;
}
.summary {
  margin: 0.45rem 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
.meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.time {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
