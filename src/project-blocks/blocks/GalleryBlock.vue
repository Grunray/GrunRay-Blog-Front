<script setup lang="ts">
import type { ProjectLayoutBlock } from '@/types/content'
import { resolvePublicUrl } from '@/utils/resolvePublicUrl'

defineProps<{ block: ProjectLayoutBlock }>()

function gallerySrc(src: string): string {
  return resolvePublicUrl(src)
}
</script>

<template>
  <section class="block card">
    <h2 v-if="block.title" class="title">{{ block.title }}</h2>
    <div v-if="block.images?.length" class="grid">
      <figure v-for="(src, i) in block.images" :key="i" class="fig">
        <img :src="gallerySrc(src)" :alt="`${block.title ?? 'gallery'} ${i + 1}`" loading="lazy" />
      </figure>
    </div>
  </section>
</template>

<style scoped>
.block {
  margin-bottom: 0;
  padding: 0.95rem 1rem;
}
.title {
  margin: 0 0 0.75rem;
  font-size: 1.15rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(360px, 100%), 1fr));
  gap: 0.75rem;
}
.fig {
  margin: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
}
img {
  display: block;
  width: 100%;
  height: auto;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  }
}
</style>
