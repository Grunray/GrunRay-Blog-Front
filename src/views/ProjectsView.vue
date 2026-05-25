<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import AppSelect from '@/components/ui/AppSelect.vue'
import TimelinePageSkeleton from '@/components/ui/TimelinePageSkeleton.vue'
import { playPageEnter } from '@/composables/usePageEnterAnimation'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'
import { ensureProjectsLoaded, listProjectsPublic } from '@/services/contentRepository'
import '@/styles/page-enter-timeline.css'
import type { Project } from '@/types/content'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

useSeoMeta(() => ({
  title: `${t('projects.title')} | ${SITE_NAME}`,
  description: `${t('projects.title')} — ${t('home.tagline')}`,
  path: route.path,
  type: 'website',
}))
const includeArchived = ref(true)
const tagFilter = ref('')
const loading = ref(true)
const loadError = ref<string | null>(null)
const pageRoot = ref<HTMLElement | null>(null)
const enterPlayed = ref(false)

interface TimelineItem {
  project: Project
  yearLabel: string
  dateLabel: string
  sortTimestamp: number
}

interface TimelineYearGroup {
  year: string
  items: TimelineItem[]
}

function parseDate(value?: string): Date | null {
  if (!value) return null
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatMonthDay(value?: string): string {
  const d = parseDate(value)
  if (!d) return t('projects.unknownDate')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

const allTags = computed(() => {
  const set = new Set<string>()
  for (const p of listProjectsPublic({ includeArchived: true })) {
    for (const tag of p.tags) set.add(tag)
  }
  return [...set].sort()
})

const tagSelectOptions = computed(() => [
  { value: '', label: t('projects.allTags') },
  ...allTags.value.map((tag) => ({ value: tag, label: tag })),
])

const timelineItems = computed<TimelineItem[]>(() => {
  let list = listProjectsPublic({ includeArchived: includeArchived.value })
  if (tagFilter.value) list = list.filter((p) => p.tags.includes(tagFilter.value))
  return list
    .map((project) => {
      const d = parseDate(project.start_date)
      const yearFallback = project.year ?? 0
      return {
        project,
        yearLabel: d ? String(d.getFullYear()) : (project.year ? String(project.year) : '----'),
        dateLabel: formatMonthDay(project.start_date),
        sortTimestamp: d ? d.getTime() : yearFallback * 10_000_000,
      }
    })
    .sort((a, b) => {
      if (a.sortTimestamp !== b.sortTimestamp) return b.sortTimestamp - a.sortTimestamp
      return a.project.title.localeCompare(b.project.title)
    })
})

const timelineGroups = computed<TimelineYearGroup[]>(() => {
  const groups: TimelineYearGroup[] = []
  let current: TimelineYearGroup | null = null
  for (const item of timelineItems.value) {
    if (!current || current.year !== item.yearLabel) {
      current = { year: item.yearLabel, items: [] }
      groups.push(current)
    }
    current.items.push(item)
  }
  return groups
})

function timelineItemEnterIndex(groupIndex: number, itemIndex: number): number {
  let sum = 0
  for (let i = 0; i < groupIndex; i++) {
    sum += timelineGroups.value[i]?.items.length ?? 0
  }
  return Math.min(sum + itemIndex, 14)
}

function onCardClick(slug: string) {
  void router.push(`/projects/${slug}`)
}

function onCardKeydown(event: KeyboardEvent, slug: string) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  onCardClick(slug)
}

watch(loading, async (isLoading) => {
  if (enterPlayed.value || isLoading) return
  enterPlayed.value = true
  await playPageEnter(pageRoot.value)
})

onMounted(async () => {
  loading.value = true
  loadError.value = null
  try {
    await ensureProjectsLoaded()
  } catch {
    loadError.value = '加载失败，请确认后端已启动并已导入项目数据。'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section ref="pageRoot" class="projects-page">
    <h1 class="h">{{ t('projects.title') }}</h1>
    <div class="toolbar card">
      <div class="row row-select">
        <span class="lbl lbl--tag">{{ t('projects.filterTags') }}</span>
        <div class="tag-select-wrap">
          <AppSelect
            v-model="tagFilter"
            :options="tagSelectOptions"
            :aria-label="t('projects.filterTags')"
            min-width="0"
          />
        </div>
        <label class="row-toggle">
          <input v-model="includeArchived" class="checkbox" type="checkbox" />
          <span class="row-label">{{ includeArchived ? '显示已归档' : '隐藏已归档' }}</span>
          <span class="toggle-visual" aria-hidden="true">
            <span class="toggle-end toggle-end--left" />
            <span class="toggle-track" />
            <span class="toggle-end toggle-end--right" />
          </span>
        </label>
      </div>
    </div>

    <p v-if="loadError" class="empty">{{ loadError }}</p>
    <TimelinePageSkeleton v-else-if="loading" />
    <div v-else-if="timelineGroups.length" class="timeline">
      <section
        v-for="(group, gi) in timelineGroups"
        :key="group.year"
        class="timeline-year-group"
        :style="{ '--enter-gi': gi }"
      >
        <header class="timeline-year-head">
          <h2 class="timeline-year">{{ group.year }}</h2>
          <p class="timeline-year-count">{{ t('projects.timelineCount', { count: group.items.length }) }}</p>
        </header>
        <div class="timeline-items">
          <article
            v-for="(item, ii) in group.items"
            :key="item.project.id"
            class="timeline-item"
            :style="{ '--enter-ti': timelineItemEnterIndex(gi, ii) }"
          >
            <time class="timeline-date">{{ item.dateLabel }}</time>
            <span class="timeline-dot" aria-hidden="true" />
            <div
              class="timeline-card card timeline-card--clickable"
              role="link"
              tabindex="0"
              @click="onCardClick(item.project.slug)"
              @keydown="onCardKeydown($event, item.project.slug)"
            >
              <div class="timeline-card-head">
                <h3 class="timeline-title">{{ item.project.title }}</h3>
                <span v-if="item.project.status === 'archived'" class="badge">{{ t('projects.archived') }}</span>
              </div>
              <p class="timeline-summary">{{ item.project.summary }}</p>
              <div class="timeline-tags">
                <span v-for="tag in item.project.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
    <p v-else class="empty">{{ t('projects.empty') }}</p>
  </section>
</template>

<style scoped>
.projects-page {
  max-width: 980px;
  --timeline-date-col: 5.2rem;
  --timeline-dot-col: 1.25rem;
  --timeline-gap: 0.7rem;
  --timeline-dot-offset: 1.22rem;
  --timeline-item-gap: 0.85rem;
}

.h {
  margin: 0 0 1rem;
}

.toolbar {
  position: relative;
  z-index: 2;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-surface) 85%, transparent);
  overflow: visible;
}
.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.row-toggle {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.row-label {
  color: var(--color-text);
  font-size: 0.88rem;
}
.checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.toggle-visual {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.toggle-track {
  inline-size: 2.35rem;
  block-size: 2px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 55%, var(--color-border));
  transition: background 0.2s ease;
}
.toggle-end {
  inline-size: 0.62rem;
  block-size: 0.62rem;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--color-accent) 55%, var(--color-border));
  transition: all 0.2s ease;
}
.toggle-end--left {
  background: transparent;
}
.toggle-end--right {
  background: color-mix(in srgb, var(--color-accent) 90%, #19d3ff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 14%, transparent);
}
.checkbox:not(:checked) ~ .toggle-visual .toggle-end--left {
  background: color-mix(in srgb, var(--color-accent) 90%, #19d3ff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 14%, transparent);
}
.checkbox:not(:checked) ~ .toggle-visual .toggle-end--right {
  background: transparent;
  box-shadow: none;
}
.checkbox:not(:checked) ~ .toggle-visual .toggle-track {
  background: color-mix(in srgb, var(--color-border) 88%, transparent);
}
.lbl {
  min-width: 6rem;
}
.lbl--tag {
  min-width: 0;
  width: max-content;
  flex-shrink: 0;
}
.row-select {
  align-items: center;
  overflow: visible;
}
.tag-select-wrap {
  display: inline-block;
  min-width: 240px;
}
.empty {
  color: var(--color-text-muted);
}

.timeline-year-group {
  margin-bottom: 1.4rem;
}

.timeline-year-head {
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  margin-bottom: 0.55rem;
}

.timeline-year {
  margin: 0;
  font-size: 2rem;
  line-height: 1;
}

.timeline-year-count {
  margin: 0;
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: 1rem;
  text-align: right;
}

.timeline-items {
  position: relative;
}

.timeline-item {
  display: grid;
  grid-template-columns: var(--timeline-date-col) var(--timeline-dot-col) minmax(0, 1fr);
  column-gap: var(--timeline-gap);
  align-items: start;
  margin-bottom: var(--timeline-item-gap);
}
.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-date {
  padding-top: 0.95rem;
  font-size: 1.2rem;
  color: var(--color-text-muted);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.timeline-dot {
  position: relative;
  margin-top: var(--timeline-dot-offset);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-accent) 75%, #19d3ff);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.timeline-card {
  padding: 0.85rem 1rem;
}

.timeline-card--clickable {
  cursor: pointer;
}

.timeline-card--clickable:hover {
  border-color: color-mix(in srgb, var(--color-accent) 38%, var(--color-border));
  transform: translateY(-1px);
}

.timeline-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45rem;
}

.timeline-title {
  margin: 0;
  font-size: 1.15rem;
}

.timeline-summary {
  margin: 0.45rem 0 0.55rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.timeline-tags {
  margin-bottom: 0.3rem;
}

@media (max-width: 760px) {
  .projects-page {
    --timeline-date-col: 4.3rem;
    --timeline-dot-col: 1.1rem;
    --timeline-gap: 0.55rem;
  }

  .toolbar {
    padding: 0.8rem 0.85rem;
  }

  .lbl {
    min-width: 5.4rem;
  }

  .tag-select-wrap {
    min-width: 0;
    width: min(100%, 260px);
  }

  .row-select {
    flex-wrap: wrap;
  }

  .row-toggle {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }

  .timeline-item {
    grid-template-columns: var(--timeline-date-col) var(--timeline-dot-col) minmax(0, 1fr);
    column-gap: var(--timeline-gap);
  }

  .timeline-year {
    font-size: 1.65rem;
  }

  .timeline-date {
    font-size: 1rem;
  }
}
</style>
