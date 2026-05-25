<template>
  <div class="notes-skel" aria-busy="true" aria-label="加载中">
    <div class="sk-row ui-skeleton sk-back" />
    <div class="ui-skeleton sk-h1" />
    <article v-for="i in count" :key="i" class="card sk-card">
      <div class="ui-skeleton sk-title" />
      <div class="ui-skeleton sk-line" />
      <div class="ui-skeleton sk-line sk-line--short" />
      <div class="sk-meta">
        <span class="ui-skeleton sk-pill" />
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  { count: 3 },
)
</script>

<style scoped>
.notes-skel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.sk-row {
  border-radius: var(--radius-sm, 6px);
}

.sk-back {
  width: 8rem;
  height: 1rem;
}

.sk-h1 {
  width: 40%;
  height: 1.5rem;
  border-radius: var(--radius-sm, 6px);
}

.card {
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface, var(--color-bg-base));
  box-shadow: var(--shadow-card);
}

.sk-title {
  width: 70%;
  height: 1.1rem;
  margin-bottom: 0.5rem;
  border-radius: var(--radius-sm, 6px);
}

.sk-line {
  height: 0.78rem;
  margin-bottom: 0.35rem;
  border-radius: var(--radius-sm, 6px);
}

.sk-line--short {
  width: 55%;
}

.sk-meta {
  margin-top: 0.4rem;
}

.sk-pill {
  display: inline-block;
  width: 5rem;
  height: 0.72rem;
  border-radius: var(--radius-sm, 6px);
}
</style>
