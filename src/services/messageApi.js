function apiUrl(path) {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const p = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base.replace(/\/$/, '')}${p}` : p;
}
async function messageFetch(path, init) {
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
        const err = new Error(body.message || `API ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return body.data;
}
export async function fetchMessageCaptcha() {
    return messageFetch('/api/messages/captcha');
}
export async function fetchMessages(params) {
    const q = new URLSearchParams();
    if (params.sort)
        q.set('sort', params.sort);
    if (params.page)
        q.set('page', String(params.page));
    if (params.size)
        q.set('size', String(params.size));
    const qs = q.toString();
    return messageFetch(`/api/messages${qs ? `?${qs}` : ''}`);
}
export async function createMessage(payload) {
    return messageFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}
export async function createOwnerReply(publicId, payload) {
    return messageFetch(`/api/messages/${encodeURIComponent(publicId)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}
export async function fetchAdminMessages(params) {
    const q = new URLSearchParams();
    if (params.status)
        q.set('status', params.status);
    if (params.sort)
        q.set('sort', params.sort);
    if (params.page)
        q.set('page', String(params.page));
    if (params.size)
        q.set('size', String(params.size));
    const qs = q.toString();
    return messageFetch(`/api/messages/admin${qs ? `?${qs}` : ''}`);
}
export async function moderateMessage(publicId, action) {
    return messageFetch(`/api/messages/admin/${encodeURIComponent(publicId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
    });
}
