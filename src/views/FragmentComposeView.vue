<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import AppDateTimeField from '@/components/ui/AppDateTimeField.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import FragmentMoodBadge from '@/components/xiqi/FragmentMoodBadge.vue'
import XiqiCard from '@/components/xiqi/XiqiCard.vue'
import { type FragmentMood } from '@/content/data/mockFragments'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'
import {
  saveFragmentImportFile,
  uploadXiqiMedia,
  type FragmentImageRef,
} from '@/services/fragmentsAdminApi'
import { fetchMessageAuthUser } from '@/services/messageAuth'
import { buildMarkdownPreview } from '@/utils/markdownPreview'
import '@/styles/page-xiqi.css'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

useSeoMeta(() => ({
  title: `${t('fragments.compose.title')} | ${SITE_NAME}`,
  description: t('fragments.compose.seoDescription'),
  path: route.path,
  type: 'website',
  robots: 'noindex, nofollow',
}))

const mood = ref<FragmentMood>('daily')
const status = ref<'published' | 'draft'>('draft')
const createdAt = ref(new Date().toISOString().slice(0, 19))
const bodyMarkdown = ref('')
const images = ref<FragmentImageRef[]>([])
const coverIndex = ref(0)
const editorRef = ref<HTMLTextAreaElement | null>(null)
const dragOver = ref(false)
const submitting = ref(false)
const submitMessage = ref('')
const submitError = ref('')
const importCommand = ref('')

const moodOptions: FragmentMood[] = ['rant', 'sketch', 'flash', 'daily']

const previewCover = computed(() => images.value[coverIndex.value] ?? null)

const markdownPreview = computed(() => buildMarkdownPreview(bodyMarkdown.value))

const previewCardHtml = computed(() => markdownPreview.value.summaryHtml)

const previewDetailHtml = computed(() => markdownPreview.value.html)

const markdownIssues = computed(() =>
  markdownPreview.value.issues.map((issue) => ({
    ...issue,
    label: issue.line
      ? t(`fragments.compose.${issue.messageKey}`, { line: issue.line })
      : t(`fragments.compose.${issue.messageKey}`),
  })),
)

const hasMarkdownErrors = computed(() => markdownPreview.value.hasErrors)

const moodSelectOptions = computed(() =>
  moodOptions.map((m) => ({ value: m, label: moodLabel(m) })),
)

const statusSelectOptions = computed(() => [
  { value: 'draft', label: t('fragments.compose.statusDraft') },
  { value: 'published', label: t('fragments.compose.statusPublished') },
])

function moodLabel(m: FragmentMood): string {
  const map: Record<FragmentMood, string> = {
    rant: t('fragments.moodRant'),
    sketch: t('fragments.moodSketch'),
    flash: t('fragments.moodFlash'),
    daily: t('fragments.moodDaily'),
  }
  return map[m]
}

function insertAtCaret(text: string) {
  const el = editorRef.value
  if (!el) {
    bodyMarkdown.value += text
    return
  }
  const start = el.selectionStart ?? bodyMarkdown.value.length
  const end = el.selectionEnd ?? start
  bodyMarkdown.value = bodyMarkdown.value.slice(0, start) + text + bodyMarkdown.value.slice(end)
  const pos = start + text.length
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(pos, pos)
  })
}

async function uploadAndInsert(file: File) {
  const uploaded = await uploadXiqiMedia('fragments', file)
  images.value.push(uploaded)
  if (images.value.length === 1) coverIndex.value = 0
  const alt = uploaded.alt || t('fragments.compose.imageDefaultAlt')
  insertAtCaret(`\n![${alt}](${uploaded.url})\n`)
}

async function onEditorDrop(event: DragEvent) {
  event.preventDefault()
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  try {
    await uploadAndInsert(file)
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : String(e)
  }
}

async function onFilePick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    await uploadAndInsert(file)
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : String(e)
  }
}

function removeImage(index: number) {
  images.value.splice(index, 1)
  if (coverIndex.value >= images.value.length) {
    coverIndex.value = Math.max(0, images.value.length - 1)
  }
}

async function submitFragment() {
  submitError.value = ''
  submitMessage.value = ''
  importCommand.value = ''
  if (!bodyMarkdown.value.trim()) {
    submitError.value = t('fragments.compose.bodyRequired')
    return
  }
  if (hasMarkdownErrors.value) {
    submitError.value = t('fragments.compose.markdownFixRequired')
    return
  }
  submitting.value = true
  try {
    const result = await saveFragmentImportFile({
      mood: mood.value,
      status: status.value,
      createdAt: createdAt.value,
      images: images.value,
      coverIndex: coverIndex.value,
      bodyMarkdown: bodyMarkdown.value,
    })
    submitMessage.value = t('fragments.compose.submitSuccess')
    importCommand.value = result.importCommand
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const user = await fetchMessageAuthUser()
    if (!user?.isSiteOwner) {
      router.replace({ name: 'fragments' })
    }
  } catch {
    router.replace({ name: 'fragments' })
  }
})
</script>

<template>
  <div class="compose-page">
    <header class="compose-head card card-glass-dense">
      <div>
        <p class="compose-eyebrow">{{ t('fragments.compose.eyebrow') }}</p>
        <h1 class="compose-title">{{ t('fragments.compose.title') }}</h1>
        <p class="compose-sub">{{ t('fragments.compose.subtitle') }}</p>
      </div>
      <button type="button" class="btn-accent compose-action-btn" @click="router.push({ name: 'fragments' })">
        <span class="compose-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        {{ t('fragments.compose.back') }}
      </button>
    </header>

    <section class="compose-grid">
      <div class="compose-main">
        <div class="compose-meta card card-overflow-visible">
          <div class="compose-meta-field">
            <span class="compose-meta-label">{{ t('fragments.compose.mood') }}</span>
            <AppSelect
              v-model="mood"
              :options="moodSelectOptions"
              :aria-label="t('fragments.compose.mood')"
              min-width="0"
            />
          </div>
          <div class="compose-meta-field">
            <span class="compose-meta-label">{{ t('fragments.compose.status') }}</span>
            <AppSelect
              v-model="status"
              :options="statusSelectOptions"
              :aria-label="t('fragments.compose.status')"
              min-width="0"
            />
          </div>
          <div class="compose-meta-field">
            <span class="compose-meta-label">{{ t('fragments.compose.createdAt') }}</span>
            <AppDateTimeField
              v-model="createdAt"
              :aria-label="t('fragments.compose.createdAt')"
            />
          </div>
        </div>

        <div class="compose-editor card" :class="{ 'is-dragover': dragOver }">
          <div class="compose-editor-head">
            <span>{{ t('fragments.compose.body') }}</span>
            <label class="btn-accent compose-action-btn compose-upload-label">
              <span class="compose-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v10M8 9l4-4 4 4" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M5 19h14" stroke-linecap="round" />
                </svg>
              </span>
              {{ t('fragments.compose.uploadImage') }}
              <input type="file" accept="image/*" hidden @change="onFilePick" />
            </label>
          </div>
          <textarea
            ref="editorRef"
            v-model="bodyMarkdown"
            class="compose-textarea"
            rows="14"
            :placeholder="t('fragments.compose.bodyPlaceholder')"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop="onEditorDrop"
          />
          <p class="compose-hint">{{ t('fragments.compose.dropHint') }}</p>
        </div>

        <div v-if="images.length" class="compose-images card">
          <h2 class="compose-section-title">{{ t('fragments.compose.attachments') }}</h2>
          <ul class="compose-image-list">
            <li v-for="(img, index) in images" :key="img.url" class="compose-image-item">
              <label class="compose-cover-radio">
                <input v-model="coverIndex" type="radio" :value="index" />
                <img :src="img.url" :alt="img.alt" loading="lazy" />
              </label>
              <input v-model="img.alt" type="text" class="compose-alt-input" :placeholder="t('fragments.compose.altPlaceholder')" />
              <button type="button" class="xiqi-chip" @click="removeImage(index)">{{ t('fragments.compose.removeImage') }}</button>
            </li>
          </ul>
        </div>

        <div class="compose-actions">
          <button
            type="button"
            class="btn-accent compose-action-btn compose-submit-btn"
            :disabled="submitting || hasMarkdownErrors"
            @click="submitFragment"
          >
            {{ submitting ? t('fragments.compose.submitting') : t('fragments.compose.submit') }}
          </button>
          <p v-if="submitMessage" class="compose-success">{{ submitMessage }}</p>
          <p v-if="importCommand" class="compose-cli">
            <code>{{ importCommand }}</code>
          </p>
          <p v-if="submitError" class="compose-error">{{ submitError }}</p>
        </div>
      </div>

      <aside class="compose-preview card">
        <h2 class="compose-section-title">{{ t('fragments.compose.previewTitle') }}</h2>

        <ul v-if="markdownIssues.length" class="compose-md-issues" aria-live="polite">
          <li
            v-for="(issue, index) in markdownIssues"
            :key="`${issue.messageKey}-${issue.line ?? index}`"
            :class="issue.severity === 'error' ? 'compose-md-issue--error' : 'compose-md-issue--warning'"
          >
            {{ issue.label }}
          </li>
        </ul>

        <p class="compose-preview-label">{{ t('fragments.compose.previewCardLabel') }}</p>
        <XiqiCard :accent="mood" :cover-src="previewCover?.url" :cover-alt="previewCover?.alt || ''">
          <template #header>
            <div class="xiqi-card-head">
              <FragmentMoodBadge :mood="mood" />
              <time class="xiqi-card-time">{{ createdAt.replace('T', ' ') }}</time>
            </div>
          </template>
          <div
            v-if="previewCardHtml"
            class="xiqi-card-body compose-card-md"
            v-html="previewCardHtml"
          />
          <p v-else class="xiqi-card-body compose-preview-empty">{{ t('fragments.compose.previewEmpty') }}</p>
        </XiqiCard>

        <p class="compose-preview-label">{{ t('fragments.compose.previewDetailLabel') }}</p>
        <div
          v-if="previewDetailHtml"
          class="compose-detail-md prose body-markdown markdown-reading"
          v-html="previewDetailHtml"
        />
        <p v-else class="compose-preview-empty">{{ t('fragments.compose.previewEmpty') }}</p>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.compose-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem clamp(0.75rem, 2vw, 1.5rem) 2rem;
  max-width: 72rem;
  margin: 0 auto;
}

.compose-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.15rem;
}

.compose-eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.7;
}

.compose-title {
  margin: 0.25rem 0 0;
  font-size: 1.35rem;
}

.compose-sub {
  margin: 0.35rem 0 0;
  opacity: 0.8;
  font-size: 0.92rem;
}

.compose-action-btn {
  gap: 0.45rem;
  flex-shrink: 0;
}

.compose-action-icon {
  display: inline-flex;
  line-height: 0;
}

.compose-upload-label {
  cursor: pointer;
}

.compose-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
  gap: 1rem;
  align-items: start;
}

@media (max-width: 900px) {
  .compose-grid {
    grid-template-columns: 1fr;
  }
}

.compose-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.compose-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem 1rem;
  padding: 0.85rem 1rem;
  overflow: visible;
  position: relative;
  z-index: 12;
}

.compose-editor.card {
  position: relative;
  z-index: 1;
}

@media (max-width: 820px) {
  .compose-meta {
    grid-template-columns: 1fr;
  }
}

.compose-meta-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  overflow: visible;
}

.compose-meta-label {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.compose-meta-field :deep(.select-wrap) {
  width: 100%;
  min-width: 0;
}

.compose-alt-input {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border-radius: 0.35rem;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  background: color-mix(in srgb, var(--surface) 80%, transparent);
  color: inherit;
}

.compose-editor {
  padding: 0.85rem 1rem;
}

.compose-editor.is-dragover {
  outline: 2px dashed color-mix(in srgb, var(--accent) 55%, transparent);
}

.compose-editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.compose-textarea {
  width: 100%;
  min-height: 16rem;
  resize: vertical;
  padding: 0.65rem 0.75rem;
  border-radius: 0.4rem;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  background: color-mix(in srgb, var(--surface) 80%, transparent);
  color: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.88rem;
  line-height: 1.55;
}

.compose-hint {
  margin: 0.45rem 0 0;
  font-size: 0.78rem;
  opacity: 0.65;
}

.compose-section-title {
  margin: 0 0 0.65rem;
  font-size: 0.95rem;
}

.compose-images {
  padding: 0.85rem 1rem;
}

.compose-image-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.compose-image-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.65rem;
  align-items: center;
}

.compose-cover-radio img {
  width: 4.5rem;
  height: 4.5rem;
  object-fit: cover;
  border-radius: 0.35rem;
}

.compose-actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.compose-submit-btn {
  align-self: flex-start;
}

.compose-success {
  margin: 0;
  color: color-mix(in srgb, #3d9a5a 85%, var(--text));
  font-size: 0.88rem;
}

.compose-error {
  margin: 0;
  color: color-mix(in srgb, #c44 85%, var(--text));
  font-size: 0.88rem;
}

.compose-cli {
  margin: 0;
  font-size: 0.82rem;
}

.compose-cli code {
  display: inline-block;
  padding: 0.35rem 0.55rem;
  border-radius: 0.35rem;
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.compose-preview {
  padding: 0.85rem 1rem;
  position: sticky;
  top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.compose-preview-label {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.65;
}

.compose-preview-empty {
  margin: 0;
  font-size: 0.88rem;
  opacity: 0.65;
}

.compose-md-issues {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.compose-md-issue--error,
.compose-md-issue--warning {
  margin: 0;
  padding: 0.4rem 0.55rem;
  border-radius: 0.35rem;
  font-size: 0.8rem;
  line-height: 1.45;
}

.compose-md-issue--error {
  color: color-mix(in srgb, #c44 90%, var(--text));
  background: color-mix(in srgb, #c44 10%, transparent);
  border: 1px solid color-mix(in srgb, #c44 28%, transparent);
}

.compose-md-issue--warning {
  color: color-mix(in srgb, #b8860b 90%, var(--text));
  background: color-mix(in srgb, #b8860b 10%, transparent);
  border: 1px solid color-mix(in srgb, #b8860b 28%, transparent);
}

.compose-card-md {
  white-space: normal;
}

.compose-card-md :deep(p) {
  margin: 0;
}

.compose-card-md :deep(strong),
.compose-card-md :deep(em),
.compose-card-md :deep(code) {
  font-size: inherit;
}

.compose-card-md :deep(code) {
  padding: 0.08em 0.28em;
  border-radius: 0.25rem;
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.compose-detail-md {
  padding: 0.65rem 0.75rem;
  border-radius: 0.45rem;
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  background: color-mix(in srgb, var(--surface) 75%, transparent);
  font-size: 0.92rem;
  max-height: 18rem;
  overflow: auto;
}

.compose-detail-md :deep(img) {
  max-width: 100%;
  border-radius: 0.35rem;
}
</style>
