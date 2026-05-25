/** 与 `designed/site-design-spec.md` 对齐的内容模型（前端契约，可与后端/Python 生成 JSON 对齐） */

export type ProjectStatus = 'published' | 'archived' | 'hidden'

/** 项目详情页展示块类型：新增类型时在 `project-blocks/registry.ts` 注册组件 */
export type ProjectLayoutBlockType =
  | 'overview'
  | 'demo'
  | 'changelog'
  | 'gallery'
  | 'markdown'

export interface ProjectLayoutBlock {
  type: ProjectLayoutBlockType
  title?: string
  /** 纯文本/Markdown 源（渲染策略可在块组件内演进） */
  body?: string
  demoUrl?: string
  /** gallery：图片 URL 列表 */
  images?: string[]
  meta?: Record<string, unknown>
}

export interface Project {
  id: string
  slug: string
  locale: string
  title: string
  summary: string
  tags: string[]
  status: ProjectStatus
  /** 项目开始时间（YYYY-MM-DD），时间线主排序字段 */
  start_date?: string
  /** 项目结束时间（YYYY-MM-DD） */
  end_date?: string
  /** 外链（例如 GitHub） */
  github_url?: string
  /** 首页精选 */
  featured?: boolean
  year?: number
  /** 详情页块顺序与配置（数据驱动） */
  layout: ProjectLayoutBlock[]
}

export type PostType = 'article' | 'project_note' | 'algorithm'
export type BlogCategoryFilter = 'all' | 'misc' | 'project' | 'algorithm'

export interface PostBase {
  id: string
  slug: string
  locale: string
  title: string
  summary: string
  published_at: string
  updated_at: string
  tags: string[]
  category_id: number
  pinned?: boolean
  pinned_order?: number
  type: PostType
  cover?: string
  /** 正文（Markdown 源，详情页渲染可后续换解析器） */
  body?: string
  /** 服务端渲染后的 HTML（GET /api/posts/:slug?html=1） */
  body_html?: string
}

export interface ArticlePost extends PostBase {
  type: 'article'
}

export interface ProjectNote extends PostBase {
  type: 'project_note'
  project_id: string
  role?: string
  feature_key?: string
}

export interface AlgorithmPost extends PostBase {
  type: 'algorithm'
  difficulty?: string
  oj?: string
  problem_id?: string
  series?: string
}

export type Post = ArticlePost | ProjectNote | AlgorithmPost

export type ThemeId = 'light' | 'dark' | 'abstract'
