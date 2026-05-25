/** 站点级常量与绝对 URL（OG / canonical / JSON-LD） */
export const SITE_NAME = 'GrunRay';
const DEFAULT_OG_PATH = '/favicon.jpg';
function viteBasePath() {
    const base = import.meta.env.BASE_URL || '/';
    if (base === '/')
        return '';
    return base.replace(/\/$/, '');
}
/** 部署时可在 `.env.production` 设置 `VITE_SITE_ORIGIN=https://你的域名`，否则用当前访问的 origin */
export function getSiteOrigin() {
    const fromEnv = import.meta.env.VITE_SITE_ORIGIN;
    if (fromEnv && /^https?:\/\//i.test(fromEnv.trim())) {
        return fromEnv.trim().replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return '';
}
/** 将站内路径或已是绝对的 URL 转为绝对地址（含 Vite base） */
export function toAbsoluteUrl(href) {
    if (!href)
        return '';
    const t = href.trim();
    if (/^https?:\/\//i.test(t))
        return t;
    const origin = getSiteOrigin();
    const base = viteBasePath();
    const path = t.startsWith('/') ? t : `/${t}`;
    if (!origin)
        return `${base}${path}`;
    return `${origin}${base}${path}`;
}
export function defaultOgImageUrl() {
    return toAbsoluteUrl(DEFAULT_OG_PATH);
}
export function siteHomeUrl() {
    return toAbsoluteUrl('/');
}
