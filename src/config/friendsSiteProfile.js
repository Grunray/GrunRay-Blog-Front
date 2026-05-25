import { SITE_NAME, defaultOgImageUrl, siteHomeUrl } from '@/config/site';
export function getFriendsApplySiteProfile() {
    return {
        title: SITE_NAME,
        url: siteHomeUrl(),
        logo: defaultOgImageUrl(),
    };
}
