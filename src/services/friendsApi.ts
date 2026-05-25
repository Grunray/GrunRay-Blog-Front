import type { FriendLink, SpecialLink } from '@/content/data/mockFriends'
import { MOCK_FRIEND_LINKS, MOCK_SPECIAL_LINKS } from '@/content/data/mockFriends'
import { getFriendsApplySiteProfile } from '@/config/friendsSiteProfile'

export interface FriendsSiteProfile {
  title: string
  url: string
  logo: string
  description: string
}

export interface FriendCaptcha {
  captchaId: string
  question: string
}

export interface FriendListResult {
  items: FriendLink[]
  total: number
  page: number
  size: number
}

export interface FriendApplicationPayload {
  siteName: string
  siteUrl: string
  avatarUrl?: string
  description: string
  contactEmail: string
  captchaId: string
  captchaAnswer: string
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

async function friendsFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

async function friendsFetchWithMessage<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; message: string }> {
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
  return { data: body.data, message: body.message ?? '' }
}

export async function fetchFriendLinks(): Promise<FriendLink[]> {
  try {
    const data = await friendsFetch<FriendListResult>('/api/friends')
    return data.items
  } catch {
    return [...MOCK_FRIEND_LINKS]
  }
}

export async function fetchSpecialLinks(): Promise<SpecialLink[]> {
  try {
    const data = await friendsFetch<{ items: SpecialLink[] }>('/api/friends/special')
    return data.items
  } catch {
    return [...MOCK_SPECIAL_LINKS]
  }
}

export async function fetchFriendsSiteProfile(): Promise<FriendsSiteProfile> {
  try {
    return await friendsFetch<FriendsSiteProfile>('/api/friends/site-profile')
  } catch {
    const local = getFriendsApplySiteProfile()
    return {
      title: local.title,
      url: local.url,
      logo: local.logo,
      description: '',
    }
  }
}

export async function fetchFriendCaptcha(): Promise<FriendCaptcha> {
  return friendsFetch<FriendCaptcha>('/api/friends/captcha')
}

export async function submitFriendApplication(
  payload: FriendApplicationPayload,
): Promise<string> {
  const { message } = await friendsFetchWithMessage<{ publicId?: string } | null>(
    '/api/friends/applications',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
  return message
}
