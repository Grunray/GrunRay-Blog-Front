/**
 * 关于页履历类型与静态 fallback（API `GET /api/xiqi/about` 不可用时使用）。
 * 权威数据源：`backend/import/xiqi/about/resume.md` → import → content + DB。
 *
 * 隐私字段说明（后续由后端 API 脱敏，前端仅作占位与模糊展示）：
 * - education.schoolRaw → 对外仅 schoolPublic（「某大学」）
 * - education.rankRaw → 不对外展示具体名次
 * - internship.companyRaw → 对外仅 companyPublic（「某有限公司」）
 * - internship.summaryRaw → 正文脱敏/不返回详情
 * - club.nameRaw → 对外仅 namePublic（「某大学 ACM 协会」等）
 *
 * 后端 import / API 约定：需隐藏的片段用标签包裹，由前端解析为 AboutPrivateText：
 *   <xiqi-private label="说明">敏感正文</xiqi-private>
 *   或 <div data-xiqi-private data-label="说明">敏感正文</div>
 * 见 AboutPrivateText.vue 顶部注释。
 */
export const ABOUT_PROFILE = {
    alias: 'GrunRay',
    genderAge: '男 · 21 岁',
    email: 'meachealed@gmail.com',
    intro: '软件工程本科在读，做全栈开发与测试，习惯用 Cursor 等 AI 工具辅助编程。算法与数据结构基础扎实。',
    awards: [
        { id: 'icpc', label: 'ICPC 西安邀请赛 · 铜牌', tier: 'bronze' },
        { id: 'ccpc', label: 'CCPC 郑州邀请赛 · 铜牌', tier: 'bronze' },
        { id: 'ra', label: '睿抗 · 国二', tier: 'silver' },
    ],
    education: {
        schoolPublic: '某大学',
        schoolRaw: '山东科技大学',
        degree: '本科',
        major: '软件工程',
        period: '2023 — 2027',
        rankRaw: '专业排名前 30%',
    },
    internship: {
        companyPublic: '某有限公司',
        companyRaw: '泰安市智控信息科技有限公司',
        role: '全栈工程师',
        period: '2025.07 — 2025.09',
        summaryRaw: '暑假在办公室参与煤矿巷道支护评价系统开发；开学后在校内远程继续迭代与维护。',
    },
    club: {
        namePublic: '某大学 ACM 协会',
        nameRaw: '山东科技大学 ACM 协会',
        role: '会员',
        period: '2023.10 — 至今',
        summaryRaw: '参与组织天梯赛训练等活动。',
    },
    certificates: ['大学英语四级'],
};
