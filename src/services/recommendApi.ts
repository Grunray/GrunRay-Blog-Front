import { isStaticSite } from '@/config/staticSite'
import { loadStaticSiteBundle } from '@/services/static/staticSiteData'

export type RecommendCategory = 'software' | 'opensource' | 'anime'

export interface RecommendItem {
  id: string
  category: RecommendCategory
  title: string
  rating: number
  summary: string
  url?: string
  createdAt: string
  imageUrl?: string
  imageAlt?: string
}

export interface RecommendDetail extends RecommendItem {
  body?: string
  bodyHtml?: string
  images?: Array<{ url: string; alt: string }>
  coverIndex?: number
}

export interface RecommendListResult {
  items: RecommendItem[]
  total: number
  page: number
  size: number
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

async function recommendFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

function filterRecommendations(
  items: RecommendItem[],
  params?: {
    category?: RecommendCategory | 'all'
    rating?: number | null
    sort?: 'newest' | 'oldest'
  },
): RecommendItem[] {
  let list = [...items]
  if (params?.category && params.category !== 'all') {
    list = list.filter((r) => r.category === params.category)
  }
  if (params?.rating != null) {
    list = list.filter((r) => r.rating === params.rating)
  }
  const sort = params?.sort ?? 'newest'
  list.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    return sort === 'oldest' ? ta - tb : tb - ta
  })
  return list
}

export async function fetchRecommendations(params?: {
  category?: RecommendCategory | 'all'
  rating?: number | null
  sort?: 'newest' | 'oldest'
  page?: number
  size?: number
}): Promise<RecommendListResult> {
  if (isStaticSite) {
    const bundle = await loadStaticSiteBundle()
    const all = filterRecommendations(bundle.xiqi.recommendations.items, params)
    const page = params?.page ?? 1
    const size = params?.size ?? 50
    const start = (page - 1) * size
    const items = all.slice(start, start + size)
    return { items, total: all.length, page, size }
  }
  const q = new URLSearchParams()
  if (params?.category && params.category !== 'all') q.set('category', params.category)
  if (params?.rating != null) q.set('rating', String(params.rating))
  if (params?.sort) q.set('sort', params.sort)
  if (params?.page) q.set('page', String(params.page))
  if (params?.size) q.set('size', String(params.size))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return recommendFetch<RecommendListResult>(`/api/recommendations${suffix}`)
}

export async function fetchRecommendDetail(publicId: string): Promise<RecommendDetail> {
  if (isStaticSite) {
    const bundle = await loadStaticSiteBundle()
    const detail = bundle.xiqi.recommendDetails[publicId]
    if (!detail) {
      const err = new Error('not_found') as Error & { status?: number }
      err.status = 404
      throw err
    }
    return detail
  }
  return recommendFetch<RecommendDetail>(`/api/recommendations/${encodeURIComponent(publicId)}`)
}
