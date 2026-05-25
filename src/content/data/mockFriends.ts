export type FriendLink = {
  id: string
  name: string
  url: string
  description: string
  /** 可选；未填时由站点 URL 解析 favicon */
  avatar?: string
  /** 卡片背景；未填时与 avatar 相同 */
  cover?: string
  tags?: string[]
}

export type SpecialLink = {
  id: string
  title: string
  description: string
  url: string
  /** 可选；未填时从 url 解析 favicon */
  avatar?: string
  /** 内置圆角矩形图标，优先于 avatar */
  icon?: 'travellings' | 'acg-trip'
}

export const MOCK_FRIEND_LINKS: FriendLink[] = [
  {
    id: 'lvyneko',
    name: 'lvyneko',
    url: 'https://lvyovo-wiki.tech/',
    description: 'happy coding',
    tags: ['blog'],
  },
  {
    id: 'eric-terminal',
    name: 'Eric-Terminal',
    url: 'https://blog.ericterminal.com/',
    description: '记录折腾与思考的个人博客',
    tags: ['blog'],
  },
  {
    id: 'monika',
    name: '七色的遥望之乡',
    url: 'https://blog.monika.monster/',
    description: 'Monika 的个人博客',
    tags: ['blog'],
  },
  {
    id: 'qingmao',
    name: '晴猫的博客',
    url: 'https://blog.bbleae.cn/',
    description: '嗨，靓仔，今天也要有个好心情哦！',
    tags: ['blog'],
  },
  {
    id: 'snow',
    name: '拾雪的博客',
    url: 'https://www.snowywar.top/',
    description: '记录胡言乱语与胡乱折腾，欢迎大家来玩',
    tags: ['blog'],
  },
  {
    id: 'canvas',
    name: 'Canvas World',
    url: 'https://example.com/canvas',
    description: 'The world is your canvas!',
    tags: ['dev'],
  },
]

export const MOCK_SPECIAL_LINKS: SpecialLink[] = [
  {
    id: 'acg-trip',
    title: '异次元之旅',
    description: '我们一起去萌站成员的星球旅行吧！',
    url: 'https://travel.moe/go.html?travel=on',
    icon: 'acg-trip',
  },
  {
    id: 'travellings',
    title: '开往',
    description: '随机前往开往的成员博客',
    url: 'https://www.travellings.cn/go.html',
    icon: 'travellings',
  },
]
