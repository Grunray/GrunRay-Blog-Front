<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import type { AdminGuestMessage, GuestMessage } from '@/content/data/mockMessages'
import { playPageEnter } from '@/composables/usePageEnterAnimation'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'
import {
  createMessage,
  createOwnerReply,
  fetchAdminMessages,
  fetchMessageCaptcha,
  fetchMessages,
  moderateMessage,
} from '@/services/messageApi'
import {
  fetchMessageAuthProviders,
  fetchMessageAuthUser,
  logoutMessageAuth,
  startMessageOAuth,
  type MessageAuthProviders,
  type MessageAuthUser,
} from '@/services/messageAuth'
import MessageAvatarWithProvider from '@/components/message/MessageAvatarWithProvider.vue'
import '@/styles/page-enter-message.css'

const MESSAGE_MAX_LEN = 500

type SortOrder = 'newest' | 'oldest'
type FeedTab = 'public' | 'pending'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

useSeoMeta(() => ({
  title: `${t('messages.title')} | ${SITE_NAME}`,
  description: t('messages.seoDescription'),
  path: route.path,
  type: 'website',
}))

const pageRoot = ref<HTMLElement | null>(null)
const enterPlayed = ref(false)

const messages = ref<GuestMessage[]>([])
const messagesLoading = ref(true)
const messagesTotal = ref(0)
const authUser = ref<MessageAuthUser | null>(null)
const authProviders = ref<MessageAuthProviders>({ github: false, google: false })
const authLoading = ref(true)
const sortOrder = ref<SortOrder>('newest')
const feedTab = ref<FeedTab>('public')
const adminMessages = ref<AdminGuestMessage[]>([])
const adminTotal = ref(0)
const adminLoading = ref(false)
const openReplyId = ref<string | null>(null)
const replyDrafts = ref<Record<string, string>>({})
const replySubmittingId = ref<string | null>(null)
const moderationBusyId = ref<string | null>(null)

const isSiteOwner = computed(() => Boolean(authUser.value?.isSiteOwner))

const content = ref('')
const captchaId = ref('')
const captchaQuestion = ref('')
const captchaAnswer = ref('')
const captchaLoading = ref(false)
const submitting = ref(false)
const submitToast = ref<string | null>(null)
let submitToastTimer: ReturnType<typeof window.setTimeout> | null = null

const contentLength = computed(() => content.value.length)

const socialProviders = computed(() => [
  { id: 'github' as const, label: 'GitHub', enabled: authProviders.value.github },
  { id: 'google' as const, label: 'Google', enabled: authProviders.value.google },
])

function formatMessageTime(iso: string): string {
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

function showSubmitToast(text: string) {
  submitToast.value = text
  if (submitToastTimer !== null) window.clearTimeout(submitToastTimer)
  submitToastTimer = window.setTimeout(() => {
    submitToast.value = null
    submitToastTimer = null
  }, 2800)
}

async function loadMessages() {
  messagesLoading.value = true
  try {
    const data = await fetchMessages({ sort: sortOrder.value, page: 1, size: 50 })
    messages.value = data.items
    messagesTotal.value = data.total
  } catch {
    messages.value = []
    messagesTotal.value = 0
    showSubmitToast(t('messages.loadError'))
  } finally {
    messagesLoading.value = false
  }
}

async function loadAdminMessages() {
  adminLoading.value = true
  try {
    const data = await fetchAdminMessages({
      status: 'pending',
      sort: sortOrder.value,
      page: 1,
      size: 50,
    })
    adminMessages.value = data.items
    adminTotal.value = data.total
  } catch {
    adminMessages.value = []
    adminTotal.value = 0
    showSubmitToast(t('messages.adminLoadError'))
  } finally {
    adminLoading.value = false
  }
}

async function loadActiveFeed() {
  if (feedTab.value === 'pending' && isSiteOwner.value) {
    await loadAdminMessages()
  } else {
    await loadMessages()
  }
}

function toggleReplyForm(msgId: string) {
  openReplyId.value = openReplyId.value === msgId ? null : msgId
  if (openReplyId.value && !(msgId in replyDrafts.value)) {
    replyDrafts.value = { ...replyDrafts.value, [msgId]: '' }
  }
}

async function onSubmitOwnerReply(msg: GuestMessage) {
  const text = (replyDrafts.value[msg.id] || '').trim()
  if (!text) {
    showSubmitToast(t('messages.contentRequired'))
    return
  }
  replySubmittingId.value = msg.id
  try {
    const updated = await createOwnerReply(msg.id, { content: text })
    const idx = messages.value.findIndex((m) => m.id === msg.id)
    if (idx >= 0) messages.value[idx] = updated
    openReplyId.value = null
    const next = { ...replyDrafts.value }
    delete next[msg.id]
    replyDrafts.value = next
    showSubmitToast(t('messages.replySuccess'))
  } catch (e) {
    const err = e as Error & { status?: number }
    if (err.status === 409) {
      showSubmitToast(t('messages.replyExists'))
    } else if (err.status === 429) {
      showSubmitToast(t('messages.rateLimited'))
    } else {
      showSubmitToast(err.message || t('messages.replyFailed'))
    }
  } finally {
    replySubmittingId.value = null
  }
}

async function onModerate(msg: AdminGuestMessage, action: 'approve' | 'reject') {
  moderationBusyId.value = msg.id
  try {
    await moderateMessage(msg.id, action)
    adminMessages.value = adminMessages.value.filter((m) => m.id !== msg.id)
    adminTotal.value = Math.max(0, adminTotal.value - 1)
    if (action === 'approve') {
      await loadMessages()
    }
    showSubmitToast(
      action === 'approve' ? t('messages.moderationApproved') : t('messages.moderationRejected'),
    )
  } catch (e) {
    const err = e as Error & { status?: number }
    showSubmitToast(err.message || t('messages.moderationFailed'))
  } finally {
    moderationBusyId.value = null
  }
}

async function refreshCaptcha() {
  captchaLoading.value = true
  try {
    const c = await fetchMessageCaptcha()
    captchaId.value = c.captchaId
    captchaQuestion.value = c.question
    captchaAnswer.value = ''
  } catch {
    captchaId.value = ''
    captchaQuestion.value = ''
    showSubmitToast(t('messages.captchaInvalid'))
  } finally {
    captchaLoading.value = false
  }
}

async function loadAuthState() {
  authLoading.value = true
  try {
    authProviders.value = await fetchMessageAuthProviders()
    authUser.value = await fetchMessageAuthUser()
    if (authUser.value) {
      await refreshCaptcha()
      if (authUser.value.isSiteOwner) {
        try {
          const pending = await fetchAdminMessages({ status: 'pending', page: 1, size: 1 })
          adminTotal.value = pending.total
        } catch {
          adminTotal.value = 0
        }
      }
    }
  } catch {
    authProviders.value = { github: false, google: false }
    authUser.value = null
  } finally {
    authLoading.value = false
  }
}

function onSocialLogin(provider: 'github' | 'google') {
  const row = socialProviders.value.find((p) => p.id === provider)
  if (!row?.enabled) {
    showSubmitToast(t('messages.socialNotConfigured'))
    return
  }
  startMessageOAuth(provider, route.fullPath)
}

async function onLogout() {
  try {
    await logoutMessageAuth()
    authUser.value = null
    content.value = ''
    captchaId.value = ''
    captchaQuestion.value = ''
    captchaAnswer.value = ''
  } catch {
    showSubmitToast(t('messages.socialLoginFailed'))
  }
}

function clearAuthQuery() {
  const q = { ...route.query }
  let changed = false
  for (const key of ['auth', 'auth_error']) {
    if (key in q) {
      delete q[key]
      changed = true
    }
  }
  if (changed) void router.replace({ path: route.path, query: q })
}

async function handleAuthCallbackQuery() {
  if (route.query.auth === 'success') {
    await loadAuthState()
    showSubmitToast(t('messages.socialLoginSuccess'))
    clearAuthQuery()
    return
  }
  const err = route.query.auth_error
  if (typeof err === 'string' && err) {
    showSubmitToast(t('messages.socialLoginFailed'))
    clearAuthQuery()
  }
}

async function onSubmit() {
  if (!authUser.value) {
    showSubmitToast(t('messages.loginRequired'))
    return
  }
  const text = content.value.trim()
  if (!text) {
    showSubmitToast(t('messages.contentRequired'))
    return
  }
  if (!captchaId.value || !captchaAnswer.value.trim()) {
    showSubmitToast(t('messages.captchaRequired'))
    return
  }

  submitting.value = true
  try {
    const created = await createMessage({
      content: text,
      captchaId: captchaId.value,
      captchaAnswer: captchaAnswer.value.trim(),
    })
    content.value = ''
    if (created) {
      if (sortOrder.value === 'newest') {
        messages.value = [created, ...messages.value]
        messagesTotal.value += 1
      } else {
        await loadMessages()
      }
      showSubmitToast(t('messages.submitSuccess'))
    } else {
      showSubmitToast(t('messages.submitPending'))
    }
    await refreshCaptcha()
  } catch (e) {
    const err = e as Error & { status?: number }
    const msg = err.message || t('messages.formIncomplete')
    showSubmitToast(err.status === 429 ? t('messages.rateLimited') : msg)
    await refreshCaptcha()
  } finally {
    submitting.value = false
  }
}

watch(sortOrder, () => {
  void loadActiveFeed()
})

watch(feedTab, () => {
  void loadActiveFeed()
})

onMounted(async () => {
  await handleAuthCallbackQuery()
  await loadActiveFeed()
  if (!enterPlayed.value) {
    enterPlayed.value = true
    await playPageEnter(pageRoot.value)
  }
  if (route.query.auth !== 'success') {
    await loadAuthState()
  } else if (authUser.value) {
    await refreshCaptcha()
  }
})
</script>

<template>
  <section ref="pageRoot" class="message-page">
    <header class="message-hero">
      <p class="message-hero-eyebrow">{{ t('messages.eyebrow') }}</p>
      <h1 class="message-hero-title">{{ t('messages.title') }}</h1>
      <p class="message-hero-sub">{{ t('messages.subtitle') }}</p>
    </header>

    <blockquote class="message-welcome card card-glass-dense">
      <p class="message-welcome-line">{{ t('messages.welcomeText') }}</p>
    </blockquote>

    <section class="message-compose-wrap" aria-labelledby="message-compose-heading">
      <h2 id="message-compose-heading" class="visually-hidden">{{ t('messages.composeTitle') }}</h2>

      <!-- 未登录：参考站居中登录区 -->
      <div
        v-if="!authUser"
        class="message-auth-field card"
        role="region"
        :aria-label="t('messages.socialLabel')"
      >
        <p class="message-auth-field-title">{{ t('messages.socialLabel') }}</p>
        <p class="message-auth-field-hint">{{ t('messages.loginRequired') }}</p>
        <div class="message-social" role="group" :aria-label="t('messages.socialLabel')">
          <button
            v-for="p in socialProviders"
            :key="p.id"
            type="button"
            class="message-social-btn"
            :class="[`message-social-btn--${p.id}`, { 'is-disabled': !p.enabled || authLoading }]"
            :disabled="authLoading"
            :title="p.enabled ? (p.id === 'github' ? t('messages.socialGithub') : t('messages.socialGoogle')) : t('messages.socialNotConfigured')"
            @click="onSocialLogin(p.id)"
          >
            <span class="message-social-btn-icon" aria-hidden="true">
              <svg v-if="p.id === 'github'" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </span>
            <span class="message-social-btn-label">{{ p.label }}</span>
          </button>
        </div>
      </div>

      <!-- 已登录：同容器样式 + 留言框 -->
      <form v-else class="message-compose-form card" @submit.prevent="onSubmit">
        <div class="message-compose-user">
          <MessageAvatarWithProvider
            :src="authUser.avatar_url"
            :alt="authUser.name"
            :fallback-letter="authUser.name"
            :provider="authUser.provider"
            size="md"
          />
          <span class="message-compose-user-name">{{ authUser.name }}</span>
          <button type="button" class="message-compose-logout" @click="onLogout">
            {{ t('messages.socialLogout') }}
          </button>
        </div>
        <label class="message-compose-textarea-wrap">
          <span class="visually-hidden">{{ t('messages.fieldContent') }}</span>
          <textarea
            v-model="content"
            class="message-compose-textarea"
            name="content"
            rows="4"
            :maxlength="MESSAGE_MAX_LEN"
            :placeholder="t('messages.fieldContentPh')"
          />
          <span class="message-char-count">{{ t('messages.charCount', { current: contentLength, max: MESSAGE_MAX_LEN }) }}</span>
        </label>
        <div class="message-captcha-row">
          <label class="message-captcha-field">
            <span class="message-captcha-label">{{ t('messages.captchaLabel') }}</span>
            <span class="message-captcha-question">{{ captchaQuestion || '…' }}</span>
            <input
              v-model="captchaAnswer"
              type="text"
              inputmode="numeric"
              class="message-captcha-input"
              :placeholder="t('messages.captchaPlaceholder')"
              :disabled="captchaLoading"
              autocomplete="off"
            />
          </label>
          <button
            type="button"
            class="message-captcha-refresh"
            :disabled="captchaLoading"
            @click="refreshCaptcha"
          >
            {{ t('messages.captchaRefresh') }}
          </button>
        </div>
        <div class="message-form-actions">
          <button type="submit" class="btn-accent message-submit" :disabled="submitting || captchaLoading">
            {{ submitting ? t('messages.submitting') : t('messages.submit') }}
          </button>
          <p class="message-content-policy">{{ t('messages.contentPolicy') }}</p>
        </div>
      </form>

      <Transition name="message-toast-fade">
        <p v-if="submitToast" class="message-submit-toast" role="status">{{ submitToast }}</p>
      </Transition>
    </section>

    <section class="message-feed" aria-labelledby="message-feed-heading">
      <div class="message-feed-head">
        <div class="message-feed-head-left">
          <h2 id="message-feed-heading" class="message-feed-title">
            {{ feedTab === 'pending' ? t('messages.adminFeedTitle') : t('messages.feedTitle') }}
          </h2>
          <span class="message-feed-count">
            {{
              feedTab === 'pending'
                ? t('messages.adminFeedCount', { count: adminTotal })
                : t('messages.feedCount', { count: messagesTotal })
            }}
          </span>
        </div>
        <div v-if="isSiteOwner" class="message-feed-tabs" role="tablist" :aria-label="t('messages.feedTabLabel')">
          <button
            type="button"
            role="tab"
            class="message-feed-tab"
            :aria-selected="feedTab === 'public'"
            :class="{ 'is-active': feedTab === 'public' }"
            @click="feedTab = 'public'"
          >
            {{ t('messages.feedTabPublic') }}
          </button>
          <button
            type="button"
            role="tab"
            class="message-feed-tab"
            :aria-selected="feedTab === 'pending'"
            :class="{ 'is-active': feedTab === 'pending' }"
            @click="feedTab = 'pending'"
          >
            {{ t('messages.feedTabPending') }}
            <span v-if="adminTotal > 0 && feedTab !== 'pending'" class="message-feed-tab-badge">{{ adminTotal }}</span>
          </button>
        </div>
        <div class="message-sort" role="radiogroup" :aria-label="t('messages.sortLabel')">
          <button
            type="button"
            class="message-sort-btn"
            role="radio"
            :aria-checked="sortOrder === 'newest'"
            :class="{ 'is-active': sortOrder === 'newest' }"
            @click="sortOrder = 'newest'"
          >
            {{ t('messages.sortNewest') }}
          </button>
          <button
            type="button"
            class="message-sort-btn"
            role="radio"
            :aria-checked="sortOrder === 'oldest'"
            :class="{ 'is-active': sortOrder === 'oldest' }"
            @click="sortOrder = 'oldest'"
          >
            {{ t('messages.sortOldest') }}
          </button>
        </div>
      </div>

      <ul v-if="feedTab === 'pending' && isSiteOwner" class="message-list">
        <li v-if="adminLoading" class="message-list-hint">{{ t('messages.loading') }}…</li>
        <li v-else-if="!adminMessages.length" class="message-list-hint">{{ t('messages.adminEmpty') }}</li>
        <li
          v-for="(msg, index) in adminMessages"
          :key="msg.id"
          class="message-item card card-glass-dense message-item--admin"
          :style="{ '--enter-i': String(index) }"
        >
          <div class="message-item-row">
            <div class="message-item-avatar-col">
              <MessageAvatarWithProvider
                :src="msg.avatarUrl"
                :alt="msg.author"
                :fallback-letter="msg.author"
                :provider="msg.provider"
                :fallback-hue="msg.avatarHue"
                size="md"
              />
            </div>
            <div class="message-item-main">
              <div class="message-item-head">
                <span class="message-item-head-inner">
                  <span class="message-author">{{ msg.author }}</span>
                  <span class="message-pending-badge">{{ t('messages.pendingBadge') }}</span>
                </span>
                <time class="message-time" :datetime="msg.createdAt">{{ formatMessageTime(msg.createdAt) }}</time>
              </div>
              <p class="message-body">{{ msg.content }}</p>
              <div class="message-admin-actions">
                <button
                  type="button"
                  class="message-admin-btn message-admin-btn--approve"
                  :disabled="moderationBusyId === msg.id"
                  @click="onModerate(msg, 'approve')"
                >
                  {{ t('messages.moderationApprove') }}
                </button>
                <button
                  type="button"
                  class="message-admin-btn message-admin-btn--reject"
                  :disabled="moderationBusyId === msg.id"
                  @click="onModerate(msg, 'reject')"
                >
                  {{ t('messages.moderationReject') }}
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <ul v-else class="message-list">
        <li v-if="messagesLoading" class="message-list-hint">{{ t('messages.loading') }}…</li>
        <li
          v-for="(msg, index) in messages"
          :key="msg.id"
          class="message-item card card-glass-dense"
          :style="{ '--enter-i': String(index) }"
        >
          <div class="message-item-row">
            <div class="message-item-avatar-col">
              <MessageAvatarWithProvider
                :src="msg.avatarUrl"
                :alt="msg.author"
                :fallback-letter="msg.author"
                :provider="msg.provider"
                :fallback-hue="msg.avatarHue"
                size="md"
              />
            </div>
            <div class="message-item-main">
              <div class="message-item-head">
                <span class="message-item-head-inner">
                  <a
                    v-if="msg.profileUrl"
                    class="message-author"
                    :href="msg.profileUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >{{ msg.author }}</a>
                  <span v-else class="message-author">{{ msg.author }}</span>
                  <span v-if="msg.isOwner" class="message-owner-badge">{{ t('messages.ownerBadge') }}</span>
                </span>
                <time class="message-time" :datetime="msg.createdAt">{{ formatMessageTime(msg.createdAt) }}</time>
              </div>
              <p class="message-body">{{ msg.content }}</p>

              <div
                v-if="isSiteOwner && !msg.reply"
                class="message-owner-reply-compose"
              >
                <button
                  type="button"
                  class="message-owner-reply-toggle"
                  @click="toggleReplyForm(msg.id)"
                >
                  {{ openReplyId === msg.id ? t('messages.replyCancel') : t('messages.replyToggle') }}
                </button>
                <form
                  v-if="openReplyId === msg.id"
                  class="message-owner-reply-form"
                  @submit.prevent="onSubmitOwnerReply(msg)"
                >
                  <textarea
                    v-model="replyDrafts[msg.id]"
                    class="message-compose-textarea message-owner-reply-textarea"
                    rows="3"
                    :maxlength="MESSAGE_MAX_LEN"
                    :placeholder="t('messages.replyPlaceholder')"
                  />
                  <button
                    type="submit"
                    class="btn-accent message-submit message-owner-reply-submit"
                    :disabled="replySubmittingId === msg.id"
                  >
                    {{ replySubmittingId === msg.id ? t('messages.replySubmitting') : t('messages.replySubmit') }}
                  </button>
                </form>
              </div>

              <div v-if="msg.reply" class="message-reply">
                <div class="message-item-row message-item-row--reply">
                  <div class="message-item-avatar-col">
                    <MessageAvatarWithProvider
                      :src="msg.reply.avatarUrl"
                      :alt="msg.reply.author"
                      :fallback-letter="msg.reply.author"
                      :provider="msg.reply.provider"
                      size="sm"
                      :fallback-hue="42"
                    />
                  </div>
                  <div class="message-item-main">
                    <div class="message-item-head">
                      <span class="message-item-head-inner">
                        <span class="message-author">{{ msg.reply.author }}</span>
                        <span v-if="msg.reply.isOwner" class="message-owner-badge">{{ t('messages.ownerBadge') }}</span>
                      </span>
                      <time
                        v-if="msg.reply.createdAt"
                        class="message-time"
                        :datetime="msg.reply.createdAt"
                      >{{ formatMessageTime(msg.reply.createdAt) }}</time>
                    </div>
                    <p class="message-body message-body--reply">{{ msg.reply.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.message-page {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  padding-bottom: 1rem;
}

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
  font-size: clamp(2rem, 5vw, 2.65rem);
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

.message-welcome,
.message-item.card {
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

.message-compose-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

/* 参考站 field 容器 */
.message-auth-field,
.message-compose-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 150px;
  width: 100%;
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-card-border);
  background: color-mix(in srgb, var(--glass-card-bg) 94%, transparent);
  background-image: linear-gradient(
    165deg,
    color-mix(in srgb, var(--color-accent) 6%, transparent) 0%,
    transparent 48%
  );
  box-shadow:
    0 1px 2px color-mix(in srgb, #000 6%, transparent),
    inset 0 1px 0 color-mix(in srgb, #fff 8%, transparent);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.message-compose-form {
  align-items: stretch;
  min-height: 0;
}

.message-auth-field-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
}

.message-auth-field-hint {
  margin: -0.35rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  text-align: center;
}

.message-social {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.55rem;
}

.message-social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-width: 7.5rem;
  padding: 0.48rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--glass-card-border);
  background: color-mix(in srgb, var(--color-bg-base) 40%, var(--glass-card-bg));
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.message-social-btn:hover:not(:disabled):not(.is-disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-accent) 40%, var(--glass-card-border));
  box-shadow: 0 4px 14px color-mix(in srgb, var(--color-accent) 16%, transparent);
}

.message-social-btn.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.message-social-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.message-compose-user {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
}

.message-compose-user-name {
  font-weight: 600;
  font-size: 0.92rem;
  flex: 1;
  min-width: 0;
}

.message-compose-logout {
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--glass-card-border);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.message-compose-logout:hover {
  color: var(--color-accent);
}

.message-compose-textarea-wrap {
  width: 100%;
}

.message-compose-textarea {
  width: 100%;
  min-height: 5.5rem;
  padding: 0.72rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-card-border);
  background: color-mix(in srgb, var(--color-bg-base) 50%, var(--glass-card-bg));
  color: var(--color-text);
  font: inherit;
  line-height: 1.55;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.message-compose-textarea:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--color-accent) 48%, var(--glass-card-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.message-char-count {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.76rem;
  color: var(--color-text-muted);
  text-align: right;
}

.message-captcha-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.65rem 1rem;
  width: 100%;
}

.message-captcha-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
  min-width: 12rem;
}

.message-captcha-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.message-captcha-question {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.message-captcha-input {
  width: 100%;
  max-width: 8rem;
  padding: 0.5rem 0.65rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-card-border);
  background: color-mix(in srgb, var(--color-bg-base) 50%, var(--glass-card-bg));
  color: var(--color-text);
  font: inherit;
}

.message-captcha-refresh {
  padding: 0.48rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--glass-card-border);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.message-captcha-refresh:hover:not(:disabled) {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 35%, var(--glass-card-border));
}

.message-captcha-refresh:disabled {
  opacity: 0.6;
  cursor: wait;
}

.message-list-hint {
  list-style: none;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 1rem;
}

.message-form-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  width: 100%;
}

/* 外观由全站 .btn-accent 提供，此处仅保留留言页布局 */
.message-submit {
  flex-shrink: 0;
}

.message-content-policy {
  margin: 0;
  flex: 1 1 12rem;
  font-size: 0.78rem;
  line-height: 1.45;
  font-weight: 400;
  color: color-mix(in srgb, var(--color-text-muted) 52%, transparent);
}

.message-submit-toast {
  margin: 0;
  font-size: 0.86rem;
  color: var(--color-accent);
  text-align: center;
}

.message-toast-fade-enter-active,
.message-toast-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.message-toast-fade-enter-from,
.message-toast-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.message-feed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.message-feed-head-left {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.message-feed-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.message-feed-count {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.message-feed-tabs {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
  background: color-mix(in srgb, var(--glass-card-bg) 72%, transparent);
}

.message-feed-tab {
  position: relative;
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.message-feed-tab.is-active {
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
  color: var(--color-accent);
  font-weight: 600;
}

.message-feed-tab-badge {
  margin-left: 0.35rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 35%, transparent);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 700;
}

.message-pending-badge {
  margin-left: 0.35rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: color-mix(in srgb, #c9a227 90%, var(--color-text));
  background: color-mix(in srgb, #c9a227 18%, transparent);
}

.message-admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.65rem;
}

.message-admin-btn {
  padding: 0.38rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--glass-card-border);
  background: transparent;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.message-admin-btn--approve:hover:not(:disabled) {
  border-color: color-mix(in srgb, #3d9a5c 50%, var(--glass-card-border));
  color: #3d9a5c;
}

.message-admin-btn--reject:hover:not(:disabled) {
  border-color: color-mix(in srgb, #c45c5c 50%, var(--glass-card-border));
  color: #c45c5c;
}

.message-admin-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.message-owner-reply-compose {
  margin-top: 0.75rem;
  padding-top: 0.65rem;
  border-top: 1px dashed color-mix(in srgb, var(--color-border) 55%, transparent);
}

.message-owner-reply-toggle {
  padding: 0.28rem 0;
  border: none;
  background: transparent;
  color: var(--color-accent);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.message-owner-reply-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.message-owner-reply-textarea {
  min-height: 4rem;
}

.message-owner-reply-submit {
  align-self: flex-start;
}

.message-sort {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
  background: color-mix(in srgb, var(--glass-card-bg) 72%, transparent);
  backdrop-filter: blur(8px);
}

.message-sort-btn {
  padding: 0.32rem 0.75rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.message-sort-btn.is-active {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  font-weight: 600;
}

.message-sort-btn:hover:not(.is-active) {
  color: var(--color-text);
}

.message-list {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 200px;
}

.message-item.card {
  position: relative;
}

.message-item-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
}

.message-item-row--reply {
  gap: 0.75rem;
}

.message-item-avatar-col {
  flex-shrink: 0;
  width: 2.35rem;
  padding-right: 0.2rem;
}

@media (min-width: 768px) {
  .message-item-avatar-col {
    width: 2.5rem;
  }
}

.message-item-main {
  flex: 1;
  min-width: 0;
}

.message-item-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  margin-bottom: 0.45rem;
}

.message-item-head-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  min-width: 0;
}

.message-author {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--color-text);
  text-decoration: none;
}

a.message-author:hover {
  color: var(--color-accent);
}

.message-owner-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.45rem;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
}

.message-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.message-body {
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text);
}

.message-body--reply {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.message-reply {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px dashed color-mix(in srgb, var(--glass-card-border) 80%, transparent);
}

@media (max-width: 640px) {
  .message-item-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .message-item.card .message-item-avatar-col {
    position: absolute;
    top: 1rem;
    left: 1.25rem;
    z-index: 1;
  }

  .message-item.card > .message-item-row {
    padding-left: 2.5rem;
  }

  .message-item.card .message-item-row--reply {
    padding-left: 2.25rem;
  }

  .message-item.card .message-item-row--reply .message-item-avatar-col {
    top: 0;
    left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .message-social-btn:hover:not(:disabled):not(.is-disabled) {
    transform: none;
  }
}
</style>
