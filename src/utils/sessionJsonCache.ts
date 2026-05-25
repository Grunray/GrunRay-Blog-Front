/** 同标签页内复用 JSON（如首页 API），减轻重复进入时的请求 */

export function readSessionJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw == null || raw === '') return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeSessionJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 配额或隐私模式 */
  }
}
