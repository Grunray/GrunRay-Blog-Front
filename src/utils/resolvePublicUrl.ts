const MEDIA_API_PREFIX = '/api/media/files/'
const MEDIA_STATIC_PREFIX = '/content/media/'

/** 将 /content/media/... 或 /api/media/files/... 转为带 Vite base 的路径 */
export function resolvePublicUrl(href: string): string {
  if (!href) return href
  if (/^https?:\/\//i.test(href)) return href
  let path = href.replace(/\\/g, '/')
  if (path.includes(MEDIA_API_PREFIX)) {
    path = path.split(MEDIA_API_PREFIX).join(MEDIA_STATIC_PREFIX)
  }
  const base = import.meta.env.BASE_URL || '/'
  const root = base.endsWith('/') ? base.slice(0, -1) : base
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${root}${normalized}`
}

/** 替换 HTML/Markdown 字符串内所有媒体 API 路径 */
export function rewriteHtmlMediaUrls(html: string): string {
  if (!html) return html
  return html.replace(/\/api\/media\/files\/([^"'\s)>]+)/g, (_, rest: string) =>
    resolvePublicUrl(`${MEDIA_STATIC_PREFIX}${rest}`),
  )
}

/** 任意文本内的 API 媒体路径 → 可访问的静态路径 */
export function rewriteMediaInText(text: string): string {
  if (!text) return text
  const normalized = text.replace(/\\/g, '/')
  if (!normalized.includes(MEDIA_API_PREFIX) && !normalized.includes(MEDIA_STATIC_PREFIX)) {
    return text
  }
  if (normalized.includes(MEDIA_API_PREFIX)) {
    const replaced = normalized.split(MEDIA_API_PREFIX).join(MEDIA_STATIC_PREFIX)
    if (normalized.includes('<') || normalized.includes('![')) {
      return rewriteHtmlMediaUrls(replaced)
    }
    return resolvePublicUrl(replaced)
  }
  if (normalized.startsWith(MEDIA_STATIC_PREFIX) || normalized.includes(MEDIA_STATIC_PREFIX)) {
    if (normalized.includes('<') || normalized.includes('![')) {
      return rewriteHtmlMediaUrls(normalized)
    }
    return resolvePublicUrl(normalized)
  }
  return text
}

export function resolvePublicUrlsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return rewriteMediaInText(value) as T
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
