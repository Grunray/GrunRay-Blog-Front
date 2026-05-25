/**
 * 项目详情「展示块」注册表：新增块类型时在此映射组件，无需改路由。
 */
import type { Component } from 'vue'

import ChangelogBlock from './blocks/ChangelogBlock.vue'
import DemoBlock from './blocks/DemoBlock.vue'
import FallbackBlock from './blocks/FallbackBlock.vue'
import GalleryBlock from './blocks/GalleryBlock.vue'
import MarkdownBlock from './blocks/MarkdownBlock.vue'
import OverviewBlock from './blocks/OverviewBlock.vue'

import type { ProjectLayoutBlockType } from '@/types/content'

export const projectBlockRegistry: Record<ProjectLayoutBlockType, Component> = {
  overview: OverviewBlock,
  demo: DemoBlock,
  changelog: ChangelogBlock,
  gallery: GalleryBlock,
  markdown: MarkdownBlock,
}

export function resolveProjectBlock(type: string): Component {
  return projectBlockRegistry[type as ProjectLayoutBlockType] ?? FallbackBlock
}
