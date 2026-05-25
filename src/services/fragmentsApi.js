function apiUrl(path) {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const p = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base.replace(/\/$/, '')}${p}` : p;
}
async function fragmentsFetch(path, init) {
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
export async function fetchFragments(params) {
    const q = new URLSearchParams();
    if (params?.mood && params.mood !== 'all')
        q.set('mood', params.mood);
    if (params?.sort)
        q.set('sort', params.sort);
    if (params?.page)
        q.set('page', String(params.page));
    if (params?.size)
        q.set('size', String(params.size));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return fragmentsFetch(`/api/fragments${suffix}`);
}
export async function fetchFragmentDetail(publicId) {
    return fragmentsFetch(`/api/fragments/${encodeURIComponent(publicId)}`);
}
export async function fetchXiqiPageConfig(page) {
    return fragmentsFetch(`/api/xiqi/pages/${encodeURIComponent(page)}`);
}
