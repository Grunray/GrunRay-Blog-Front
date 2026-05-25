import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    appMainLayout?: 'full-viewport'
    /** 完整 `/api/media/files/...` 路径；优先于 `PAGE_PHOTO_BG_BY_ROUTE_NAME` */
    photoBackgroundImage?: string
  }
}
