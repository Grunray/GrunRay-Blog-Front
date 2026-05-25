/** 从站点 URL 生成 favicon 地址（参考常见友链页做法） */
export function siteFaviconUrl(siteUrl: string, size = 128): string {
  try {
    const host = new URL(siteUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`
  } catch {
    return ''
  }
}

export function resolveFriendAvatar(url: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim()
  return siteFaviconUrl(url, 128)
}

export function resolveFriendCover(avatar: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim()
  return avatar
}
