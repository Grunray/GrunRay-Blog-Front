<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import type { Project } from '@/types/content'

defineProps<{ project: Project }>()

const { t } = useI18n()
</script>

<template>
  <article class="card item">
    <div class="head">
      <h2 class="title">
        <RouterLink :to="`/projects/${project.slug}`">{{ project.title }}</RouterLink>
      </h2>
      <span v-if="project.status === 'archived'" class="badge">{{ t('projects.archived') }}</span>
    </div>
    <p class="summary">{{ project.summary }}</p>
    <div class="tags">
      <span v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <p class="meta">
      <RouterLink :to="`/projects/${project.slug}/notes`">{{ t('projects.notes') }}</RouterLink>
    </p>
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
  font-size: 1.1rem;
}
.summary {
  margin: 0.5rem 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}
.meta {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
}
</style>
