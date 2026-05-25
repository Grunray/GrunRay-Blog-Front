/**
 * 内容访问层：文章与项目均走 Flask API。
 */
import { apiGet } from '@/api/http';
let projectsCache = [];
let projectsLoaded = false;
let projectsLoadingPromise = null;
function byId(list, id) {
    return list.find((x) => x.id === id);
}
export async function ensureProjectsLoaded(force = false) {
    if (!force && projectsLoaded)
        return projectsCache;
    if (!force && projectsLoadingPromise)
        return projectsLoadingPromise;
    projectsLoadingPromise = (async () => {
        const q = new URLSearchParams({ include_archived: 'true' });
        const data = await apiGet(`/api/projects?${q.toString()}`);
        projectsCache = data.projects ?? [];
        projectsLoaded = true;
        return projectsCache;
    })();
    try {
        return await projectsLoadingPromise;
    }
    finally {
        projectsLoadingPromise = null;
    }
}
/** 规范：置顶优先 → pinned_order 升序（缺省视为大）→ published_at 降序 */
export function sortPosts(list) {
    return [...list].sort((a, b) => {
        const ap = a.pinned ? 1 : 0;
        const bp = b.pinned ? 1 : 0;
        if (ap !== bp)
            return bp - ap;
        if (ap === 1) {
            const ao = a.pinned_order ?? 9999;
            const bo = b.pinned_order ?? 9999;
            if (ao !== bo)
                return ao - bo;
        }
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
}
export function getProjectById(id) {
    return byId(projectsCache, id);
}
export function getProjectBySlug(slug) {
    return projectsCache.find((p) => p.slug === slug);
}
/** 公共列表：不含 hidden */
export function listProjectsPublic(options) {
    const includeArchived = options?.includeArchived ?? true;
    return projectsCache.filter((p) => {
        if (p.status === 'hidden')
            return false;
        if (!includeArchived && p.status === 'archived')
            return false;
        return true;
    });
}
export function listFeaturedProjects() {
    return listProjectsPublic({ includeArchived: false }).filter((p) => p.featured);
}
/** 详情是否可访问：hidden 不可 */
export function canAccessProjectPublic(project) {
    return project.status !== 'hidden';
}
function projectStatusForNote(projectId) {
    return getProjectById(projectId)?.status;
}
const BLOG_CATEGORY_TO_ID = {
    misc: 1,
    project: 2,
    algorithm: 3,
};
/** 博客聚合：算法与普通文章全部展示；项目笔记需所属项目非 hidden */
export async function listPostsForBlog(options) {
    await ensureProjectsLoaded();
    const q = new URLSearchParams();
    const category = options?.category ?? 'all';
    if (category !== 'all') {
        q.set('category_id', String(BLOG_CATEGORY_TO_ID[category]));
    }
    const endpoint = q.size ? `/api/posts?${q.toString()}` : '/api/posts';
    const { posts } = await apiGet(endpoint);
    const visible = posts.filter((post) => {
        if (post.type === 'algorithm' || post.type === 'article')
            return true;
        const st = projectStatusForNote(post.project_id);
        return st !== undefined && st !== 'hidden';
    });
    const tag = options?.tag?.trim();
    const keyword = options?.keyword?.trim().toLowerCase();
    const filtered = visible.filter((post) => {
        if (tag && !post.tags.includes(tag))
            return false;
        if (!keyword)
            return true;
        const haystack = `${post.title} ${post.summary} ${post.tags.join(' ')}`.toLowerCase();
        return haystack.includes(keyword);
    });
    return sortPosts(filtered);
}
export async function listAlgorithmPosts() {
    return listPostsForBlog({ category: 'algorithm' });
}
export async function listPostsForProjectSlug(projectSlug) {
    await ensureProjectsLoaded();
    const project = getProjectBySlug(projectSlug);
    if (!project || !canAccessProjectPublic(project))
        return [];
    const q = new URLSearchParams({
        type: 'project_note',
        project_id: project.id,
    });
    const { posts } = await apiGet(`/api/posts?${q.toString()}`);
    return sortPosts(posts);
}
export async function getPostBySlug(slug) {
    try {
        return await apiGet(`/api/posts/${encodeURIComponent(slug)}?html=1`);
    }
    catch (e) {
        const status = e.status;
        if (status === 404)
            return undefined;
        throw e;
    }
}
/** 若笔记所属项目 hidden，则视为不可公开访问 */
export function canAccessPostPublic(post) {
    if (post.type === 'algorithm' || post.type === 'article')
        return true;
    const st = projectStatusForNote(post.project_id);
    return st !== undefined && st !== 'hidden';
}
export function getRawProjects() {
    return projectsCache;
}
export async function getRawPosts() {
    const { posts } = await apiGet('/api/posts');
    return posts;
}
