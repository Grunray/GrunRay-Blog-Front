<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useSeoMeta } from '@/composables/useSeoMeta'
import { SITE_NAME } from '@/config/site'

const { t } = useI18n()
const route = useRoute()

const titleKey = computed(() => {
  const key = route.meta.navTitleKey
  return typeof key === 'string' ? key : 'nav.home'
})

const pageTitle = computed(() => t(titleKey.value))

useSeoMeta(() => ({
  title: `${pageTitle.value} | ${SITE_NAME}`,
  description: t('nav.placeholderSoon'),
  path: route.path,
  type: 'website',
  robots: 'noindex, follow',
}))
</script>

<template>
  <section class="wrap">
    <h1>{{ pageTitle }}</h1>
    <p class="muted">{{ t('nav.placeholderSoon') }}</p>
  </section>
</template>

<style scoped>
.wrap {
  padding: 2rem 0;
  text-align: center;
}

.muted {
  margin-top: 0.75rem;
  color: var(--color-text-muted);
}
</style>
