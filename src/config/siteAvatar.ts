import { MEDIA_AVATAR } from '@/config/mediaPaths'
import { resolvePublicUrl } from '@/utils/resolvePublicUrl'

/** 站点头像：与首页照片同源 */
export const SITE_AVATAR_PHOTO_URL = resolvePublicUrl(MEDIA_AVATAR)

const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')

export const SITE_AVATAR_FALLBACK_URL = `${base}favicon.svg`
