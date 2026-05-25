<script setup lang="ts">
import { RouterView } from 'vue-router'

import SplashWoniuOverlay from '@/components/SplashWoniuOverlay.vue'
import FloatingMusicPlayer from '@/components/music/FloatingMusicPlayer.vue'
</script>

<template>
  <SplashWoniuOverlay />
  <RouterView />
  <FloatingMusicPlayer />
</template>
