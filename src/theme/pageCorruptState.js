/** 404 彩蛋：全站乱码视觉层 */
export function setPageCorruptState(enabled) {
    if (enabled) {
        document.documentElement.dataset.pageCorrupt = 'true';
    }
    else {
        delete document.documentElement.dataset.pageCorrupt;
    }
}
/** 404 路由：当前非 abstract 主题时播放乱码（与是否已解锁无关） */
export function syncPageCorruptForRoute(routeName) {
    const onNotFound = routeName === 'not-found';
    const theme = document.documentElement.dataset.theme ?? 'light';
    setPageCorruptState(onNotFound && theme !== 'abstract');
}
