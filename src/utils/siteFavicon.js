/** 从站点 URL 生成 favicon 地址（参考常见友链页做法） */
export function siteFaviconUrl(siteUrl, size = 128) {
    try {
        const host = new URL(siteUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
    }
    catch {
        return '';
    }
}
export function resolveFriendAvatar(url, explicit) {
    if (explicit?.trim())
        return explicit.trim();
    return siteFaviconUrl(url, 128);
}
export function resolveFriendCover(avatar, explicit) {
    if (explicit?.trim())
        return explicit.trim();
    return avatar;
}
