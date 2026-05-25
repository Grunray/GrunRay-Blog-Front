export type FragmentMood = 'rant' | 'sketch' | 'flash' | 'daily'

export interface Fragment {
  id: string
  content: string
  mood: FragmentMood
  createdAt: string
  imageUrl?: string
  imageAlt?: string
}

/** 前端占位数据；接入 API 后替换 */
export const MOCK_FRAGMENTS: Fragment[] = [
  {
    id: 'f1',
    mood: 'rant',
    createdAt: '2026-05-22T23:18:00',
    content:
      '实习简历又石沉大海。算了，至少今晚把那个拖了三天的边界条件 bug 修掉了——算半赢吧。',
  },
  {
    id: 'f2',
    mood: 'flash',
    createdAt: '2026-05-20T08:42:00',
    content: '咖啡凉了，代码没凉。',
  },
  {
    id: 'f3',
    mood: 'sketch',
    createdAt: '2026-05-18T15:05:00',
    content:
      '想把导航栏做成「栖息」的感觉：鼠标不碰时只露图标，碰了才展开。像鸟巢边缘探出头的小鸟——还在想边界判定怎么不抖。',
  },
  {
    id: 'f4',
    mood: 'daily',
    createdAt: '2026-05-15T21:30:00',
    content: '雨停之后操场味道很好。走了一圈，脑子终于从递归里出来了。',
    imageUrl: 'https://apos-dt.github.io/AposBlog/avatar.jpg',
    imageAlt: '夜空与星点',
  },
  {
    id: 'f5',
    mood: 'rant',
    createdAt: '2026-05-12T12:08:00',
    content: '谁把 package-lock 又提交了冲突版本？合并五分钟，修依赖半小时。我谢谢你。',
  },
  {
    id: 'f6',
    mood: 'sketch',
    createdAt: '2026-05-08T19:22:00',
    content: '碎念页大概就长这样：上面一句人话，下面一串不成熟的想法。成熟了我再去写博客。',
  },
  {
    id: 'f7',
    mood: 'daily',
    createdAt: '2026-05-03T07:55:00',
    content: '早起失败。但把 TODO 里「碎念」三个字划掉了——用实现来划掉也算数。',
  },
]
