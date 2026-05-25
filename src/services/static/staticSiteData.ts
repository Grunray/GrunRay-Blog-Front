import siteBundleJson from '@/data/site.bundle.json'
import type { AboutProfile } from '@/content/data/aboutResume'
import type { FriendLink, SpecialLink } from '@/content/data/mockFriends'
import type { GuestMessage } from '@/content/data/mockMessages'
import type { FragmentDetail, FragmentListResult, XiqiPageConfig } from '@/services/fragmentsApi'
import type { RecommendDetail, RecommendListResult } from '@/services/recommendApi'
import { isStaticSite } from '@/config/staticSite'
import { resolvePublicUrlsDeep } from '@/utils/resolvePublicUrl'
import type { Post, Project } from '@/types/content'

export interface StaticHomeData {
  avatarUrl: string | null
  latestUpdatedPosts: Post[]
  randomRecommendedPost: Post | null
}

export interface StaticFriendsData {
  links: FriendLink[]
  special: SpecialLink[]
  siteProfile: {
    title: string
    url: string
    logo: string
    description: string
  }
}

export interface StaticXiqiData {
  fragments: FragmentListResult
  fragmentDetails: Record<string, FragmentDetail>
  recommendations: RecommendListResult
  recommendDetails: Record<string, RecommendDetail>
  xiqiPages: Record<string, XiqiPageConfig>
  about: AboutProfile | null
}

export interface StaticSiteBundle {
  manifest: { generated_at: string; source: string }
  projects: Project[]
  posts: Post[]
  postsBySlug: Record<string, Post>
  home: StaticHomeData
  filmfeed: Array<{
    id: number
    url: string
    type: string
    title?: string
    article_id?: number
    tags: string[]
    created_at: string
  }>
  musicTracks: Array<{
    id: number
    url: string
    title?: string
    artist?: string
    duration_sec?: number
    post_id?: number
    tags: string[]
    sort_order: number
    created_at: string
    updated_at: string
  }>
  xiqi: StaticXiqiData
  friends: StaticFriendsData
  messages: {
    items: GuestMessage[]
    total: number
    page: number
    size: number
  }
}

let cached: StaticSiteBundle | null = null
let loading: Promise<StaticSiteBundle> | null = null

function bundleFromBuild(): StaticSiteBundle {
  return resolvePublicUrlsDeep(siteBundleJson as unknown as StaticSiteBundle)
}

export async function loadStaticSiteBundle(): Promise<StaticSiteBundle> {
  if (cached) return cached
  if (!loading) {
    loading = (async () => {
      if (isStaticSite) {
        cached = bundleFromBuild()
        return cached
      }
      const base = import.meta.env.BASE_URL || '/'
      const res = await fetch(`${base}static/site.json`)
      if (!res.ok) {
        throw new Error(`static site.json ${res.status}`)
      }
      const raw = (await res.json()) as StaticSiteBundle
      cached = resolvePublicUrlsDeep(raw)
      return cached
    })()
  }
  try {
    return await loading
  } finally {
    loading = null
  }
}

export function clearStaticSiteCache(): void {
  cached = null
}
