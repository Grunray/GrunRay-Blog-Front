<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'

import AboutPrivateText from '@/components/xiqi/AboutPrivateText.vue'
import XiqiPageHero from '@/components/xiqi/XiqiPageHero.vue'
import { ABOUT_PROFILE, type AboutProfile } from '@/content/data/aboutResume'
import { playPageEnter } from '@/composables/usePageEnterAnimation'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { fetchAboutProfile } from '@/services/aboutApi'
import { SITE_AVATAR_FALLBACK_URL, SITE_AVATAR_PHOTO_URL } from '@/config/siteAvatar'
import { SITE_NAME } from '@/config/site'
import '@/styles/page-enter-xiqi.css'
import '@/styles/page-xiqi.css'

const { t } = useI18n()
const route = useRoute()
const profile = ref<AboutProfile>(ABOUT_PROFILE)

useSeoMeta(() => ({
  title: `${t('about.title')} | ${SITE_NAME}`,
  description: t('about.seoDescription'),
  path: route.path,
  type: 'website',
}))

const pageRoot = ref<HTMLElement | null>(null)
const avatarSrc = ref(SITE_AVATAR_PHOTO_URL)

function onAvatarError() {
  avatarSrc.value = SITE_AVATAR_FALLBACK_URL
}

function awardTierClass(tier: string): string {
  return `about-award-chip--${tier}`
}

onMounted(async () => {
  if (pageRoot.value) void playPageEnter(pageRoot.value)
  const remote = await fetchAboutProfile()
  if (remote) {
    profile.value = remote
  }
})
</script>

<template>
  <section ref="pageRoot" class="xiqi-page about-page">
    <div class="about-page-inner">
      <XiqiPageHero
        page="about"
        :eyebrow="t('about.eyebrow')"
        :title="t('about.title')"
        :subtitle="t('about.subtitle')"
      />

      <section class="about-profile card card-glass-dense" aria-labelledby="about-profile-heading">
        <div class="about-profile-head">
          <div class="about-avatar">
            <img
              :src="avatarSrc"
              :alt="profile.alias"
              class="about-avatar-img"
              loading="lazy"
              decoding="async"
              @error="onAvatarError"
            />
          </div>
          <div class="about-profile-intro">
            <h2 id="about-profile-heading" class="about-name">{{ profile.alias }}</h2>
            <p class="about-meta-line">{{ profile.genderAge }}</p>
            <a class="about-email" :href="`mailto:${profile.email}`">{{ profile.email }}</a>
          </div>
        </div>
        <p class="about-intro">{{ profile.intro }}</p>
      </section>

      <aside class="about-privacy-notice card card-glass-dense" aria-label="隐私提示">
        <span class="about-privacy-notice-badge">{{ t('about.privacyNoticeBadge') }}</span>
        <p class="about-privacy-notice-text">
          {{ t('about.privacyNotice') }}
          <a class="about-privacy-notice-email" :href="`mailto:${profile.email}`">{{ profile.email }}</a>
        </p>
      </aside>

      <section class="about-section" aria-labelledby="about-strengths-heading">
        <h2 id="about-strengths-heading" class="about-section-title">{{ t('about.strengths') }}</h2>
        <ul class="about-award-list">
          <li v-for="award in profile.awards" :key="award.id">
            <span class="about-award-chip" :class="awardTierClass(award.tier)">{{ award.label }}</span>
          </li>
        </ul>
      </section>

      <div class="about-facts-grid">
        <section class="about-block card card-glass-dense" aria-labelledby="about-edu-heading">
          <h2 id="about-edu-heading" class="about-block-title">{{ t('about.education') }}</h2>
          <p class="about-block-primary">
            {{ profile.education.schoolPublic }} · {{ profile.education.degree }}
          </p>
          <p class="about-block-secondary">
            {{ profile.education.major }} · {{ profile.education.period }}
          </p>
          <p class="about-block-meta about-block-meta--private">
            <AboutPrivateText
              block
              :label="t('about.educationRankHidden')"
              :value="profile.education.rankRaw"
            />
          </p>
        </section>

        <section class="about-block card card-glass-dense" aria-labelledby="about-intern-heading">
          <h2 id="about-intern-heading" class="about-block-title">{{ t('about.internship') }}</h2>
          <p class="about-block-primary">{{ profile.internship.companyPublic }}</p>
          <p class="about-block-secondary">
            {{ profile.internship.role }} · {{ profile.internship.period }}
          </p>
          <p class="about-block-body about-block-body--private">
            <AboutPrivateText
              block
              :label="t('about.internshipDetailHidden')"
              :value="profile.internship.summaryRaw"
            />
          </p>
        </section>
      </div>

      <section class="about-section about-projects-cta card card-glass-dense" aria-labelledby="about-projects-heading">
        <h2 id="about-projects-heading" class="about-section-title">{{ t('about.projects') }}</h2>
        <p class="about-projects-hint">{{ t('about.projectsHint') }}</p>
        <RouterLink to="/projects" class="btn-accent about-projects-link">
          <span class="about-projects-link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h12M13 8l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          {{ t('about.projectsCta') }}
        </RouterLink>
      </section>

      <div class="about-facts-grid">
        <section class="about-block card card-glass-dense" aria-labelledby="about-club-heading">
          <h2 id="about-club-heading" class="about-block-title">{{ t('about.club') }}</h2>
          <p class="about-block-primary about-block-primary--private">
            <AboutPrivateText
              block
              :label="profile.club.namePublic"
              :value="profile.club.nameRaw"
            />
          </p>
          <p class="about-block-secondary">{{ profile.club.role }} · {{ profile.club.period }}</p>
          <p class="about-block-body about-block-body--private">
            <AboutPrivateText
              block
              :label="t('about.clubDetailHidden')"
              :value="profile.club.summaryRaw"
            />
          </p>
        </section>

        <section class="about-block card card-glass-dense" aria-labelledby="about-cert-heading">
          <h2 id="about-cert-heading" class="about-block-title">{{ t('about.certificates') }}</h2>
          <ul class="about-cert-list">
            <li v-for="cert in profile.certificates" :key="cert">{{ cert }}</li>
          </ul>
        </section>
      </div>
    </div>
  </section>
</template>
