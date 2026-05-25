import { SITE_NAME, defaultOgImageUrl, siteHomeUrl } from '@/config/site'

/** 友链申请页展示的「本站信息」，供对方互链时复制 */
export type FriendsApplySiteProfile = {
  title: string
  url: string
  /** 绝对 URL；当前为 public/favicon.jpg，后续可改为媒体 API 或 CDN */
  logo: string
}

export function getFriendsApplySiteProfile(): FriendsApplySiteProfile {
  return {
    title: SITE_NAME,
    url: siteHomeUrl(),
    logo: defaultOgImageUrl(),
  }
}
