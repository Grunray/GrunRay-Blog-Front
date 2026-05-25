export interface MessageAuthUser {
  guest_user_id?: number
  provider: 'github' | 'google'
  id: string
  login: string
  name: string
  email?: string | null
  avatar_url?: string | null
  profile_url?: string | null
  isSiteOwner?: boolean
}

export interface MessageAuthProviders {
  github: boolean
  google: boolean
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

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new Error(body.message || `API ${res.status}`)
  }
  return body.data
}

export async function fetchMessageAuthProviders(): Promise<MessageAuthProviders> {
  return authFetch<MessageAuthProviders>('/api/auth/providers')
}

export async function fetchMessageAuthUser(): Promise<MessageAuthUser | null> {
  const data = await authFetch<MessageAuthUser | null>('/api/auth/me')
  return data ?? null
}

export function startMessageOAuth(provider: 'github' | 'google', returnTo = '/messages'): void {
  const q = new URLSearchParams({ return_to: returnTo })
  window.location.href = apiUrl(`/api/auth/${provider}?${q.toString()}`)
}

export async function logoutMessageAuth(): Promise<void> {
  await authFetch<boolean>('/api/auth/logout', { method: 'POST' })
}
