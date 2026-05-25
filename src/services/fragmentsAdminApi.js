function apiUrl(path) {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const p = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base.replace(/\/$/, '')}${p}` : p;
}
async function adminFetch(path, init) {
    const res = await fetch(apiUrl(path), {
        ...init,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            ...(init?.body instanceof FormData ? {} : init?.body ? { 'Content-Type': 'application/json' } : {}),
            ...(init?.headers ?? {}),
        },
    });
    const body = (await res.json());
    if (!res.ok || body.code !== 0) {
        const err = new Error(body.message || `API ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return { data: body.data, message: body.message || '' };
}
export async function uploadXiqiMedia(scope, file, alt = '') {
    const form = new FormData();
    form.append('file', file);
    if (alt)
        form.append('alt', alt);
    const { data } = await adminFetch(`/api/xiqi/media?scope=${encodeURIComponent(scope)}`, { method: 'POST', body: form });
    return data;
}
export async function saveFragmentImportFile(payload) {
    const { data } = await adminFetch('/api/fragments/import-file', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data;
}
export async function saveXiqiPageImportFile(payload) {
    const { data } = await adminFetch('/api/xiqi/pages/import-file', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data;
}
