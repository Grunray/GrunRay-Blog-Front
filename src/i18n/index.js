import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import zh from './locales/zh.json';
const STORAGE_LOCALE = 'ui.locale';
function readLocale() {
    const v = localStorage.getItem(STORAGE_LOCALE);
    if (v === 'zh' || v === 'en')
        return v;
    return 'zh';
}
export const i18n = createI18n({
    legacy: false,
    locale: readLocale(),
    fallbackLocale: 'en',
    globalInjection: true,
    messages: {
        zh,
        en,
    },
});
export function persistLocale(locale) {
    localStorage.setItem(STORAGE_LOCALE, locale);
    i18n.global.locale.value = locale;
}
