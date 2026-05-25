import type { FragmentMood } from '@/content/data/mockFragments'

export interface Fragment {
  id: string
  content: string
  mood: FragmentMood
  createdAt: string
  imageUrl?: string
  imageAlt?: string
}

export interface FragmentDetail extends Fragment {
  body?: string
  bodyHtml?: string
  images?: Array<{ url: string; alt: string }>
  coverIndex?: number
}

export interface FragmentListResult {
  items: Fragment[]
  total: number
  page: number
  size: number
}

export interface XiqiPageConfig {
  page: string
  heroImageUrl: string | null
  heroImageAlt: string
  status?: string
  updatedAt?: string | null
}

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

async function fragmentsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })
  const body = (await res.json()) as ApiEnvelope<T>
  if (!res.ok || body.code !== 0) {
    const err = new Error(body.message || `API ${res.status}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return body.data
}

export async function fetchFragments(params?: {
  mood?: FragmentMood | 'all'
  sort?: 'newest' | 'oldest'
  page?: number
  size?: number
}): Promise<FragmentListResult> {
  const q = new URLSearchParams()
  if (params?.mood && params.mood !== 'all') q.set('mood', params.mood)
  if (params?.sort) q.set('sort', params.sort)
  if (params?.page) q.set('page', String(params.page))
  if (params?.size) q.set('size', String(params.size))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return fragmentsFetch<FragmentListResult>(`/api/fragments${suffix}`)
}

export async function fetchFragmentDetail(publicId: string): Promise<FragmentDetail> {
  return fragmentsFetch<FragmentDetail>(`/api/fragments/${encodeURIComponent(publicId)}`)
}

export async function fetchXiqiPageConfig(page: string): Promise<XiqiPageConfig> {
  return fragmentsFetch<XiqiPageConfig>(`/api/xiqi/pages/${encodeURIComponent(page)}`)
}
