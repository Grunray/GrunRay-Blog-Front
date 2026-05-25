<script setup lang="ts">
import { computed } from 'vue'

export type XiqiCardAccent =
  | 'rant'
  | 'sketch'
  | 'flash'
  | 'daily'
  | 'software'
  | 'opensource'
  | 'anime'
  | 'default'

const props = withDefaults(
  defineProps<{
    /** 列表项可点击（分栏详情） */
    interactive?: boolean
    selected?: boolean
    /** 详情含图时在卡片左侧展示封面 */
    coverSrc?: string
    coverAlt?: string
    /** 左侧色条 accent；碎念页传 mood id */
    accent?: XiqiCardAccent
    enterIndex?: number
    ariaExpanded?: boolean
  }>(),
  {
    interactive: false,
    selected: false,
    coverAlt: '',
    accent: 'default',
    enterIndex: 0,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const rootTag = computed(() => (props.interactive ? 'button' : 'article'))

const hasCover = computed(() => Boolean(props.coverSrc?.trim()))

function onClick(event: MouseEvent) {
  if (props.interactive) {
    emit('click', event)
  }
}
</script>

<template>
  <component
    :is="rootTag"
    class="xiqi-card card card-glass-dense"
    :class="[
      {
        'xiqi-card--interactive': interactive,
        'xiqi-card--cover-left': hasCover,
        'is-selected': selected,
      },
      accent !== 'default' ? `xiqi-card--accent-${accent}` : null,
    ]"
    :type="interactive ? 'button' : undefined"
    :style="{ '--enter-i': String(enterIndex) }"
    :aria-expanded="interactive ? ariaExpanded : undefined"
    @click="onClick"
  >
    <div v-if="hasCover" class="xiqi-card-cover">
      <img
        :src="coverSrc"
        :alt="coverAlt"
        loading="lazy"
        decoding="async"
      />
    </div>

    <div class="xiqi-card-content">
      <slot name="header" />
      <slot />
      <slot name="footer" />
    </div>
  </component>
</template>
