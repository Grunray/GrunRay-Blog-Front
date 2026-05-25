<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

import type { FriendLink, SpecialLink } from '@/content/data/mockFriends'
import { playPageEnter } from '@/composables/usePageEnterAnimation'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'
import { fetchFriendLinks, fetchSpecialLinks } from '@/services/friendsApi'
import SpecialLinkAvatar from '@/components/friends/SpecialLinkAvatar.vue'
import { resolveFriendAvatar, resolveFriendCover } from '@/utils/siteFavicon'
import '@/styles/page-enter-friends.css'
import '@/styles/page-friends.css'

const { t } = useI18n()
const route = useRoute()

useSeoMeta(() => ({
  title: `${t('friends.title')} | ${SITE_NAME}`,
  description: t('friends.seoDescription'),
  path: route.path,
  type: 'website',
}))

const pageRoot = ref<HTMLElement | null>(null)
const friends = ref<FriendLink[]>([])
const specialLinks = ref<SpecialLink[]>([])
const loading = ref(true)

const friendCount = computed(() => friends.value.length)

function friendCardStyle(friend: FriendLink) {
  const avatar = resolveFriendAvatar(friend.url, friend.avatar)
  return linkCardStyle(avatar, friend.cover)
}

function friendAvatarSrc(friend: FriendLink): string {
  return resolveFriendAvatar(friend.url, friend.avatar)
}

function linkCardStyle(avatar: string, cover?: string) {
  const resolvedCover = resolveFriendCover(avatar, cover)
  return {
    '--friend-cover': `url("${resolvedCover.replace(/"/g, '\\"')}")`,
  } as Record<string, string>
}

function specialCardStyle(item: SpecialLink) {
  if (item.icon === 'travellings' || item.icon === 'acg-trip') {
    return {} as Record<string, string>
  }
  const avatar = resolveFriendAvatar(item.url, item.avatar)
  return linkCardStyle(avatar, item.avatar)
}

function specialCardClass(item: SpecialLink) {
  return {
    'friends-special-card--travellings': item.icon === 'travellings',
    'friends-special-card--acg-trip': item.icon === 'acg-trip',
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const [linkList, specialList] = await Promise.all([fetchFriendLinks(), fetchSpecialLinks()])
    friends.value = linkList
    specialLinks.value = specialList
  } finally {
    loading.value = false
  }
  await playPageEnter(pageRoot.value)
})
</script>

<template>
  <section ref="pageRoot" class="friends-page">
    <header class="message-hero">
      <p class="message-hero-eyebrow">{{ t('friends.eyebrow') }}</p>
      <h1 class="message-hero-title">{{ t('friends.title') }}</h1>
      <p class="message-hero-sub">{{ t('friends.subtitle') }}</p>
    </header>

    <div class="friends-welcome-row">
      <blockquote class="message-welcome card">
        <p class="message-welcome-line">{{ t('friends.welcomeText') }}</p>
      </blockquote>

      <RouterLink to="/friends/apply" class="friends-apply-entry card">
        <p class="friends-apply-entry-title">{{ t('friends.applyEntryTitle') }}</p>
        <span class="friends-apply-entry-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h12M13 8l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </RouterLink>
    </div>

    <section class="friends-section" aria-labelledby="friends-list-heading">
      <div class="friends-list-panel card">
        <h2 id="friends-list-heading" class="friends-section-title">{{ t('friends.listTitle') }}</h2>
        <p class="friends-section-meta">{{ t('friends.listCount', { count: friendCount }) }}</p>

        <p v-if="loading" class="friends-loading" role="status">{{ t('friends.loading') }}</p>
        <ul v-else class="friends-grid" role="list">
          <li v-for="(friend, index) in friends" :key="friend.id">
            <a
              class="friend-card card"
              :href="friend.url"
              target="_blank"
              rel="noopener noreferrer"
              :style="{ ...friendCardStyle(friend), '--enter-i': String(index) }"
            >
              <div class="friend-card-body">
                <img
                  class="friend-card-avatar"
                  :src="friendAvatarSrc(friend)"
                  :alt="friend.name"
                  width="40"
                  height="40"
                  loading="lazy"
                />
                <div class="friend-card-info">
                  <p class="friend-card-name">{{ friend.name }}</p>
                  <p class="friend-card-desc">{{ friend.description }}</p>
                </div>
              </div>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <section class="friends-section" aria-labelledby="friends-special-heading">
      <div class="friends-special-panel card">
        <h2 id="friends-special-heading" class="friends-section-title">{{ t('friends.specialTitle') }}</h2>
        <div class="friends-special-grid">
          <a
            v-for="(item, index) in specialLinks"
            :key="item.id"
            class="friends-special-card card"
            :class="specialCardClass(item)"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            :style="{ ...specialCardStyle(item), '--enter-i': String(index) }"
          >
            <div class="friends-special-card-body">
              <SpecialLinkAvatar :item="item" />
              <div class="friends-special-info">
                <p class="friends-special-title">{{ item.title }}</p>
                <p class="friends-special-desc">{{ item.description }}</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
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

.message-welcome {
  padding: 1.15rem 1.25rem;
  border-left: 3px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
}

.message-welcome-line {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--color-text);
}

.friends-loading {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>
