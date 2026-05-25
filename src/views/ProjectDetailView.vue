<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

import ProjectDetailPageSkeleton from '@/components/ui/ProjectDetailPageSkeleton.vue'
import { restartPageEnter } from '@/composables/usePageEnterAnimation'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'
import ProjectBlockRenderer from '@/project-blocks/ProjectBlockRenderer.vue'
import '@/styles/page-enter-post.css'
import { canAccessProjectPublic, ensureProjectsLoaded, getProjectBySlug } from '@/services/contentRepository'
import type { Project } from '@/types/content'

const route = useRoute()
const { t } = useI18n()

const project = ref<Project | null>(null)
const loading = ref(true)
const loadError = ref(false)
const articleRoot = ref<HTMLElement | null>(null)
const ok = computed(() => {
  const p = project.value
  return p && canAccessProjectPublic(p)
})

async function restartProjectEnterWhenReady() {
  const p = project.value
  if (!p || !canAccessProjectPublic(p) || loadError.value) return
  await nextTick()
  let el = articleRoot.value
  if (!el) {
    await nextTick()
    el = articleRoot.value
  }
  if (!el) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    el = articleRoot.value
  }
  if (el) restartPageEnter(el)
}

watch(
  () => route.params.slug as string,
  async (slug) => {
    loading.value = true
    loadError.value = false
    try {
      await ensureProjectsLoaded()
      project.value = getProjectBySlug(slug) ?? null
    } catch {
      loadError.value = true
      project.value = null
    } finally {
      loading.value = false
      await restartProjectEnterWhenReady()
    }
  },
  { immediate: true },
)

function formatDateYmd(input?: string): string {
  if (!input) return t('projects.unknownDate')
  const d = new Date(`${input}T00:00:00`)
  if (Number.isNaN(d.getTime())) return input
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

const periodText = computed(() => {
  const p = project.value
  if (!p) return t('projects.unknownDate')
  const start = formatDateYmd(p.start_date)
  const end = p.end_date ? formatDateYmd(p.end_date) : t('projects.inProgress')
  return `${start} - ${end}`
})

useSeoMeta(() => {
  const path = route.path
  const p = project.value
  if (loadError.value) {
    return {
      title: `${t('projects.title')} | ${SITE_NAME}`,
      description: t('common.notFound'),
      path,
      type: 'website' as const,
      robots: 'noindex, nofollow',
    }
  }
  if (p && canAccessProjectPublic(p)) {
    return {
      title: `${p.title} | ${SITE_NAME}`,
      description: p.summary || t('projects.title'),
      path,
      type: 'article' as const,
      publishedTime: p.start_date,
      modifiedTime: p.end_date ?? p.start_date,
    }
  }
  if (p && !canAccessProjectPublic(p)) {
    return {
      title: `${t('common.notFound')} | ${SITE_NAME}`,
      description: t('common.notFound'),
      path,
      type: 'website' as const,
      robots: 'noindex, nofollow',
    }
  }
  return {
    title: `${t('projects.title')} | ${SITE_NAME}`,
    description: `${t('projects.title')} — ${t('home.tagline')}`,
    path,
    type: 'website' as const,
  }
})
</script>

<template>
  <article v-if="loadError">
    <p class="empty">加载失败，请确认后端已启动并已导入项目数据。</p>
  </article>
  <ProjectDetailPageSkeleton v-else-if="loading" />
  <article v-else-if="ok && project" ref="articleRoot" class="project-detail">
    <p class="back">
      <RouterLink to="/projects">← {{ t('common.back') }}</RouterLink>
    </p>

    <header class="hero card">
      <div class="head">
        <h1 class="title">{{ project.title }}</h1>
        <span v-if="project.status === 'archived'" class="badge">{{ t('projects.archived') }}</span>
      </div>
      <p class="summary">{{ project.summary }}</p>
      <div class="tags">
        <span v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </header>

    <div class="detail-grid">
      <div class="top-panels">
        <section class="card facts">
          <h2 class="card-title">{{ t('projects.factsTitle') }}</h2>
          <dl class="meta">
            <dt>{{ t('projects.factsPeriod') }}</dt>
            <dd>{{ periodText }}</dd>
            <dt>{{ t('projects.factsStatus') }}</dt>
            <dd>{{ project.status === 'archived' ? t('projects.archived') : t('projects.active') }}</dd>
          </dl>
        </section>

        <section class="card actions-card">
          <h2 class="card-title">{{ t('projects.actionsTitle') }}</h2>
          <div class="actions">
            <a
              v-if="project.github_url"
              class="action-btn"
              :href="project.github_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ t('projects.openGithub') }}
            </a>
            <span v-else class="action-btn action-btn--disabled">{{ t('projects.githubMissing') }}</span>
            <RouterLink class="action-btn" :to="`/projects/${project.slug}/notes`">
              {{ t('projects.notes') }}
            </RouterLink>
          </div>
        </section>
      </div>

      <section class="main-content">
        <!-- <section class="card content-head">
          <h2 class="content-title">{{ t('projects.contentTitle') }}</h2>
        </section> -->
        <div class="blocks">
          <ProjectBlockRenderer v-for="(block, i) in project.layout" :key="i" :block="block" />
        </div>
      </section>
    </div>
  </article>
  <p v-else class="empty">{{ t('common.notFound') }}</p>
</template>

<style scoped>
.project-detail {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.back {
  margin: 0;
}

.hero {
  padding: 1rem 1.15rem;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.summary {
  margin: 0.45rem 0 0;
  color: var(--color-text-muted);
}

.tags {
  margin: 0.75rem 0 0;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.top-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.55fr);
  gap: 0.85rem;
  align-items: stretch;
}

.card-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.facts {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.95rem 1rem;
}

.meta {
  margin: 0;
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: 0.55rem 0.8rem;
  font-size: 0.9rem;
}

.meta dt {
  color: var(--color-text-muted);
}

.meta dd {
  margin: 0;
}

.actions-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.95rem 1rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 36%, var(--color-border));
  background: color-mix(in srgb, var(--color-bg-surface) 84%, transparent);
  color: var(--color-accent);
  text-decoration: none;
  font-size: 0.88rem;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.action-btn:hover {
  border-color: color-mix(in srgb, var(--color-accent) 56%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 16%, var(--color-bg-surface));
  transform: translateY(-1px);
}

.action-btn--disabled {
  color: var(--color-text-muted);
  border-color: var(--color-border);
  background: color-mix(in srgb, var(--color-bg-surface) 78%, transparent);
  cursor: not-allowed;
}

.main-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.content-head {
  padding: 0.85rem 1rem;
}

.content-title {
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text-muted);
}

.blocks {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 0;
}

.empty {
  color: var(--color-text-muted);
}

@media (max-width: 920px) {
  .top-panels {
    grid-template-columns: 1fr;
  }
}
</style>
