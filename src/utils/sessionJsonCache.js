/** 同标签页内复用 JSON（如首页 API），减轻重复进入时的请求 */
export function readSessionJson(key) {
    try {
        const raw = sessionStorage.getItem(key);
        if (raw == null || raw === '')
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function writeSessionJson(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    }
    catch {
        /* 配额或隐私模式 */
    }
}
