<script setup lang="ts">
/**
 * 隐私字段展示：正文仍渲染（便于后续接 API），前端用液态玻璃 + 模糊遮挡。
 *
 * —— 后端约定（Markdown / HTML 导入时）——
 * 需隐藏的片段用特殊标签包裹，解析后映射为本组件。推荐两种写法（二选一）：
 *
 * 1) 自定义元素（与前端组件名对齐）：
 *    <xiqi-private label="专业排名（已隐藏）">专业排名前 30%</xiqi-private>
 *
 * 2) 标准 div + data 属性（便于 Markdown 内嵌 HTML）：
 *    <div data-xiqi-private data-label="实习详情（已隐藏）">……正文……</div>
 *
 * 后端只应在受信 import 源中保留上述标签；对外 API 可改为仅返回 label + 占位符，
 * 或继续返回带标签的 HTML 由前端 sanitize 后渲染。
 *
 * 当前静态数据见 aboutResume.ts 中 *Raw 字段；接入 API 后改为解析标签或结构化字段。
 */
withDefaults(
  defineProps<{
    /** 占位/脱敏后的可读文案（屏幕阅读器） */
    label: string
    /** 实际渲染后会被遮挡的文本 */
    value: string
    block?: boolean
  }>(),
  {
    block: false,
  },
)
</script>

<template>
  <span class="about-private" :class="{ 'about-private--block': block }" :aria-label="label">
    <span class="about-private-inner">{{ value }}</span>
    <span class="about-private-scrim" aria-hidden="true" />
    <span class="about-private-sr">{{ label }}</span>
  </span>
</template>

<style scoped>
.about-private {
  position: relative;
  display: inline;
  border-radius: 0.35rem;
  overflow: hidden;
}

.about-private--block {
  display: block;
  width: 100%;
}

.about-private-inner {
  display: inline;
  filter: blur(5px);
  user-select: none;
  pointer-events: none;
  opacity: 0.85;
}

.about-private--block .about-private-inner {
  display: block;
}

.about-private-scrim {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(10px) saturate(150%) brightness(1.04);
  -webkit-backdrop-filter: blur(10px) saturate(150%) brightness(1.04);
  background:
    repeating-linear-gradient(
      45deg,
      color-mix(in srgb, var(--color-bg-surface) 18%, transparent) 0 2px,
      transparent 2px 6px
    ),
    color-mix(in srgb, var(--glass-card-bg) 62%, transparent);
  pointer-events: none;
}

.about-private-sr {
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
</style>
