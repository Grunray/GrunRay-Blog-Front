<template>
  <div class="detail-skel" aria-busy="true" aria-label="加载中">
    <div class="sk-row ui-skeleton sk-back" />
    <div class="card sk-lead">
      <div class="sk-row ui-skeleton sk-title" />
      <div class="sk-row ui-skeleton sk-line" />
      <div class="sk-row ui-skeleton sk-line sk-line--short" />
      <div class="sk-tags">
        <span class="ui-skeleton sk-pill" />
        <span class="ui-skeleton sk-pill" />
        <span class="ui-skeleton sk-pill sk-pill--sm" />
      </div>
    </div>
    <div class="card sk-body">
      <div v-for="i in 5" :key="i" class="sk-row ui-skeleton sk-line" :class="{ 'sk-line--short': i % 3 === 0 }" />
    </div>
  </div>
</template>

<style scoped>
.detail-skel {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 52rem;
}

.sk-row {
  border-radius: var(--radius-sm, 6px);
}

.sk-back {
  width: 6.5rem;
  height: 1rem;
}

.sk-lead,
.sk-body {
  padding: 1rem 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface, var(--color-bg-base));
  box-shadow: var(--shadow-card);
}

.sk-title {
  width: 72%;
  height: 1.45rem;
  margin-bottom: 0.65rem;
}

.sk-line {
  height: 0.85rem;
  margin-bottom: 0.45rem;
}

.sk-line--short {
  width: 55%;
}

.sk-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.sk-pill {
  width: 3.2rem;
  height: 1.5rem;
  border-radius: 999px;
}

.sk-pill--sm {
  width: 2.4rem;
}
</style>
