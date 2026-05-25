/** 临时调试：栖息三页 hero 背景图（designed/xiqi_img） */
import aboutHero from '@xiqi_img/关于.jpg'
import fragmentsHero from '@xiqi_img/碎念.jpg'
import recommendHero from '@xiqi_img/推荐.jpg'

export type XiqiPageRouteName = 'fragments' | 'about' | 'recommend'

export const XIQI_HERO_IMAGES: Record<XiqiPageRouteName, string> = {
  fragments: fragmentsHero,
  about: aboutHero,
  recommend: recommendHero,
}

export function resolveXiqiHeroImage(routeName: string | undefined): string | undefined {
  if (!routeName || !(routeName in XIQI_HERO_IMAGES)) return undefined
  return XIQI_HERO_IMAGES[routeName as XiqiPageRouteName]
}
