/** 将 /content/media/... 转为带 Vite base 的绝对路径（如 /GrunRay-Blog-Front/content/media/...） */
export function resolvePublicUrl(href: string): string {
  if (!href) return href
  if (/^https?:\/\//i.test(href)) return href
  const base = import.meta.env.BASE_URL || '/'
  const root = base.endsWith('/') ? base.slice(0, -1) : base
  const path = href.startsWith('/') ? href : `/${href}`
  return `${root}${path}`
}

export function resolvePublicUrlsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    if (value.startsWith('/content/media/') || value.startsWith('/api/media/files/')) {
      const normalized = value.startsWith('/api/media/files/')
        ? `/content/media/${value.slice('/api/media/files/'.length)}`
        : value
      return resolvePublicUrl(normalized) as T
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((x) => resolvePublicUrlsDeep(x)) as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolvePublicUrlsDeep(v)
    }
    return out as T
  }
  return value
}
