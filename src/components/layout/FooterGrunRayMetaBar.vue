<script setup lang="ts">
import FooterExternalLinks from './FooterExternalLinks.vue'

defineProps<{
  metaVisible: boolean
}>()
</script>

<template>
  <Teleport to="body">
    <div
      class="footer-grunray-meta-bar"
      data-footer-meta-teleport
      :aria-hidden="!metaVisible"
    >
      <div
        class="footer-grunray-meta-bar__shell footer-grunray-glass-panel"
        :class="{ 'is-visible': metaVisible }"
      >
        <div class="footer-grunray-meta-bar__inner">
          <div class="footer-grunray-meta-col footer-grunray-meta-col--start">
            <FooterExternalLinks />
          </div>
          <span class="footer-grunray-meta-divider" aria-hidden="true" />
          <div class="footer-grunray-meta-col footer-grunray-meta-col--end">
            <span class="footer-grunray-copyright">© 2026 · GrunRay ·</span>
            <a
              class="footer-grunray-icp-link"
              href="https://icp.gov.moe/?keyword=20266668"
              target="_blank"
              rel="noopener noreferrer"
            >萌ICP备20266668号</a>
            <span
              class="footer-grunray-meta-divider footer-grunray-meta-divider--inline"
              aria-hidden="true"
            />
            <a
              class="footer-grunray-rss-link"
              href="/rss.xml"
              type="application/rss+xml"
              title="RSS 订阅本站博客更新"
            >RSS订阅</a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
