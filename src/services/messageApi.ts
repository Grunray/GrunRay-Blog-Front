import type { AdminGuestMessage, GuestMessage } from '@/content/data/mockMessages'
import { isStaticSite } from '@/config/staticSite'
import { loadStaticSiteBundle } from '@/services/static/staticSiteData'

const STATIC_WRITE_MSG = '静态站不支持留言与审核，请在完整版站点操作'

export type ModerationAction = 'approve' | 'reject' | 'hide' | 'restore'

export interface MessageCaptcha {
  captchaId: string
  question: string
}

export interface MessageListResult {
  items: GuestMessage[]
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

async function messageFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
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

export async function fetchMessageCaptcha(): Promise<MessageCaptcha> {
  if (isStaticSite) throw new Error(STATIC_WRITE_MSG)
  return messageFetch<MessageCaptcha>('/api/messages/captcha')
}

export async function fetchMessages(params: {
  sort?: 'newest' | 'oldest'
  page?: number
  size?: number
}): Promise<MessageListResult> {
  if (isStaticSite) {
    const bundle = await loadStaticSiteBundle()
    let items = [...bundle.messages.items]
    const sort = params.sort ?? 'newest'
    items.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime()
      const tb = new Date(b.createdAt).getTime()
      return sort === 'oldest' ? ta - tb : tb - ta
    })
    const page = params.page ?? 1
    const size = params.size ?? 20
    const start = (page - 1) * size
    return {
      items: items.slice(start, start + size),
      total: items.length,
      page,
      size,
    }
  }
  const q = new URLSearchParams()
  if (params.sort) q.set('sort', params.sort)
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  const qs = q.toString()
  return messageFetch<MessageListResult>(`/api/messages${qs ? `?${qs}` : ''}`)
}

export async function createMessage(payload: {
  content: string
  captchaId: string
  captchaAnswer: string
}): Promise<GuestMessage | null> {
  if (isStaticSite) throw new Error(STATIC_WRITE_MSG)
  return messageFetch<GuestMessage | null>('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function createOwnerReply(
  publicId: string,
  payload: { content: string },
): Promise<GuestMessage> {
  if (isStaticSite) throw new Error(STATIC_WRITE_MSG)
  return messageFetch<GuestMessage>(`/api/messages/${encodeURIComponent(publicId)}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function fetchAdminMessages(params: {
  status?: 'pending' | 'published' | 'hidden' | 'rejected'
  sort?: 'newest' | 'oldest'
  page?: number
  size?: number
}): Promise<MessageListResult & { items: AdminGuestMessage[] }> {
  if (isStaticSite) throw new Error(STATIC_WRITE_MSG)
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.sort) q.set('sort', params.sort)
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  const qs = q.toString()
  return messageFetch<MessageListResult & { items: AdminGuestMessage[] }>(
    `/api/messages/admin${qs ? `?${qs}` : ''}`,
  )
}

export async function moderateMessage(
  publicId: string,
  action: ModerationAction,
): Promise<AdminGuestMessage> {
  if (isStaticSite) throw new Error(STATIC_WRITE_MSG)
  return messageFetch<AdminGuestMessage>(
    `/api/messages/admin/${encodeURIComponent(publicId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    },
  )
}
