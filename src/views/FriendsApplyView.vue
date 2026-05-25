<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

import { playPageEnter } from '@/composables/usePageEnterAnimation'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { getFriendsApplySiteProfile } from '@/config/friendsSiteProfile'
import { SITE_NAME } from '@/config/site'
import CopyTextButton from '@/components/ui/CopyTextButton.vue'
import {
  fetchFriendCaptcha,
  fetchFriendsSiteProfile,
  submitFriendApplication,
  type FriendsSiteProfile,
} from '@/services/friendsApi'
import { siteFaviconUrl } from '@/utils/siteFavicon'
import '@/styles/page-enter-friends.css'
import '@/styles/page-friends.css'

const SITE_URL_MAX = 512
const NAME_MAX = 64
const DESC_MAX = 200
const EMAIL_MAX = 128
const AVATAR_MAX = 512

const { t } = useI18n()
const route = useRoute()

useSeoMeta(() => ({
  title: `${t('friends.applyTitle')} | ${SITE_NAME}`,
  description: t('friends.applySeoDescription'),
  path: route.path,
  type: 'website',
}))

const pageRoot = ref<HTMLElement | null>(null)
const localProfile = getFriendsApplySiteProfile()
const siteProfile = ref<FriendsSiteProfile>({
  title: localProfile.title,
  url: localProfile.url,
  logo: localProfile.logo,
  description: '',
})

const siteName = ref('')
const siteUrl = ref('')
const avatarUrl = ref('')
const description = ref('')
const contactEmail = ref('')

const submitting = ref(false)
const submitSuccess = ref(false)
const submitSuccessMessage = ref('')
const formError = ref<string | null>(null)

const captchaId = ref('')
const captchaQuestion = ref('')
const captchaAnswer = ref('')
const captchaLoading = ref(false)

const previewAvatar = computed(() => {
  const explicit = avatarUrl.value.trim()
  if (explicit) return explicit
  const url = siteUrl.value.trim()
  if (!url) return ''
  return siteFaviconUrl(url, 128)
})

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validate(): string | null {
  const name = siteName.value.trim()
  const url = siteUrl.value.trim()
  const desc = description.value.trim()
  const email = contactEmail.value.trim()
  const avatar = avatarUrl.value.trim()

  if (!name) return t('friends.applyErrorName')
  if (name.length > NAME_MAX) return t('friends.applyErrorNameLen', { max: NAME_MAX })
  if (!url) return t('friends.applyErrorUrl')
  if (!isValidUrl(url)) return t('friends.applyErrorUrlInvalid')
  if (url.length > SITE_URL_MAX) return t('friends.applyErrorUrlLen', { max: SITE_URL_MAX })
  if (!desc) return t('friends.applyErrorDesc')
  if (desc.length > DESC_MAX) return t('friends.applyErrorDescLen', { max: DESC_MAX })
  if (!email) return t('friends.applyErrorEmail')
  if (!isValidEmail(email)) return t('friends.applyErrorEmailInvalid')
  if (email.length > EMAIL_MAX) return t('friends.applyErrorEmailLen', { max: EMAIL_MAX })
  if (avatar && avatar.length > AVATAR_MAX) return t('friends.applyErrorAvatarLen', { max: AVATAR_MAX })
  if (avatar && !isValidUrl(avatar)) return t('friends.applyErrorAvatarInvalid')
  return null
}

async function refreshCaptcha() {
  captchaLoading.value = true
  try {
    const c = await fetchFriendCaptcha()
    captchaId.value = c.captchaId
    captchaQuestion.value = c.question
    captchaAnswer.value = ''
  } catch {
    captchaId.value = ''
    captchaQuestion.value = ''
    formError.value = t('messages.captchaInvalid')
  } finally {
    captchaLoading.value = false
  }
}

async function onSubmit() {
  formError.value = null
  submitSuccess.value = false
  submitSuccessMessage.value = ''
  const err = validate()
  if (err) {
    formError.value = err
    return
  }
  if (!captchaId.value || !captchaAnswer.value.trim()) {
    formError.value = t('messages.captchaRequired')
    return
  }

  submitting.value = true
  try {
    const message = await submitFriendApplication({
      siteName: siteName.value.trim(),
      siteUrl: siteUrl.value.trim(),
      avatarUrl: avatarUrl.value.trim() || undefined,
      description: description.value.trim(),
      contactEmail: contactEmail.value.trim(),
      captchaId: captchaId.value,
      captchaAnswer: captchaAnswer.value.trim(),
    })
    submitSuccess.value = true
    submitSuccessMessage.value = message || t('friends.applySuccess')
    siteName.value = ''
    siteUrl.value = ''
    avatarUrl.value = ''
    description.value = ''
    contactEmail.value = ''
    await refreshCaptcha()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('friends.applySubmitFailed')
    await refreshCaptcha()
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const profile = await fetchFriendsSiteProfile()
    siteProfile.value = {
      ...profile,
      description: profile.description || t('friends.applyNoticeBio'),
    }
  } catch {
    siteProfile.value.description = t('friends.applyNoticeBio')
  }
  await refreshCaptcha()
  await playPageEnter(pageRoot.value)
})
</script>

<template>
  <section ref="pageRoot" class="friends-apply-page">
    <header class="message-hero">
      <p class="message-hero-eyebrow">{{ t('friends.applyEyebrow') }}</p>
      <h1 class="message-hero-title">{{ t('friends.applyTitle') }}</h1>
      <p class="message-hero-sub">{{ t('friends.applySubtitle') }}</p>
    </header>

    <blockquote class="message-welcome card">
      <p class="message-welcome-line">{{ t('friends.applyIntro') }}</p>
    </blockquote>

    <p class="friends-apply-back">
      <RouterLink to="/friends" class="friends-apply-back-link">{{ t('friends.backToList') }}</RouterLink>
    </p>

    <section class="friends-apply-notice card" aria-labelledby="friends-apply-notice-heading">
      <h2 id="friends-apply-notice-heading" class="friends-apply-notice-title">
        {{ t('friends.applyNoticeTitle') }}
      </h2>
      <p class="friends-apply-notice-lead">{{ t('friends.applyNoticeLead') }}</p>
      <ul class="friends-apply-notice-list">
        <li class="friends-apply-notice-item">
          <p class="friends-apply-notice-label">{{ t('friends.applyNoticeLabelTitle') }}</p>
          <div class="friends-apply-notice-value-row">
            <p class="friends-apply-notice-value">{{ siteProfile.title }}</p>
            <CopyTextButton :text="siteProfile.title" />
          </div>
        </li>
        <li class="friends-apply-notice-item">
          <p class="friends-apply-notice-label">{{ t('friends.applyNoticeLabelUrl') }}</p>
          <div class="friends-apply-notice-value-row">
            <p class="friends-apply-notice-value friends-apply-notice-value--url">{{ siteProfile.url }}</p>
            <CopyTextButton :text="siteProfile.url" />
          </div>
        </li>
        <li class="friends-apply-notice-item">
          <p class="friends-apply-notice-label">{{ t('friends.applyNoticeLabelLogo') }}</p>
          <div class="friends-apply-notice-logo-row">
            <img
              class="friends-apply-notice-logo-preview"
              :src="siteProfile.logo"
              :alt="siteProfile.title"
              width="40"
              height="40"
              loading="lazy"
            />
            <div class="friends-apply-notice-value-row friends-apply-notice-value-row--grow">
              <p class="friends-apply-notice-value friends-apply-notice-value--url">{{ siteProfile.logo }}</p>
              <CopyTextButton :text="siteProfile.logo" />
            </div>
          </div>
        </li>
        <li class="friends-apply-notice-item">
          <p class="friends-apply-notice-label">{{ t('friends.applyNoticeLabelDesc') }}</p>
          <div class="friends-apply-notice-value-row">
            <p class="friends-apply-notice-value">{{ siteProfile.description }}</p>
            <CopyTextButton :text="siteProfile.description" />
          </div>
        </li>
      </ul>
    </section>

    <form class="friends-apply-form card" @submit.prevent="onSubmit">
      <div v-if="previewAvatar" class="friends-apply-preview">
        <img
          class="friends-apply-preview-avatar"
          :src="previewAvatar"
          :alt="siteName || t('friends.applyPreviewAlt')"
          width="48"
          height="48"
          loading="lazy"
        />
        <p class="friends-apply-preview-hint">{{ t('friends.applyAvatarHint') }}</p>
      </div>

      <label class="friends-apply-field">
        <span class="friends-apply-label">{{ t('friends.applyFieldName') }}</span>
        <input
          v-model="siteName"
          type="text"
          name="siteName"
          class="friends-apply-input"
          :maxlength="NAME_MAX"
          :placeholder="t('friends.applyFieldNamePh')"
          autocomplete="organization"
        />
      </label>

      <label class="friends-apply-field">
        <span class="friends-apply-label">{{ t('friends.applyFieldUrl') }}</span>
        <input
          v-model="siteUrl"
          type="url"
          name="siteUrl"
          class="friends-apply-input"
          :maxlength="SITE_URL_MAX"
          :placeholder="t('friends.applyFieldUrlPh')"
          autocomplete="url"
        />
      </label>

      <label class="friends-apply-field">
        <span class="friends-apply-label">{{ t('friends.applyFieldAvatar') }}</span>
        <input
          v-model="avatarUrl"
          type="url"
          name="avatarUrl"
          class="friends-apply-input"
          :maxlength="AVATAR_MAX"
          :placeholder="t('friends.applyFieldAvatarPh')"
        />
      </label>

      <label class="friends-apply-field">
        <span class="friends-apply-label">{{ t('friends.applyFieldDesc') }}</span>
        <textarea
          v-model="description"
          name="description"
          class="friends-apply-textarea"
          rows="3"
          :maxlength="DESC_MAX"
          :placeholder="t('friends.applyFieldDescPh')"
        />
      </label>

      <label class="friends-apply-field">
        <span class="friends-apply-label">{{ t('friends.applyFieldEmail') }}</span>
        <input
          v-model="contactEmail"
          type="email"
          name="contactEmail"
          class="friends-apply-input"
          :maxlength="EMAIL_MAX"
          :placeholder="t('friends.applyFieldEmailPh')"
          autocomplete="email"
        />
      </label>

      <p v-if="formError" class="friends-apply-error" role="alert">{{ formError }}</p>
      <div class="friends-apply-captcha-row">
        <label class="friends-apply-captcha-field">
          <span class="friends-apply-captcha-label">{{ t('messages.captchaLabel') }}</span>
          <span class="friends-apply-captcha-question">{{ captchaQuestion || '…' }}</span>
          <input
            v-model="captchaAnswer"
            type="text"
            inputmode="numeric"
            class="friends-apply-captcha-input"
            :placeholder="t('messages.captchaPlaceholder')"
            :disabled="captchaLoading || submitting"
            autocomplete="off"
          />
        </label>
        <button
          type="button"
          class="friends-apply-captcha-refresh"
          :disabled="captchaLoading || submitting"
          @click="refreshCaptcha"
        >
          {{ t('messages.captchaRefresh') }}
        </button>
      </div>

      <p v-if="submitSuccess" class="friends-apply-success" role="status">
        {{ submitSuccessMessage || t('friends.applySuccess') }}
      </p>

      <div class="friends-apply-actions">
        <button type="submit" class="btn-accent" :disabled="submitting || captchaLoading">
          {{ submitting ? t('friends.applySubmitting') : t('friends.applySubmit') }}
        </button>
        <p class="friends-apply-policy">{{ t('friends.applyPolicy') }}</p>
      </div>
    </form>
  </section>
</template>

<style scoped>
.message-hero {
  text-align: center;
  padding: 0.35rem 0 0.15rem;
}

.message-hero-eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.82rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.message-hero-title {
  margin: 0;
  font-size: clamp(1.85rem, 4.5vw, 2.35rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  background: linear-gradient(
    120deg,
    var(--color-text) 0%,
    color-mix(in srgb, var(--color-accent) 72%, var(--color-text)) 55%,
    var(--color-accent) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.message-hero-sub {
  margin: 0.55rem auto 0;
  max-width: 28rem;
  font-size: 0.98rem;
  color: var(--color-text-muted);
  line-height: 1.55;
}

.message-welcome {
  margin: 0;
  padding: 1.15rem 1.25rem;
  border-left: 3px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
}

.message-welcome-line {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--color-text);
}

.friends-apply-back {
  margin: -0.5rem 0 0;
}

.friends-apply-back-link {
  font-size: 0.88rem;
  color: var(--color-accent);
  text-decoration: none;
}

.friends-apply-back-link:hover {
  text-decoration: underline;
}

.friends-apply-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
}

.friends-apply-preview {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--glass-card-border) 80%, transparent);
}

.friends-apply-preview-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid var(--glass-card-border);
}

.friends-apply-preview-hint {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.friends-apply-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.friends-apply-label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text);
}

.friends-apply-input,
.friends-apply-textarea {
  width: 100%;
  padding: 0.62rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-card-border);
  background: color-mix(in srgb, var(--color-bg-base) 35%, var(--glass-card-bg));
  color: var(--color-text);
  font-size: 0.92rem;
  font-family: inherit;
  line-height: 1.45;
  transition: border-color 0.2s ease;
}

.friends-apply-input:focus,
.friends-apply-textarea:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--color-accent) 45%, var(--glass-card-border));
}

.friends-apply-textarea {
  resize: vertical;
  min-height: 4.5rem;
}

.friends-apply-error {
  margin: 0;
  font-size: 0.86rem;
  color: #e85d5d;
}

.friends-apply-success {
  margin: 0;
  font-size: 0.86rem;
  color: color-mix(in srgb, var(--color-accent) 85%, var(--color-text));
}

.friends-apply-actions {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 0.25rem;
}

.friends-apply-policy {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.friends-apply-captcha-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.65rem 0.85rem;
}

.friends-apply-captcha-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 10rem;
}

.friends-apply-captcha-label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text);
}

.friends-apply-captcha-question {
  font-size: 0.95rem;
  font-weight: 650;
  color: var(--color-accent);
}

.friends-apply-captcha-input {
  width: 100%;
  max-width: 8rem;
  padding: 0.55rem 0.7rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-card-border);
  background: color-mix(in srgb, var(--color-bg-base) 35%, var(--glass-card-bg));
  color: var(--color-text);
  font-size: 0.92rem;
}

.friends-apply-captcha-refresh {
  padding: 0.48rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-card-border);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  cursor: pointer;
}

.friends-apply-captcha-refresh:hover:not(:disabled) {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 40%, var(--glass-card-border));
}

.friends-apply-captcha-refresh:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
