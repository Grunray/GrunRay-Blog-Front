/**
 * 内容访问层：开发走 Flask API；静态站（VITE_STATIC_SITE）读 public/static/site.json。
 */
import { apiGet } from '@/api/http'
import { isStaticSite } from '@/config/staticSite'
import { loadStaticSiteBundle } from '@/services/static/staticSiteData'
import type { BlogCategoryFilter, Post, Project, ProjectNote, ProjectStatus } from '@/types/content'

let projectsCache: Project[] = []
let postsBySlugCache: Record<string, Post> | null = null
let postsListCache: Post[] | null = null
let projectsLoaded = false
let projectsLoadingPromise: Promise<Project[]> | null = null

function byId<T extends { id: string }>(list: T[], id: string): T | undefined {
  return list.find((x) => x.id === id)
}

async function ensureStaticPosts(): Promise<void> {
  if (postsBySlugCache) return
  const bundle = await loadStaticSiteBundle()
  postsBySlugCache = bundle.postsBySlug
  postsListCache = bundle.posts
}

export async function ensureProjectsLoaded(force = false): Promise<Project[]> {
  if (!force && projectsLoaded) return projectsCache
  if (!force && projectsLoadingPromise) return projectsLoadingPromise

  projectsLoadingPromise = (async () => {
    if (isStaticSite) {
      const bundle = await loadStaticSiteBundle()
      projectsCache = bundle.projects ?? []
    } else {
      const q = new URLSearchParams({ include_archived: 'true' })
      const data = await apiGet<{ projects: Project[] }>(`/api/projects?${q.toString()}`)
      projectsCache = data.projects ?? []
    }
    projectsLoaded = true
    return projectsCache
  })()

  try {
    return await projectsLoadingPromise
  } finally {
    projectsLoadingPromise = null
  }
}

/** 规范：置顶优先 → pinned_order 升序（缺省视为大）→ published_at 降序 */
export function sortPosts<T extends Pick<Post, 'pinned' | 'pinned_order' | 'published_at'>>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ap = a.pinned ? 1 : 0
    const bp = b.pinned ? 1 : 0
    if (ap !== bp) return bp - ap
    if (ap === 1) {
      const ao = a.pinned_order ?? 9999
      const bo = b.pinned_order ?? 9999
      if (ao !== bo) return ao - bo
    }
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })
}

export function getProjectById(id: string): Project | undefined {
  return byId(projectsCache, id)
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projectsCache.find((p) => p.slug === slug)
}

/** 公共列表：不含 hidden */
export function listProjectsPublic(options?: { includeArchived?: boolean }): Project[] {
  const includeArchived = options?.includeArchived ?? true
  return projectsCache.filter((p) => {
    if (p.status === 'hidden') return false
    if (!includeArchived && p.status === 'archived') return false
    return true
  })
}

export function listFeaturedProjects(): Project[] {
  return listProjectsPublic({ includeArchived: false }).filter((p) => p.featured)
}

/** 详情是否可访问：hidden 不可 */
export function canAccessProjectPublic(project: Project): boolean {
  return project.status !== 'hidden'
}

function projectStatusForNote(projectId: string): ProjectStatus | undefined {
  return getProjectById(projectId)?.status
}

const BLOG_CATEGORY_TO_ID: Record<Exclude<BlogCategoryFilter, 'all'>, number> = {
  misc: 1,
  project: 2,
  algorithm: 3,
}

export interface BlogPostQueryOptions {
  category?: BlogCategoryFilter
  tag?: string
  keyword?: string
}

function filterPostsForBlog(posts: Post[], options?: BlogPostQueryOptions): Post[] {
  const category = options?.category ?? 'all'
  let visible = posts.filter((post) => {
    if (post.type === 'algorithm' || post.type === 'article') return true
    const st = projectStatusForNote((post as ProjectNote).project_id)
    return st !== undefined && st !== 'hidden'
  })
  if (category !== 'all') {
    const cid = BLOG_CATEGORY_TO_ID[category]
    visible = visible.filter((p) => p.category_id === cid)
  }
  const tag = options?.tag?.trim()
  const keyword = options?.keyword?.trim().toLowerCase()
  return visible.filter((post) => {
    if (tag && !post.tags.includes(tag)) return false
    if (!keyword) return true
    const haystack = `${post.title} ${post.summary} ${post.tags.join(' ')}`.toLowerCase()
    return haystack.includes(keyword)
  })
}

/** 博客聚合：算法与普通文章全部展示；项目笔记需所属项目非 hidden */
export async function listPostsForBlog(options?: BlogPostQueryOptions): Promise<Post[]> {
  await ensureProjectsLoaded()
  if (isStaticSite) {
    await ensureStaticPosts()
    return sortPosts(filterPostsForBlog(postsListCache ?? [], options))
  }
  const q = new URLSearchParams()
  const category = options?.category ?? 'all'
  if (category !== 'all') {
    q.set('category_id', String(BLOG_CATEGORY_TO_ID[category]))
  }
  const endpoint = q.size ? `/api/posts?${q.toString()}` : '/api/posts'
  const { posts } = await apiGet<{ posts: Post[] }>(endpoint)
  return sortPosts(filterPostsForBlog(posts, options))
}

export async function listAlgorithmPosts(): Promise<Post[]> {
  return listPostsForBlog({ category: 'algorithm' })
}

export async function listPostsForProjectSlug(projectSlug: string): Promise<Post[]> {
  await ensureProjectsLoaded()
  const project = getProjectBySlug(projectSlug)
  if (!project || !canAccessProjectPublic(project)) return []
  if (isStaticSite) {
    await ensureStaticPosts()
    const notes = (postsListCache ?? []).filter(
      (p) => p.type === 'project_note' && (p as ProjectNote).project_id === project.id,
    )
    return sortPosts(notes as Post[])
  }
  const q = new URLSearchParams({
    type: 'project_note',
    project_id: project.id,
  })
  const { posts } = await apiGet<{ posts: Post[] }>(`/api/posts?${q.toString()}`)
  return sortPosts(posts as Post[])
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  if (isStaticSite) {
    await ensureStaticPosts()
    return postsBySlugCache?.[slug]
  }
  try {
    return await apiGet<Post>(`/api/posts/${encodeURIComponent(slug)}?html=1`)
  } catch (e) {
    const status = (e as Error & { status?: number }).status
    if (status === 404) return undefined
    throw e
  }
}

/** 若笔记所属项目 hidden，则视为不可公开访问 */
export function canAccessPostPublic(post: Post): boolean {
  if (post.type === 'algorithm' || post.type === 'article') return true
  const st = projectStatusForNote((post as ProjectNote).project_id)
  return st !== undefined && st !== 'hidden'
}

export function getRawProjects(): Project[] {
  return projectsCache
}

export async function getRawPosts(): Promise<Post[]> {
  if (isStaticSite) {
    await ensureStaticPosts()
    return postsListCache ?? []
  }
  const { posts } = await apiGet<{ posts: Post[] }>('/api/posts')
  return posts
}
