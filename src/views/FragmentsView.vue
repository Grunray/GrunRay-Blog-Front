<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import FragmentMoodBadge from '@/components/xiqi/FragmentMoodBadge.vue'
import XiqiCard from '@/components/xiqi/XiqiCard.vue'
import XiqiPageHero from '@/components/xiqi/XiqiPageHero.vue'
import XiqiSplitLayout from '@/components/xiqi/XiqiSplitLayout.vue'
import { type FragmentMood } from '@/content/data/mockFragments'
import { playPageEnter } from '@/composables/usePageEnterAnimation'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'
import { fetchFragmentDetail, fetchFragments, type Fragment, type FragmentDetail } from '@/services/fragmentsApi'
import { fetchMessageAuthUser } from '@/services/messageAuth'
import '@/styles/page-enter-xiqi.css'
import '@/styles/page-xiqi.css'
import { rewriteHtmlMediaUrls } from '@/utils/resolvePublicUrl'

type MoodFilter = 'all' | FragmentMood
type SortOrder = 'newest' | 'oldest'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

useSeoMeta(() => ({
  title: `${t('fragments.title')} | ${SITE_NAME}`,
  description: t('fragments.seoDescription'),
  path: route.path,
  type: 'website',
}))

const pageRoot = ref<InstanceType<typeof XiqiSplitLayout> | null>(null)
const selectedFragmentId = ref<string | null>(null)
/** 关闭动画期间仍展示详情，避免 slot 清空导致面板塌陷 */
const detailDisplayId = ref<string | null>(null)
const moodFilter = ref<MoodFilter>('all')
const sortOrder = ref<SortOrder>('newest')
const fragments = ref<Fragment[]>([])
const listLoading = ref(true)
const listError = ref('')
const detail = ref<FragmentDetail | null>(null)
const detailBodyHtml = computed(() => {
  const html = detail.value?.bodyHtml?.trim()
  return html ? rewriteHtmlMediaUrls(html) : ''
})
const detailLoading = ref(false)
const isSiteOwner = ref(false)

const moodOptions = computed<Array<{ id: MoodFilter; label: string }>>(() => [
  { id: 'all', label: t('fragments.moodAll') },
  { id: 'rant', label: t('fragments.moodRant') },
  { id: 'sketch', label: t('fragments.moodSketch') },
  { id: 'flash', label: t('fragments.moodFlash') },
  { id: 'daily', label: t('fragments.moodDaily') },
])

const sortOptions = computed<Array<{ id: SortOrder; label: string }>>(() => [
  { id: 'newest', label: t('fragments.sortNewest') },
  { id: 'oldest', label: t('fragments.sortOldest') },
])

const visibleFragments = computed(() => fragments.value)

const displayedFragment = computed(() =>
  visibleFragments.value.find((item) => item.id === detailDisplayId.value) ?? null,
)

const detailTitle = computed(() =>
  displayedFragment.value ? moodLabel(displayedFragment.value.mood) : '',
)

function moodLabel(mood: FragmentMood): string {
  const map: Record<FragmentMood, string> = {
    rant: t('fragments.moodRant'),
    sketch: t('fragments.moodSketch'),
    flash: t('fragments.moodFlash'),
    daily: t('fragments.moodDaily'),
  }
  return map[mood]
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const loc = locale.value === 'zh' ? 'zh-CN' : 'en-US'
  return d.toLocaleString(loc, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function selectFragment(id: string) {
  selectedFragmentId.value = id
}

async function loadList() {
  listLoading.value = true
  listError.value = ''
  try {
    const result = await fetchFragments({
      mood: moodFilter.value,
      sort: sortOrder.value,
      size: 50,
    })
    fragments.value = result.items
  } catch (e) {
    listError.value = e instanceof Error ? e.message : String(e)
    fragments.value = []
  } finally {
    listLoading.value = false
  }
}

async function loadDetail(id: string) {
  detailLoading.value = true
  try {
    detail.value = await fetchFragmentDetail(id)
  } catch {
    detail.value = null
  } finally {
    detailLoading.value = false
  }
}

function goCompose() {
  router.push({ name: 'fragments-compose' })
}

watch([moodFilter, sortOrder], () => {
  void loadList()
})

watch(selectedFragmentId, (id) => {
  if (id) {
    detailDisplayId.value = id
    detail.value = null
    void loadDetail(id)
  }
})

function onDetailPanelClosed() {
  detailDisplayId.value = null
  detail.value = null
}

watch(visibleFragments, (list) => {
  if (selectedFragmentId.value && !list.some((item) => item.id === selectedFragmentId.value)) {
    selectedFragmentId.value = null
  }
  if (detailDisplayId.value && !list.some((item) => item.id === detailDisplayId.value)) {
    detailDisplayId.value = null
    detail.value = null
  }
})

onMounted(async () => {
  const startEnter = async () => {
    const root = pageRoot.value?.$el
    if (root instanceof HTMLElement) await playPageEnter(root)
  }
  void startEnter()
  try {
    const user = await fetchMessageAuthUser()
    isSiteOwner.value = Boolean(user?.isSiteOwner)
  } catch {
    isSiteOwner.value = false
  }
  await loadList()
})
</script>

<template>
  <XiqiSplitLayout
    ref="pageRoot"
    v-model:selected-key="selectedFragmentId"
    :detail-title="detailTitle"
    @detail-closed="onDetailPanelClosed"
  >
    <XiqiPageHero
      page="fragments"
      :eyebrow="t('fragments.eyebrow')"
      :title="t('fragments.title')"
      :subtitle="t('fragments.subtitle')"
    />

    <blockquote class="xiqi-intro card card-glass-dense">
      <p class="xiqi-intro-line">{{ t('fragments.intro') }}</p>
    </blockquote>

    <div class="xiqi-toolbar-row">
      <div class="xiqi-toolbar card" :aria-label="t('fragments.filterLabel')">
        <p class="xiqi-toolbar-meta">{{ t('fragments.feedCount', { count: visibleFragments.length }) }}</p>
        <div class="xiqi-toolbar-actions">
          <div class="xiqi-chip-group" role="group" :aria-label="t('fragments.filterMood')">
            <button
              v-for="option in moodOptions"
              :key="option.id"
              type="button"
              class="xiqi-chip"
              :class="{ 'is-active': moodFilter === option.id }"
              @click="moodFilter = option.id"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="xiqi-chip-group" role="radiogroup" :aria-label="t('fragments.sortLabel')">
            <button
              v-for="option in sortOptions"
              :key="option.id"
              type="button"
              class="xiqi-chip"
              role="radio"
              :aria-checked="sortOrder === option.id"
              :class="{ 'is-active': sortOrder === option.id }"
              @click="sortOrder = option.id"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <button
        v-if="isSiteOwner"
        type="button"
        class="xiqi-compose-entry card"
        @click="goCompose"
      >
        <p class="xiqi-compose-entry-title">{{ t('fragments.compose.button') }}</p>
        <span class="xiqi-compose-entry-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h12M13 8l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
    </div>

    <p v-if="listError" class="fragments-empty">{{ listError }}</p>
    <p v-else-if="listLoading" class="fragments-empty">{{ t('fragments.loading') }}</p>
    <TransitionGroup
      v-else-if="visibleFragments.length"
      name="xiqi-feed-item"
      tag="ul"
      class="fragments-feed xiqi-feed"
      aria-live="polite"
    >
      <li v-for="(item, index) in visibleFragments" :key="item.id">
        <XiqiCard
          interactive
          :accent="item.mood"
          :selected="detailDisplayId === item.id"
          :cover-src="item.imageUrl"
          :cover-alt="item.imageAlt || ''"
          :enter-index="index"
          :aria-expanded="selectedFragmentId === item.id"
          @click="selectFragment(item.id)"
        >
          <template #header>
            <div class="xiqi-card-head">
              <FragmentMoodBadge :mood="item.mood" />
              <time class="xiqi-card-time" :datetime="item.createdAt">{{ formatTime(item.createdAt) }}</time>
            </div>
          </template>
          <p class="xiqi-card-body">{{ item.content }}</p>
        </XiqiCard>
      </li>
    </TransitionGroup>
    <p v-else class="fragments-empty">{{ t('fragments.empty') }}</p>

    <template #detail>
      <article v-if="displayedFragment" class="fragment-detail">
        <header class="fragment-detail-head">
          <FragmentMoodBadge :mood="displayedFragment.mood" size="md" />
          <time class="xiqi-card-time fragment-time" :datetime="displayedFragment.createdAt">
            {{ formatTime(displayedFragment.createdAt) }}
          </time>
        </header>
        <p v-if="detailLoading" class="fragment-detail-body">{{ t('fragments.loading') }}</p>
        <div
          v-else-if="detailBodyHtml"
          class="fragment-detail-body prose body-markdown markdown-reading"
          v-html="detailBodyHtml"
        />
        <p v-else class="fragment-detail-body">{{ displayedFragment.content }}</p>
      </article>
    </template>
  </XiqiSplitLayout>
</template>

<style scoped>
.fragment-detail-body :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm, 0.35rem);
}
</style>
