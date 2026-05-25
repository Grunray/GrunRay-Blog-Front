<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

import AboutNavIcon from '../icons/AboutNavIcon.vue'
import BlogNavIcon from '../icons/BlogNavIcon.vue'
import CommunityNavIcon from '../icons/CommunityNavIcon.vue'
import CreateNavIcon from '../icons/CreateNavIcon.vue'
import FragmentsNavIcon from '../icons/FragmentsNavIcon.vue'
import FriendsNavIcon from '../icons/FriendsNavIcon.vue'
import HomeNavIcon from '../icons/HomeNavIcon.vue'
import MessagesNavIcon from '../icons/MessagesNavIcon.vue'
import ProjectsNavIcon from '../icons/ProjectsNavIcon.vue'
import RecommendNavIcon from '../icons/RecommendNavIcon.vue'
import XiqiNavIcon from '../icons/XiqiNavIcon.vue'
import SiteNavGroup, { type SiteNavDropdownItem } from './SiteNavGroup.vue'

const { t } = useI18n()
const route = useRoute()

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

function mapItems(
  entries: { to: string; labelKey: string; descKey: string; icon: SiteNavDropdownItem['icon'] }[],
): SiteNavDropdownItem[] {
  return entries.map((entry) => ({
    to: entry.to,
    label: t(entry.labelKey),
    desc: t(entry.descKey),
    icon: entry.icon,
  }))
}

const createGroup = computed(() => ({
  label: t('nav.groupCreate'),
  icon: CreateNavIcon,
  menuId: 'shell-nav-menu-create',
  items: mapItems([
    { to: '/projects', labelKey: 'nav.projects', descKey: 'nav.projectsDesc', icon: ProjectsNavIcon },
    { to: '/blog', labelKey: 'nav.blog', descKey: 'nav.blogDesc', icon: BlogNavIcon },
  ]),
}))

const communityGroup = computed(() => ({
  label: t('nav.groupCommunity'),
  icon: CommunityNavIcon,
  menuId: 'shell-nav-menu-community',
  items: mapItems([
    { to: '/messages', labelKey: 'nav.messages', descKey: 'nav.messagesDesc', icon: MessagesNavIcon },
    { to: '/friends', labelKey: 'nav.friends', descKey: 'nav.friendsDesc', icon: FriendsNavIcon },
  ]),
}))

const xiqiGroup = computed(() => ({
  label: t('nav.groupXiqi'),
  icon: XiqiNavIcon,
  menuId: 'shell-nav-menu-xiqi',
  items: mapItems([
    { to: '/fragments', labelKey: 'nav.fragments', descKey: 'nav.fragmentsDesc', icon: FragmentsNavIcon },
    { to: '/about', labelKey: 'nav.about', descKey: 'nav.aboutDesc', icon: AboutNavIcon },
    { to: '/recommend', labelKey: 'nav.recommend', descKey: 'nav.recommendDesc', icon: RecommendNavIcon },
  ]),
}))
</script>

<template>
  <nav class="nav nav--shell" aria-label="Main">
    <RouterLink
      to="/"
      class="link"
      :class="{ active: isActive('/') }"
      :aria-current="isActive('/') ? 'page' : undefined"
    >
      <span class="link-icon" aria-hidden="true">
        <HomeNavIcon />
      </span>
      <span class="link-label">{{ t('nav.home') }}</span>
      <span class="leaf-glow" aria-hidden="true" />
      <span class="grow-line" aria-hidden="true" />
    </RouterLink>

    <SiteNavGroup
      :label="createGroup.label"
      :icon="createGroup.icon"
      :items="createGroup.items"
      :menu-id="createGroup.menuId"
    />
    <SiteNavGroup
      :label="communityGroup.label"
      :icon="communityGroup.icon"
      :items="communityGroup.items"
      :menu-id="communityGroup.menuId"
    />
    <SiteNavGroup
      :label="xiqiGroup.label"
      :icon="xiqiGroup.icon"
      :items="xiqiGroup.items"
      :menu-id="xiqiGroup.menuId"
    />
  </nav>
</template>

<style scoped>
/*
 * 主导航 · v4 分组（首页 + 创作 / 社区 / 栖息）
 */
.nav {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.55rem;
}

.link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: 0.92rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-decoration: none;
  white-space: nowrap;
  padding: 0.7rem 1.05rem;
  border-radius: 999px;
  border: 1px solid transparent;
  background-color: transparent;
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.35s ease,
    background-color 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.45s ease;
}

.link-icon {
  display: inline-flex;
  flex-shrink: 0;
  line-height: 0;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.link:hover {
  color: var(--color-text);
  text-decoration: none;
  background-color: color-mix(in srgb, var(--color-accent) 18%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 16%, transparent);
  transform: translateY(-2px) scale(1.015);
}

.link:hover .link-icon {
  transform: translateY(-1px) rotate(-2deg);
}

.link.active {
  color: #6fad87;
  background-color: rgb(204 229 213 / 42%);
  border-color: rgb(180 210 192 / 55%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 75%),
    0 4px 14px rgb(170 205 185 / 15%);
  animation: shell-nav-breath 4s ease-in-out infinite;
}

:global([data-theme='dark']) .link.active {
  color: color-mix(in srgb, var(--color-accent) 88%, #b8e6c8);
  background-color: color-mix(in srgb, var(--color-accent) 14%, rgb(30 44 46 / 55%));
  border-color: color-mix(in srgb, var(--color-accent) 28%, transparent);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 8%),
    0 4px 14px rgb(0 0 0 / 18%);
}

.leaf-glow {
  position: absolute;
  width: 8px;
  height: 8px;
  right: 10px;
  top: 8px;
  border-radius: 100%;
  background: rgb(172 222 186 / 45%);
  filter: blur(3px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.45s ease;
}

.link.active .leaf-glow {
  opacity: 1;
}

.grow-line {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 0;
  height: 2px;
  border-radius: 10px;
  background: linear-gradient(90deg, transparent, rgb(153 210 174 / 70%), transparent);
  transition: width 0.5s ease, left 0.5s ease;
  pointer-events: none;
}

.link:hover .grow-line {
  width: 70%;
  left: 15%;
}

@keyframes shell-nav-breath {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

@media (max-width: 720px) {
  .link {
    padding: 0.52rem 0.72rem;
    font-size: 0.86rem;
    gap: 0.4rem;
  }

  .nav {
    gap: 0.22rem 0.28rem;
  }

  .link :deep(.shell-nav-icon) {
    width: 0.92rem;
    height: 0.92rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .link,
  .link:hover,
  .link.active {
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
    transform: none;
    animation: none;
  }

  .link:hover .link-icon {
    transform: none;
  }
}
</style>
