/** 与 Vite 代理 `/api` → Flask 一致；生产可设 VITE_API_BASE_URL */
export async function apiGet(path) {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const p = path.startsWith('/') ? path : `/${path}`;
    const url = base ? `${base.replace(/\/$/, '')}${p}` : p;
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) {
        const err = new Error(`API ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}
