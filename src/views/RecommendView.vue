<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import RecommendCategoryBadge from '@/components/xiqi/RecommendCategoryBadge.vue'
import RecommendStarRating from '@/components/xiqi/RecommendStarRating.vue'
import XiqiCard from '@/components/xiqi/XiqiCard.vue'
import XiqiPageHero from '@/components/xiqi/XiqiPageHero.vue'
import XiqiSplitLayout from '@/components/xiqi/XiqiSplitLayout.vue'
import { playPageEnter } from '@/composables/usePageEnterAnimation'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'
import {
  fetchRecommendDetail,
  fetchRecommendations,
  type RecommendCategory,
  type RecommendDetail,
  type RecommendItem,
} from '@/services/recommendApi'
import '@/styles/page-enter-xiqi.css'
import '@/styles/page-xiqi.css'

type CategoryFilter = 'all' | RecommendCategory
type SortOrder = 'newest' | 'oldest'

const { t, locale } = useI18n()
const route = useRoute()

useSeoMeta(() => ({
  title: `${t('recommend.title')} | ${SITE_NAME}`,
  description: t('recommend.seoDescription'),
  path: route.path,
  type: 'website',
}))

const pageRoot = ref<InstanceType<typeof XiqiSplitLayout> | null>(null)
const selectedId = ref<string | null>(null)
const detailDisplayId = ref<string | null>(null)
const categoryFilter = ref<CategoryFilter>('all')
const sortOrder = ref<SortOrder>('newest')
const ratingFilter = ref<number | null>(null)
const items = ref<RecommendItem[]>([])
const listLoading = ref(true)
const listError = ref('')
const detail = ref<RecommendDetail | null>(null)
const detailLoading = ref(false)

const categoryOptions = computed<Array<{ id: CategoryFilter; label: string }>>(() => [
  { id: 'all', label: t('recommend.categoryAll') },
  { id: 'software', label: t('recommend.categorySoftware') },
  { id: 'opensource', label: t('recommend.categoryOpensource') },
  { id: 'anime', label: t('recommend.categoryAnime') },
])

const sortOptions = computed<Array<{ id: SortOrder; label: string }>>(() => [
  { id: 'newest', label: t('recommend.sortNewest') },
  { id: 'oldest', label: t('recommend.sortOldest') },
])

const visibleItems = computed(() => items.value)

const displayedItem = computed(
  () => visibleItems.value.find((item) => item.id === detailDisplayId.value) ?? null,
)

const detailTitle = computed(() => displayedItem.value?.title ?? '')

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

function selectItem(id: string) {
  selectedId.value = id
}

async function loadList() {
  listLoading.value = true
  listError.value = ''
  try {
    const result = await fetchRecommendations({
      category: categoryFilter.value,
      rating: ratingFilter.value,
      sort: sortOrder.value,
      size: 50,
    })
    items.value = result.items
  } catch (e) {
    listError.value = e instanceof Error ? e.message : String(e)
    items.value = []
  } finally {
    listLoading.value = false
  }
}

async function loadDetail(id: string) {
  detailLoading.value = true
  try {
    detail.value = await fetchRecommendDetail(id)
  } catch {
    detail.value = null
  } finally {
    detailLoading.value = false
  }
}

watch([categoryFilter, sortOrder, ratingFilter], () => {
  void loadList()
})

watch(selectedId, (id) => {
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

watch(visibleItems, (list) => {
  if (selectedId.value && !list.some((item) => item.id === selectedId.value)) {
    selectedId.value = null
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
  await loadList()
})
</script>

<template>
  <XiqiSplitLayout
    ref="pageRoot"
    v-model:selected-key="selectedId"
    :detail-title="detailTitle"
    @detail-closed="onDetailPanelClosed"
  >
    <XiqiPageHero
      page="recommend"
      :eyebrow="t('recommend.eyebrow')"
      :title="t('recommend.title')"
      :subtitle="t('recommend.subtitle')"
    />

    <blockquote class="xiqi-intro card card-glass-dense">
      <p class="xiqi-intro-line">{{ t('recommend.intro') }}</p>
    </blockquote>

    <div class="xiqi-toolbar-row">
      <div class="xiqi-toolbar card" :aria-label="t('recommend.filterLabel')">
        <p class="xiqi-toolbar-meta">{{ t('recommend.feedCount', { count: visibleItems.length }) }}</p>
        <div class="xiqi-toolbar-actions">
          <div class="xiqi-chip-group" role="group" :aria-label="t('recommend.filterCategory')">
            <button
              v-for="option in categoryOptions"
              :key="option.id"
              type="button"
              class="xiqi-chip"
              :class="{ 'is-active': categoryFilter === option.id }"
              @click="categoryFilter = option.id"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="xiqi-chip-group xiqi-chip-group--stars" role="group" :aria-label="t('recommend.filterRating')">
            <RecommendStarRating
              mode="filter"
              :rating="ratingFilter"
              @update:rating="ratingFilter = $event"
            />
          </div>
          <div class="xiqi-chip-group" role="radiogroup" :aria-label="t('recommend.sortLabel')">
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
    </div>

    <p v-if="listError" class="fragments-empty">{{ listError }}</p>
    <p v-else-if="listLoading" class="fragments-empty">{{ t('fragments.loading') }}</p>
    <TransitionGroup
      v-else-if="visibleItems.length"
      name="xiqi-feed-item"
      tag="ul"
      class="recommend-feed xiqi-feed"
      aria-live="polite"
    >
      <li v-for="(item, index) in visibleItems" :key="item.id">
        <XiqiCard
          interactive
          :accent="item.category"
          :selected="detailDisplayId === item.id"
          :cover-src="item.imageUrl"
          :cover-alt="item.imageAlt || item.title"
          :enter-index="index"
          :aria-expanded="selectedId === item.id"
          @click="selectItem(item.id)"
        >
          <template #header>
            <div class="xiqi-card-head">
              <RecommendCategoryBadge :category="item.category" />
              <time class="xiqi-card-time" :datetime="item.createdAt">{{ formatTime(item.createdAt) }}</time>
            </div>
          </template>
          <h2 class="xiqi-card-title">{{ item.title }}</h2>
          <p class="xiqi-card-body">{{ item.summary }}</p>
          <template #footer>
            <div class="recommend-card-footer">
              <RecommendStarRating mode="display" :rating="item.rating" />
            </div>
          </template>
        </XiqiCard>
      </li>
    </TransitionGroup>
    <p v-else class="fragments-empty">{{ t('recommend.empty') }}</p>

    <template #detail>
      <article v-if="displayedItem" class="recommend-detail">
        <header class="recommend-detail-head">
          <RecommendCategoryBadge :category="displayedItem.category" size="md" />
          <time class="xiqi-card-time" :datetime="displayedItem.createdAt">
            {{ formatTime(displayedItem.createdAt) }}
          </time>
        </header>
        <h2 class="recommend-detail-title">{{ displayedItem.title }}</h2>
        <RecommendStarRating mode="display" :rating="displayedItem.rating" />
        <p v-if="detailLoading" class="recommend-detail-body">{{ t('fragments.loading') }}</p>
        <div
          v-else-if="detail?.bodyHtml"
          class="recommend-detail-body prose body-markdown markdown-reading"
          v-html="detail.bodyHtml"
        />
        <p v-else class="recommend-detail-body">{{ displayedItem.summary }}</p>
        <a
          v-if="displayedItem.url"
          class="btn-accent recommend-detail-link"
          :href="displayedItem.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('recommend.visitLink') }}
        </a>
      </article>
    </template>
  </XiqiSplitLayout>
</template>

<style scoped>
.recommend-detail-body :deep(p) {
  margin: 0 0 0.75rem;
  line-height: 1.65;
}

.recommend-detail-body :deep(p:last-child) {
  margin-bottom: 0;
}

.recommend-detail-body :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm, 0.35rem);
}

.recommend-detail-link {
  display: inline-flex;
  margin-top: 0.5rem;
  text-decoration: none;
}
</style>
