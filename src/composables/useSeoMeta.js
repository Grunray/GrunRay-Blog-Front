import { useHead } from '@unhead/vue';
import { computed, toValue } from 'vue';
import { useI18n } from 'vue-i18n';
import { SITE_NAME, defaultOgImageUrl, siteHomeUrl, toAbsoluteUrl } from '@/config/site';
const META_DESC_MAX = 165;
function clipMeta(text, max = META_DESC_MAX) {
    const t = text.replace(/\s+/g, ' ').trim();
    if (t.length <= max)
        return t;
    return `${t.slice(0, max - 1)}…`;
}
function pathToCanonicalUrl(path) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return toAbsoluteUrl(p);
}
function toIso8601(input) {
    if (!input)
        return undefined;
    const d = new Date(input.includes('T') ? input : `${input}T12:00:00`);
    if (Number.isNaN(d.getTime()))
        return undefined;
    return d.toISOString();
}
function pruneJsonLd(obj) {
    if (obj === null || obj === undefined)
        return undefined;
    if (Array.isArray(obj)) {
        const arr = obj.map(pruneJsonLd).filter((x) => x !== undefined);
        return arr.length ? arr : undefined;
    }
    if (typeof obj === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            const p = pruneJsonLd(v);
            if (p !== undefined)
                out[k] = p;
        }
        return Object.keys(out).length ? out : undefined;
    }
    return obj;
}
function buildJsonLd(payload) {
    const home = siteHomeUrl();
    const websiteId = `${home}#website`;
    const author = {
        '@type': 'Person',
        name: SITE_NAME,
        url: home,
    };
    const mainEntity = payload.type === 'article'
        ? {
            '@type': payload.schemaArticleType,
            '@id': `${payload.url}#primary`,
            ...(payload.schemaArticleType === 'CreativeWork'
                ? { name: payload.title }
                : { headline: payload.title }),
            description: payload.description,
            url: payload.url,
            image: [payload.image],
            datePublished: toIso8601(payload.publishedTime),
            dateModified: toIso8601(payload.modifiedTime ?? payload.publishedTime),
            author,
            publisher: { '@type': 'Organization', name: SITE_NAME, url: home },
            mainEntityOfPage: { '@type': 'WebPage', '@id': payload.url },
            isPartOf: { '@id': websiteId },
        }
        : {
            '@type': 'WebPage',
            '@id': payload.url,
            url: payload.url,
            name: payload.title,
            description: payload.description,
            isPartOf: { '@id': websiteId },
        };
    const graph = pruneJsonLd({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                '@id': websiteId,
                name: SITE_NAME,
                url: home,
                publisher: { '@type': 'Organization', name: SITE_NAME },
            },
            mainEntity,
        ],
    });
    return graph;
}
/**
 * 根据当前页数据写入 title、description、OG、Twitter、canonical 与 JSON-LD。
 * 在组件 setup 中调用，传入 `computed` / getter，随路由与异步数据更新。
 */
export function useSeoMeta(payload) {
    const { locale } = useI18n();
    const ogLocale = computed(() => (locale.value === 'zh' ? 'zh_CN' : 'en_US'));
    const resolved = computed(() => {
        const p = toValue(payload);
        const url = pathToCanonicalUrl(p.path);
        const image = p.image ? toAbsoluteUrl(p.image) : defaultOgImageUrl();
        const description = clipMeta(p.description);
        const type = p.type ?? 'website';
        return {
            ...p,
            description,
            url,
            image,
            ogType: type === 'article' ? 'article' : 'website',
            ogLocale: ogLocale.value,
        };
    });
    useHead(computed(() => {
        const r = resolved.value;
        const schemaArticleType = r.path.startsWith('/projects/')
            ? 'CreativeWork'
            : 'BlogPosting';
        const jsonLd = buildJsonLd({
            url: r.url,
            title: r.title,
            description: r.description,
            image: r.image,
            type: r.type ?? 'website',
            publishedTime: r.publishedTime,
            modifiedTime: r.modifiedTime,
            schemaArticleType,
        });
        const meta = [
            { name: 'description', content: r.description },
            { property: 'og:title', content: r.title },
            { property: 'og:description', content: r.description },
            { property: 'og:url', content: r.url },
            { property: 'og:image', content: r.image },
            { property: 'og:type', content: r.ogType },
            { property: 'og:site_name', content: SITE_NAME },
            { property: 'og:locale', content: r.ogLocale },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: r.title },
            { name: 'twitter:description', content: r.description },
            { name: 'twitter:image', content: r.image },
        ];
        if (r.robots)
            meta.push({ name: 'robots', content: r.robots });
        if (r.type === 'article' && r.publishedTime) {
            const pub = toIso8601(r.publishedTime);
            const mod = toIso8601(r.modifiedTime ?? r.publishedTime);
            if (pub)
                meta.push({ property: 'article:published_time', content: pub });
            if (mod)
                meta.push({ property: 'article:modified_time', content: mod });
        }
        return {
            title: r.title,
            meta,
            link: [{ rel: 'canonical', href: r.url }],
            script: [
                {
                    type: 'application/ld+json',
                    key: 'wiki-jsonld-main',
                    textContent: jsonLd,
                },
            ],
        };
    }));
}
