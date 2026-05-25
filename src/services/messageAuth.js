function apiUrl(path) {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const p = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base.replace(/\/$/, '')}${p}` : p;
}
async function authFetch(path, init) {
    const res = await fetch(apiUrl(path), {
        ...init,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            ...(init?.headers ?? {}),
        },
    });
    const body = (await res.json());
    if (!res.ok || body.code !== 0) {
        throw new Error(body.message || `API ${res.status}`);
    }
    return body.data;
}
export async function fetchMessageAuthProviders() {
    return authFetch('/api/auth/providers');
}
export async function fetchMessageAuthUser() {
    const data = await authFetch('/api/auth/me');
    return data ?? null;
}
export function startMessageOAuth(provider, returnTo = '/messages') {
    const q = new URLSearchParams({ return_to: returnTo });
    window.location.href = apiUrl(`/api/auth/${provider}?${q.toString()}`);
}
export async function logoutMessageAuth() {
    await authFetch('/api/auth/logout', { method: 'POST' });
}
