<template>
  <div class="detail-skel" aria-busy="true" aria-label="加载中">
    <div class="sk-row ui-skeleton sk-back" />
    <div class="card sk-hero">
      <div class="sk-row ui-skeleton sk-title" />
      <div class="sk-row ui-skeleton sk-line" />
      <div class="sk-row ui-skeleton sk-line sk-line--mid" />
      <div class="sk-tags">
        <span class="ui-skeleton sk-pill" />
        <span class="ui-skeleton sk-pill" />
      </div>
    </div>
    <div class="sk-grid">
      <div class="card sk-panel">
        <div class="sk-row ui-skeleton sk-h2" />
        <div class="sk-row ui-skeleton sk-line" />
        <div class="sk-row ui-skeleton sk-line sk-line--short" />
      </div>
      <div class="card sk-panel">
        <div class="sk-row ui-skeleton sk-h2" />
        <div class="sk-row ui-skeleton sk-btn" />
        <div class="sk-row ui-skeleton sk-btn sk-btn--ghost" />
      </div>
    </div>
    <div class="card sk-blocks">
      <div v-for="i in 4" :key="i" class="sk-row ui-skeleton sk-line" :class="{ 'sk-line--short': i % 2 === 0 }" />
    </div>
  </div>
</template>

<style scoped>
.detail-skel {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.sk-row {
  border-radius: var(--radius-sm, 6px);
}

.sk-back {
  width: 6.5rem;
  height: 1rem;
}

.card {
  padding: 1rem 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface, var(--color-bg-base));
  box-shadow: var(--shadow-card);
}

.sk-title {
  width: 68%;
  height: 1.55rem;
  margin-bottom: 0.6rem;
}

.sk-line {
  height: 0.85rem;
  margin-bottom: 0.4rem;
}

.sk-line--mid {
  width: 80%;
}

.sk-line--short {
  width: 50%;
}

.sk-tags {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.55rem;
}

.sk-pill {
  width: 3rem;
  height: 1.45rem;
  border-radius: 999px;
}

.sk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.sk-h2 {
  width: 42%;
  height: 1rem;
  margin-bottom: 0.65rem;
}

.sk-btn {
  width: 100%;
  max-width: 11rem;
  height: 2.35rem;
  border-radius: var(--radius-sm, 6px);
  margin-bottom: 0.45rem;
}

.sk-btn--ghost {
  opacity: 0.85;
}

.sk-blocks {
  min-height: 8rem;
}
</style>
