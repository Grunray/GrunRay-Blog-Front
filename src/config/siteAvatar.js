/** 站点头像：优先首页同款照片（直链，无需 list API）；加载失败回退静态 favicon.svg */
const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
export const SITE_AVATAR_PHOTO_URL = '/api/media/files/film/homeView/center/avatar/touxiang.jpg';
export const SITE_AVATAR_FALLBACK_URL = `${base}favicon.svg`;
