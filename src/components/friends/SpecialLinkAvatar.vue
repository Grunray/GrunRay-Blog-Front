<script setup lang="ts">
import type { SpecialLink } from '@/content/data/mockFriends'

import SpecialLinkIcon from '@/components/friends/SpecialLinkIcon.vue'

defineProps<{
  item: SpecialLink
}>()
</script>

<template>
  <SpecialLinkIcon v-if="item.icon" :icon="item.icon" />
</template>
