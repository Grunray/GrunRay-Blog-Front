<script setup lang="ts">
import type { ProjectLayoutBlock } from '@/types/content'

defineProps<{ block: ProjectLayoutBlock }>()
</script>

<template>
  <section class="block card">
    <h2 v-if="block.title" class="title">{{ block.title }}</h2>
    <div v-if="block.body" class="prose">{{ block.body }}</div>
  </section>
</template>

<style scoped>
.block {
  margin-bottom: 0;
  padding: 0.95rem 1rem;
}
.title {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  color: var(--color-text);
}
</style>
