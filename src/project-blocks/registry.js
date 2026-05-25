import ChangelogBlock from './blocks/ChangelogBlock.vue';
import DemoBlock from './blocks/DemoBlock.vue';
import FallbackBlock from './blocks/FallbackBlock.vue';
import GalleryBlock from './blocks/GalleryBlock.vue';
import MarkdownBlock from './blocks/MarkdownBlock.vue';
import OverviewBlock from './blocks/OverviewBlock.vue';
export const projectBlockRegistry = {
    overview: OverviewBlock,
    demo: DemoBlock,
    changelog: ChangelogBlock,
    gallery: GalleryBlock,
    markdown: MarkdownBlock,
};
export function resolveProjectBlock(type) {
    return projectBlockRegistry[type] ?? FallbackBlock;
}
