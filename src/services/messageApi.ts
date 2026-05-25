import type { AdminGuestMessage, GuestMessage } from '@/content/data/mockMessages'

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
  return messageFetch<MessageCaptcha>('/api/messages/captcha')
}

export async function fetchMessages(params: {
  sort?: 'newest' | 'oldest'
  page?: number
  size?: number
}): Promise<MessageListResult> {
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
  return messageFetch<AdminGuestMessage>(
    `/api/messages/admin/${encodeURIComponent(publicId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    },
  )
}
