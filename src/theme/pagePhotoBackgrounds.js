/** 与 `backend/import/film/...` 经媒体 API 暴露的路径一致 */
export const DEFAULT_PAGE_PHOTO_BG_URL = '/api/media/files/film/main/background/bg_homeview.png';
/** 按路由 `name` 配置；未列出的路由在 resolve 时回落到 DEFAULT_PAGE_PHOTO_BG_URL */
export const PAGE_PHOTO_BG_BY_ROUTE_NAME = {
    home: DEFAULT_PAGE_PHOTO_BG_URL,
    projects: DEFAULT_PAGE_PHOTO_BG_URL,
    'project-detail': '/api/media/files/film/main/background/bg_secondary.png',
    'project-notes': '/api/media/files/film/main/background/bg_secondary.png',
    blog: DEFAULT_PAGE_PHOTO_BG_URL,
    messages: DEFAULT_PAGE_PHOTO_BG_URL,
    friends: DEFAULT_PAGE_PHOTO_BG_URL,
    'friends-apply': DEFAULT_PAGE_PHOTO_BG_URL,
    fragments: DEFAULT_PAGE_PHOTO_BG_URL,
    about: DEFAULT_PAGE_PHOTO_BG_URL,
    recommend: DEFAULT_PAGE_PHOTO_BG_URL,
    'post-detail': '/api/media/files/film/main/background/bg_secondary.png',
    'not-found': '/api/media/files/film/404/404_not_found.jpg',
};
const CSS_VAR = '--page-photo-bg-image';
const CSS_VAR_PREV = '--page-photo-bg-image-prev';
const SWAP_CLASS = 'page-photo-bg--swap';
const SWAP_MS = 520;
let lastResolvedPhotoBgUrl = null;
let photoBgSwapTimer = null;
function cssUrlValue(path) {
    const safe = path.replace(/\\/g, '/').replace(/'/g, "\\'");
    return `url('${safe}')`;
}
export function resolvePagePhotoBackgroundUrl(route) {
    for (let i = route.matched.length - 1; i >= 0; i -= 1) {
        const raw = route.matched[i]?.meta?.photoBackgroundImage;
        if (typeof raw === 'string' && raw.trim() !== '') {
            return raw.trim();
        }
    }
    const name = typeof route.name === 'string' ? route.name : '';
    return PAGE_PHOTO_BG_BY_ROUTE_NAME[name] ?? DEFAULT_PAGE_PHOTO_BG_URL;
}
function prefersReducedMotion() {
    if (typeof window === 'undefined')
        return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function photoBgEnabledOnDocument() {
    return document.documentElement.dataset.photoBg === 'true';
}
export function applyPagePhotoBackgroundToDocument(route) {
    const url = resolvePagePhotoBackgroundUrl(route);
    const root = document.documentElement;
    const enabled = photoBgEnabledOnDocument();
    const nextVal = cssUrlValue(url);
    if (enabled && !prefersReducedMotion() && lastResolvedPhotoBgUrl !== null && lastResolvedPhotoBgUrl !== url) {
        root.style.setProperty(CSS_VAR_PREV, cssUrlValue(lastResolvedPhotoBgUrl));
        root.style.setProperty(CSS_VAR, nextVal);
        root.classList.remove(SWAP_CLASS);
        void root.offsetWidth;
        root.classList.add(SWAP_CLASS);
        if (photoBgSwapTimer !== null) {
            clearTimeout(photoBgSwapTimer);
        }
        photoBgSwapTimer = window.setTimeout(() => {
            photoBgSwapTimer = null;
            root.classList.remove(SWAP_CLASS);
            root.style.removeProperty(CSS_VAR_PREV);
        }, SWAP_MS);
    }
    else {
        root.style.setProperty(CSS_VAR, nextVal);
    }
    lastResolvedPhotoBgUrl = url;
}
