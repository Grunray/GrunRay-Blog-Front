function apiUrl(path) {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const p = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base.replace(/\/$/, '')}${p}` : p;
}
async function recommendFetch(path, init) {
    const res = await fetch(apiUrl(path), {
        ...init,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
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
export async function fetchRecommendations(params) {
    const q = new URLSearchParams();
    if (params?.category && params.category !== 'all')
        q.set('category', params.category);
    if (params?.rating != null)
        q.set('rating', String(params.rating));
    if (params?.sort)
        q.set('sort', params.sort);
    if (params?.page)
        q.set('page', String(params.page));
    if (params?.size)
        q.set('size', String(params.size));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return recommendFetch(`/api/recommendations${suffix}`);
}
export async function fetchRecommendDetail(publicId) {
    return recommendFetch(`/api/recommendations/${encodeURIComponent(publicId)}`);
}
