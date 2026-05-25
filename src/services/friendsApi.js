import { MOCK_FRIEND_LINKS, MOCK_SPECIAL_LINKS } from '@/content/data/mockFriends';
import { getFriendsApplySiteProfile } from '@/config/friendsSiteProfile';
function apiUrl(path) {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const p = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base.replace(/\/$/, '')}${p}` : p;
}
async function friendsFetch(path, init) {
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
async function friendsFetchWithMessage(path, init) {
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
    return { data: body.data, message: body.message ?? '' };
}
export async function fetchFriendLinks() {
    try {
        const data = await friendsFetch('/api/friends');
        return data.items;
    }
    catch {
        return [...MOCK_FRIEND_LINKS];
    }
}
export async function fetchSpecialLinks() {
    try {
        const data = await friendsFetch('/api/friends/special');
        return data.items;
    }
    catch {
        return [...MOCK_SPECIAL_LINKS];
    }
}
export async function fetchFriendsSiteProfile() {
    try {
        return await friendsFetch('/api/friends/site-profile');
    }
    catch {
        const local = getFriendsApplySiteProfile();
        return {
            title: local.title,
            url: local.url,
            logo: local.logo,
            description: '',
        };
    }
}
export async function fetchFriendCaptcha() {
    return friendsFetch('/api/friends/captcha');
}
export async function submitFriendApplication(payload) {
    const { message } = await friendsFetchWithMessage('/api/friends/applications', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return message;
}
