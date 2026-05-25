<template>
  <div class="tl-skel" aria-busy="true" aria-label="加载中">
    <section v-for="gy in 2" :key="gy" class="tl-year">
      <header class="tl-year-head">
        <div class="ui-skeleton tl-year-pill" />
        <div class="ui-skeleton tl-year-count" />
      </header>
      <div class="tl-items">
        <article v-for="ri in rowsPerYear" :key="`${gy}-${ri}`" class="tl-item">
          <div class="ui-skeleton tl-date" />
          <span class="tl-dot" aria-hidden="true" />
          <div class="tl-card card">
            <div class="ui-skeleton tl-title" />
            <div class="ui-skeleton tl-sum" />
            <div class="ui-skeleton tl-sum tl-sum--short" />
            <div class="tl-tags">
              <span class="ui-skeleton tl-tag" />
              <span class="ui-skeleton tl-tag" />
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    rowsPerYear?: number
  }>(),
  { rowsPerYear: 3 },
)
</script>

<style scoped>
.tl-skel {
  --timeline-date-col: 5.2rem;
  --timeline-dot-col: 1.25rem;
  --timeline-gap: 0.7rem;
  --timeline-dot-offset: 1.22rem;
  --timeline-item-gap: 0.85rem;
}

.tl-year {
  margin-bottom: 1.4rem;
}

.tl-year-head {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 0.55rem;
}

.tl-year-pill {
  width: 4.5rem;
  height: 2rem;
  border-radius: var(--radius-sm, 6px);
}

.tl-year-count {
  width: 7rem;
  height: 1rem;
  margin-left: auto;
  border-radius: var(--radius-sm, 6px);
}

.tl-items {
  position: relative;
}

.tl-item {
  display: grid;
  grid-template-columns: var(--timeline-date-col) var(--timeline-dot-col) minmax(0, 1fr);
  column-gap: var(--timeline-gap);
  align-items: start;
  margin-bottom: var(--timeline-item-gap);
}

.tl-item:last-child {
  margin-bottom: 0;
}

.tl-date {
  margin-top: 0.95rem;
  width: 3.2rem;
  height: 1.1rem;
  border-radius: var(--radius-sm, 6px);
}

.tl-dot {
  margin-top: var(--timeline-dot-offset);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-border) 70%, var(--color-bg-surface));
  justify-self: center;
}

.tl-card {
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface, var(--color-bg-base));
  box-shadow: var(--shadow-card);
}

.tl-title {
  width: 78%;
  height: 1.15rem;
  margin-bottom: 0.5rem;
  border-radius: var(--radius-sm, 6px);
}

.tl-sum {
  height: 0.78rem;
  margin-bottom: 0.35rem;
  border-radius: var(--radius-sm, 6px);
}

.tl-sum--short {
  width: 62%;
}

.tl-tags {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.45rem;
}

.tl-tag {
  width: 2.6rem;
  height: 1.35rem;
  border-radius: 999px;
}
</style>
