import type { FragmentMood } from '@/content/data/mockFragments'

export interface FragmentImageRef {
  url: string
  alt: string
}

export interface SaveFragmentImportPayload {
  publicId?: string
  mood: FragmentMood
  status: 'published' | 'hidden' | 'draft'
  createdAt?: string
  images: FragmentImageRef[]
  coverIndex: number
  bodyMarkdown: string
}

export interface SaveFragmentImportResult {
  publicId: string
  path: string
  importCommand: string
}

export interface SaveXiqiPageImportPayload {
  page: 'fragments' | 'about' | 'recommend'
  heroImageUrl?: string | null
  heroImageAlt?: string
  status?: 'published' | 'hidden'
}

export interface SaveXiqiPageImportResult {
  page: string
  path: string
  importCommand: string
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

async function adminFetch<T>(path: string, init?: RequestInit): Promise<{ data: T; message: string }> {
  const res = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body instanceof FormData ? {} : init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })
  const body = (await res.json()) as ApiEnvelope<T>
  if (!res.ok || body.code !== 0) {
    const err = new Error(body.message || `API ${res.status}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return { data: body.data, message: body.message || '' }
}

export async function uploadXiqiMedia(
  scope: 'fragments' | `pages/${'fragments' | 'about' | 'recommend'}`,
  file: File,
  alt = '',
): Promise<FragmentImageRef> {
  const form = new FormData()
  form.append('file', file)
  if (alt) form.append('alt', alt)
  const { data } = await adminFetch<FragmentImageRef>(
    `/api/xiqi/media?scope=${encodeURIComponent(scope)}`,
    { method: 'POST', body: form },
  )
  return data
}

export async function saveFragmentImportFile(
  payload: SaveFragmentImportPayload,
): Promise<SaveFragmentImportResult> {
  const { data } = await adminFetch<SaveFragmentImportResult>('/api/fragments/import-file', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export async function saveXiqiPageImportFile(
  payload: SaveXiqiPageImportPayload,
): Promise<SaveXiqiPageImportResult> {
  const { data } = await adminFetch<SaveXiqiPageImportResult>('/api/xiqi/pages/import-file', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}
