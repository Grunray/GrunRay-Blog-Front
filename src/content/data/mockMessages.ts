export type MessageProvider = 'github' | 'google'

export interface GuestMessageReply {
  author: string
  avatarUrl?: string | null
  provider?: MessageProvider
  isOwner?: boolean
  content: string
  createdAt?: string
}

export interface GuestMessage {
  id: string
  author: string
  avatarUrl?: string | null
  /** 无头像 URL 时的渐变占位 */
  avatarHue?: number
  provider?: MessageProvider
  profileUrl?: string
  isOwner?: boolean
  content: string
  createdAt: string
  reply?: GuestMessageReply
}

/** 站长审核列表项 */
export interface AdminGuestMessage extends GuestMessage {
  status: number
}

/** 前端占位数据；接入 API 后替换 */
export const MOCK_GUEST_MESSAGES: GuestMessage[] = [
  {
    id: 'm1',
    author: '路过的旅人',
    avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
    provider: 'github',
    profileUrl: 'https://github.com',
    content: '站点的配色很舒服，留言板先占个座～',
    createdAt: '2026-05-12T14:22:00',
    reply: {
      author: 'GrunRay',
      avatarUrl: '/favicon.jpg',
      isOwner: true,
      content: '谢谢来访，后端留言接口还在路上，先欢迎随便聊。',
      createdAt: '2026-05-13T10:00:00',
    },
  },
  {
    id: 'm2',
    author: 'NightOwl',
    avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
    provider: 'github',
    content: '算法文章写得很清楚，尤其是图论那篇。',
    createdAt: '2026-04-28T09:05:00',
  },
  {
    id: 'm3',
    author: '小森林',
    avatarUrl: 'https://www.google.com/favicon.ico',
    provider: 'google',
    profileUrl: 'https://innei.in',
    content: '布局参考了 innei 的 message 页，之后会再细调动效与间距。',
    createdAt: '2026-03-15T20:41:00',
  },
]
