import { nextTick } from 'vue';
/** 与 page-enter-*.css 中规则对应 */
export const PAGE_ENTER_PLAY_CLASS = 'page-enter--play';
export function prefersReducedMotionMedia() {
    if (typeof window === 'undefined')
        return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
/** 双 rAF：在布局与子节点渲染后再加类，避免首帧丢动画 */
export async function playPageEnter(root) {
    if (!root || prefersReducedMotionMedia())
        return;
    await nextTick();
    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                root.classList.add(PAGE_ENTER_PLAY_CLASS);
                resolve();
            });
        });
    });
}
export function resetPageEnter(root) {
    root?.classList.remove(PAGE_ENTER_PLAY_CLASS);
}
/**
 * 同步移除类、强制 reflow、再加回类，用于重启 CSS animation。
 * 避免 reset + await play 之间出现一帧「无动画类」导致内容全显闪烁。
 */
export function restartPageEnter(root) {
    if (!root || prefersReducedMotionMedia())
        return;
    root.classList.remove(PAGE_ENTER_PLAY_CLASS);
    void root.offsetWidth;
    root.classList.add(PAGE_ENTER_PLAY_CLASS);
}
