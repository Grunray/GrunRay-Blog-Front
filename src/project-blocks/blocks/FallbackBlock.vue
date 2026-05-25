<script setup lang="ts">
import type { ProjectLayoutBlock } from '@/types/content'

defineProps<{ block: ProjectLayoutBlock & { type: string } }>()
</script>

<template>
  <section class="block card warn">
    <p class="msg">未注册的展示块类型：<strong>{{ block.type }}</strong></p>
    <p class="hint">在 <code>src/project-blocks/registry.ts</code> 中注册对应组件即可扩展。</p>
    <pre v-if="block.body" class="prose">{{ block.body }}</pre>
  </section>
</template>

<style scoped>
.block {
  margin-bottom: 0;
  padding: 0.95rem 1rem;
}
.warn {
  border-color: var(--color-accent);
}
.msg {
  margin: 0 0 0.5rem;
}
.hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
pre {
  margin-top: 0.75rem;
}
</style>
