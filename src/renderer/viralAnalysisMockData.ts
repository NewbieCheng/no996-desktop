export type ViralAnalysisPlatform = '小红书' | '抖音' | '视频号' | '公众号';

export type ViralAnalysisStatus =
  'pending' | 'extracting' | 'analyzing' | 'completed' | 'extractionFailed' | 'reportFailed';

export interface ViralAnalysisReportSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ViralAnalysisRecord {
  id: string;
  sourceUrl: string;
  sourcePlatform: ViralAnalysisPlatform;
  title: string;
  analyzedAt: string;
  status: ViralAnalysisStatus;
  extractedText: string;
  analysisReport: ViralAnalysisReportSection[] | null;
  recommendedTopic: string;
  recommendedAngle: string;
  suggestedFormat: string;
  topicId?: string;
  usedForReplication: boolean;
}

export const viralAnalysisExtractedText = `【开头】
很多人到了春天，会发现身体状态出现一些变化：早上醒得不够轻松，下午更容易疲惫，原本稳定的生活节奏也开始松动。

【正文】
第一个变化，是睡眠和起床时间更容易被天气影响。第二个变化，是久坐之后身体的紧绷感变得更明显。第三个变化，是大家开始重新关注每天吃什么、怎么动起来。

与其突然改变所有习惯，不如先从每天能做到的小调整开始。比如把下午的一次匆忙，换成一段更有意识的休息；把一份复杂计划，换成今天可以完成的一件小事。

【结尾】
如果你也有类似情况，可以先从这三个小调整开始。轻养护不是给生活增加新的压力，而是让身体和日常重新找到一个更舒服的节奏。`;

export const viralAnalysisReport: ViralAnalysisReportSection[] = [
  {
    id: 'overview',
    title: '一、内容概览',
    paragraphs: [
      '这是一条围绕春季身体状态变化展开的生活方式内容，先从用户熟悉的换季感受切入，再把轻养护落到睡眠、久坐和饮食等具体场景。',
      '内容没有从产品功能开始，而是先帮助用户确认“我是不是也有类似变化”，降低了理解和继续阅读的门槛。',
    ],
  },
  {
    id: 'hook',
    title: '二、爆款开头 / Hook',
    paragraphs: [
      '开头直接描述春季常见的身体感受，用“早上醒得不够轻松”“下午更容易疲惫”等可感知的细节替代抽象判断。',
      '切入方式的关键是先说用户正在经历什么，再引出内容能帮用户看清什么。',
    ],
    bullets: [
      '从换季这一共同时间点开始',
      '用连续三个生活信号制造代入感',
      '不在开头急着解释产品或给出结论',
    ],
  },
  {
    id: 'angle',
    title: '三、核心选题与切入角度',
    paragraphs: [
      '核心选题不是“春季养生知识”，而是“春季身体状态变化的信号”。选题把专业主题翻译成了用户可以自我观察的生活问题。',
      '切入角度保持克制：不制造焦虑，也不承诺快速改变，而是邀请用户从一个具体的小调整开始。',
    ],
  },
  {
    id: 'structure',
    title: '四、内容结构拆解',
    paragraphs: ['整条内容按照“识别变化—拆解信号—给出轻量行动—降低行动压力”的顺序展开。'],
    bullets: [
      '前段：用换季场景建立共鸣',
      '中段：用三个信号让主题变得具体',
      '后段：把建议压缩成今天就能开始的小动作',
      '收尾：强调可持续，而不是一次到位',
    ],
  },
  {
    id: 'rhythm',
    title: '五、关键表达和情绪节奏',
    paragraphs: [
      '表达节奏先快后稳：开头连续抛出三个变化，帮助用户快速确认自己的体验；中段放慢语气，把“改变”重新解释成“调整”；结尾给出低压力的行动邀请。',
      '情绪上没有刻意煽动，而是通过被理解、被允许慢一点的感觉，让用户愿意继续停留。',
    ],
  },
  {
    id: 'pain-points',
    title: '六、用户痛点与利益点',
    paragraphs: [
      '用户痛点是“知道应该调整，但不知道从哪里开始”，以及“担心照顾自己会变成一套新的任务”。',
      '内容提供的利益点不是一个复杂方案，而是一种更轻的判断方式：先识别自己的状态，再选择今天做得到的一步。',
    ],
  },
  {
    id: 'interaction',
    title: '七、互动机制',
    paragraphs: [
      '三个可识别的身体信号天然适合引发用户对号入座和留言分享。后续可以围绕“你最近最明显的是哪一个变化”设计评论引导。',
    ],
  },
  {
    id: 'conversion',
    title: '八、转化机制',
    paragraphs: [
      '转化并不依赖强销售，而是先建立“这件事和我的日常有关”的认知，再把用户带向更具体的轻养护方法和产品使用场景。',
      '如果要承接咨询，应继续保持生活化表达，让用户先描述自己的状态，再进入产品或方案选择。',
    ],
  },
  {
    id: 'replication',
    title: '九、可复刻方向',
    paragraphs: [
      '复刻时保留“共同时间点 + 三个生活信号 + 一个低压力动作”的结构，不直接复制原文句式。',
    ],
  },
];

export const viralAnalysisMockRecords: ViralAnalysisRecord[] = [
  {
    id: 'viral-analysis-0824-01',
    sourceUrl: 'https://www.xiaohongshu.com/explore/fictional-spring-care-0824',
    sourcePlatform: '小红书',
    title: '春季轻养护内容怎么做才容易被收藏',
    analyzedAt: '2026-08-24',
    status: 'completed',
    extractedText: viralAnalysisExtractedText,
    analysisReport: viralAnalysisReport,
    recommendedTopic: '春季身体状态变化的 3 个常见信号',
    recommendedAngle: '从真实生活场景切入，减少泛泛的专业表达',
    suggestedFormat: '图文内容 / 视频脚本',
    topicId: 'topic-viral-analysis-0824-01',
    usedForReplication: false,
  },
  {
    id: 'viral-analysis-0822-01',
    sourceUrl: 'https://www.douyin.com/video/fictional-sedentary-care-0822',
    sourcePlatform: '抖音',
    title: '久坐人群健康管理爆款视频',
    analyzedAt: '2026-08-22',
    status: 'completed',
    extractedText: `【开头】\n坐了一整天之后，身体最先提醒你的，往往不是一个复杂的问题，而是一个很具体的不舒服。\n\n【正文】\n从下午三点的肩颈紧绷，到下班后不想动，久坐人群的调整可以从一个小动作开始。\n\n【结尾】\n先给自己留出三分钟，再决定今天要不要做更多。`,
    analysisReport: viralAnalysisReport,
    recommendedTopic: '办公室人群如何安排日常轻养护',
    recommendedAngle: '从下午三点的真实工作场景切入，让建议更容易执行',
    suggestedFormat: '视频脚本',
    topicId: 'topic-viral-analysis-0822-01',
    usedForReplication: true,
  },
  {
    id: 'viral-analysis-0821-01',
    sourceUrl: 'https://www.xiaohongshu.com/explore/fictional-evening-routine-0821',
    sourcePlatform: '小红书',
    title: '晚餐后的轻松调整，为什么更容易坚持',
    analyzedAt: '2026-08-21',
    status: 'reportFailed',
    extractedText: `【开头】\n真正容易坚持的调整，通常不是最复杂的那一个，而是能放进晚餐之后的那一个。\n\n【正文】\n把一个动作放回已有的生活节奏，才不会让照顾自己变成额外任务。\n\n【结尾】\n今天先试一件小事，看看身体会怎么回应。`,
    analysisReport: null,
    recommendedTopic: '不要一上来改变所有生活习惯',
    recommendedAngle: '从晚餐后的固定动作切入，强调轻量和可持续',
    suggestedFormat: '图文内容',
    usedForReplication: false,
  },
  {
    id: 'viral-analysis-0820-01',
    sourceUrl: 'https://www.douyin.com/video/fictional-reading-limited-0820',
    sourcePlatform: '抖音',
    title: '忙碌生活里的轻养护提醒',
    analyzedAt: '2026-08-20',
    status: 'extractionFailed',
    extractedText: '',
    analysisReport: null,
    recommendedTopic: '忙完一天，晚餐可以从一件小事开始',
    recommendedAngle: '从忙碌生活中的一个停顿切入，减少说教感',
    suggestedFormat: '视频脚本',
    usedForReplication: false,
  },
];
