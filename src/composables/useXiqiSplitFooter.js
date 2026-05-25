/** 栖息分栏打开时暂停页脚揭示；关闭后恢复 */
export const XIQI_SPLIT_OPEN_ATTR = 'data-xiqi-split-open';
export const FOOTER_REFRESH_EVENT = 'grunray:footer-refresh';
export function isXiqiSplitFooterLocked() {
    return document.documentElement.hasAttribute(XIQI_SPLIT_OPEN_ATTR);
}
export function setXiqiSplitFooterLock(locked, options) {
    if (locked) {
        document.documentElement.setAttribute(XIQI_SPLIT_OPEN_ATTR, '');
        document.documentElement.style.setProperty('--footer-reveal-space', '0px');
        document.documentElement.style.setProperty('--reveal-progress', '0');
        document.documentElement.removeAttribute('data-footer-over-cover');
        document.documentElement.removeAttribute('data-footer-revealing');
    }
    else {
        document.documentElement.removeAttribute(XIQI_SPLIT_OPEN_ATTR);
        document.documentElement.style.removeProperty('--footer-reveal-space');
        document.documentElement.style.removeProperty('--reveal-progress');
    }
    if (options?.deferRefresh) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.dispatchEvent(new CustomEvent(FOOTER_REFRESH_EVENT));
            });
        });
        return;
    }
    window.dispatchEvent(new CustomEvent(FOOTER_REFRESH_EVENT));
}
