import type { AboutProfile } from '@/content/data/aboutResume'
import { isStaticSite } from '@/config/staticSite'
import { loadStaticSiteBundle } from '@/services/static/staticSiteData'

interface ApiEnvelope<T> {
  code: number
  data: T
  message?: string
}

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base.replace(/\/$/, '')}${p}` : p
}

export async function fetchAboutProfile(): Promise<AboutProfile | null> {
  if (isStaticSite) {
    const bundle = await loadStaticSiteBundle()
    return bundle.xiqi.about
  }
  try {
    const res = await fetch(apiUrl('/api/xiqi/about'), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiEnvelope<AboutProfile | null>
    if (json.code !== 0 || !json.data) return null
    return json.data
  } catch {
    return null
  }
}
