export type HomeRoute =
  | '#hotspot-radar'
  | '#viral-analysis'
  | '#topic-pool?focus=pool'
  | '#topic-pool?focus=calendar'
  | '#content-creation'
  | '#content-assets'
  | '#content-review';

export interface WeeklyBrief {
  title: string;
  paragraphs: string[];
  direction: string;
  expression: string;
  basis: Array<{ label: string; route: HomeRoute }>;
  observations: string[];
  judgments: string[];
  recommendations: string[];
}

export interface WeeklyOpportunity {
  id: string;
  direction: string;
  source: string;
  sourceRoute: HomeRoute;
  title: string;
  angle: string;
  detail: string;
  action: '查看详情' | '加入选题池';
}

export type WeeklyExpressionStatus = '待排期' | '待创作' | '已完成' | '待发布' | '已发布';

export interface WeeklyExpression {
  id: string;
  day: string;
  topic: string;
  type: string;
  status: WeeklyExpressionStatus;
  action: string;
  route: HomeRoute;
}

export interface WeeklyHomeData {
  weeklyBrief: WeeklyBrief;
  weeklyOpportunities: WeeklyOpportunity[];
  weeklyExpressions: WeeklyExpression[];
}

export const weeklyBrief: WeeklyBrief = {
  title: '从“介绍产品”转向“讲清楚一个生活场景”',
  paragraphs: [
    '本周健康消费内容的关注点，正在从单一产品介绍，转向具体生活场景和可执行的方法。久坐、睡眠、换季轻养护等方向，与森野轻养品牌的产品资料和用户案例存在较强关联。',
    '建议本周先围绕“久坐恢复”和“睡前放松”形成内容表达，再将其中一部分内容延伸到朋友圈经营。',
  ],
  direction: '久坐恢复、睡前放松、换季轻养护',
  expression: '具体生活场景 + 可执行方法',
  basis: [
    { label: '热点雷达', route: '#hotspot-radar' },
    { label: '爆款分析', route: '#viral-analysis' },
    { label: '内容数据复盘', route: '#content-review' },
  ],
  observations: [
    '午后疲惫和睡前放松，正在成为健康内容中更容易被代入的生活入口。',
    '用户更愿意先收藏一套可以马上执行的方法，再进一步了解适合自己的产品。',
  ],
  judgments: [
    '森野轻养品牌当前最适合用场景方法建立信任，再自然带出产品使用方式。',
    '已有产品资料可以支撑久坐舒缓、晚间安睡和换季饮食三个表达方向。',
  ],
  recommendations: [
    '优先完成“办公室久坐后的 3 个舒缓动作”和“睡前 30 分钟”两篇内容。',
    '将完成内容同步整理为朋友圈表达，保留生活场景和具体步骤，不改写成硬性产品介绍。',
  ],
};

export const weeklyOpportunities: WeeklyOpportunity[] = [
  {
    id: 'current-sitting-recovery',
    direction: '久坐恢复',
    source: '热点雷达',
    sourceRoute: '#hotspot-radar',
    title: '午后如何快速恢复状态？',
    angle: '办公室久坐、午后疲惫',
    detail: '适合从午后工作状态切入，先给出一套不离开办公桌也能完成的轻量恢复方法。',
    action: '查看详情',
  },
  {
    id: 'current-sleep-reset',
    direction: '睡前放松',
    source: '爆款分析',
    sourceRoute: '#viral-analysis',
    title: '从“熬夜后的第二天”切入',
    angle: '睡前 30 分钟、第二天状态',
    detail: '可以把“第二天状态不好”的普遍感受，转化为睡前半小时的可执行调整建议。',
    action: '加入选题池',
  },
  {
    id: 'current-season-care',
    direction: '换季轻养护',
    source: '热点雷达',
    sourceRoute: '#hotspot-radar',
    title: '换季阶段如何做轻养护？',
    angle: '日常饮食、家庭场景',
    detail: '适合从家庭日常饮食和作息变化切入，表达更轻、更容易持续的换季照顾方式。',
    action: '查看详情',
  },
];

export const weeklyExpressions: WeeklyExpression[] = [
  {
    id: 'current-sitting-content',
    day: '周二',
    topic: '办公室久坐后的 3 个舒缓动作',
    type: '图文内容',
    status: '待创作',
    action: '去创作',
    route: '#content-creation',
  },
  {
    id: 'current-sleep-article',
    day: '周三',
    topic: '晚间安睡饮：睡前 30 分钟',
    type: '公众号文章',
    status: '已完成',
    action: '查看成稿',
    route: '#content-assets',
  },
  {
    id: 'current-season-script',
    day: '周五',
    topic: '换季轻补：什么时候补更合适',
    type: '视频脚本',
    status: '待排期',
    action: '去排期',
    route: '#topic-pool?focus=calendar',
  },
];

const previousWeekData: WeeklyHomeData = {
  weeklyBrief: {
    ...weeklyBrief,
    title: '先把睡眠场景讲明白，再延伸到日常轻养护',
    paragraphs: [
      '上周内容表现显示，带有具体生活场景的表达更容易被保存。睡前放松、第二天状态和日常饮食，是用户更容易代入的三个入口。',
      '建议把已经验证过的睡眠场景继续拆成短内容，同时回收进产品资料和后续朋友圈排期。',
    ],
    direction: '睡前放松、第二天状态、日常饮食',
    expression: '先讲方法，再说明适用场景',
    observations: [
      '睡前半小时的具体动作，比泛泛的睡眠知识更容易进入用户的日常。',
      '内容评论集中在“第二天怎么调整”，可以继续作为后续表达的延展入口。',
    ],
    judgments: [
      '睡眠场景已经具备连续表达的基础，下一步要减少产品信息的前置比例。',
      '内容复盘中出现的高收藏段落，可以整理成企业长期可复用的场景知识。',
    ],
    recommendations: [
      '先完成一篇睡前 30 分钟的公众号文章，再拆成图文和朋友圈表达。',
      '将评论区出现的第二天状态问题加入下一周选题池。',
    ],
  },
  weeklyOpportunities: [
    {
      id: 'previous-sleep-routine',
      direction: '睡前放松',
      source: '爆款分析',
      sourceRoute: '#viral-analysis',
      title: '睡前 30 分钟，怎样让身体慢下来？',
      angle: '晚间仪式、屏幕使用、第二天状态',
      detail: '从用户熟悉的晚间节奏切入，让睡眠主题变成一套可以试用的生活调整方法。',
      action: '加入选题池',
    },
    {
      id: 'previous-morning-state',
      direction: '第二天状态',
      source: '热点雷达',
      sourceRoute: '#hotspot-radar',
      title: '早上醒来还是很累，问题可能在哪里？',
      angle: '起床后的精神状态、饮食节奏',
      detail: '适合用问题型标题连接睡眠与日常饮食，形成更自然的连续阅读。',
      action: '查看详情',
    },
    {
      id: 'previous-light-diet',
      direction: '日常轻养护',
      source: '热点雷达',
      sourceRoute: '#hotspot-radar',
      title: '忙碌工作日，也能坚持的轻养护方式',
      angle: '办公室、家庭早餐、低负担习惯',
      detail: '把轻养护放回普通工作日，减少仪式感，强调可重复和低负担。',
      action: '查看详情',
    },
  ],
  weeklyExpressions: [
    {
      id: 'previous-sleep-note',
      day: '周一',
      topic: '睡前 30 分钟的放松顺序',
      type: '图文内容',
      status: '已发布',
      action: '查看成稿',
      route: '#content-assets',
    },
    {
      id: 'previous-morning-draft',
      day: '周四',
      topic: '为什么睡够了，第二天还是累',
      type: '公众号文章',
      status: '待发布',
      action: '查看成稿',
      route: '#content-assets',
    },
    {
      id: 'previous-diet-calendar',
      day: '周六',
      topic: '工作日轻养护的一日饮食顺序',
      type: '视频脚本',
      status: '待排期',
      action: '去排期',
      route: '#topic-pool?focus=calendar',
    },
  ],
};

const nextWeekData: WeeklyHomeData = {
  weeklyBrief: {
    ...weeklyBrief,
    title: '把换季轻养护做成一套家庭可执行的方法',
    paragraphs: [
      '下一周的经营线索会更集中在换季调理和家庭轻养护。用户不需要一份复杂的知识清单，而是想知道今天的饮食、作息和照顾方式可以怎样调整。',
      '建议先补齐换季轻补组合的产品资料，再以家庭场景为主线安排图文、视频和朋友圈表达。',
    ],
    direction: '换季轻养护、家庭饮食、作息调整',
    expression: '家庭场景 + 一步一步的日常方法',
    observations: [
      '换季内容的讨论更集中在家庭成员如何一起调整，而不是单个产品的功效比较。',
      '一周内连续出现的饮食和作息问题，适合整理成可持续更新的内容主题。',
    ],
    judgments: [
      '换季轻养护适合做成一条连续内容线，先提供方法，再承接产品选择。',
      '产品资料中的使用场景需要进一步翻译成家庭成员都能理解的表达。',
    ],
    recommendations: [
      '先完成“换季轻补什么时候开始”这一篇基础内容，作为后续表达的入口。',
      '把家庭日常中的真实问题收集到选题池，为下一轮内容复盘留下依据。',
    ],
  },
  weeklyOpportunities: [
    {
      id: 'next-season-transition',
      direction: '换季轻养护',
      source: '热点雷达',
      sourceRoute: '#hotspot-radar',
      title: '换季轻补，什么时候开始更合适？',
      angle: '家庭饮食、季节变化、低负担调整',
      detail: '从“什么时候开始”这个具体问题切入，降低换季养护的理解门槛。',
      action: '加入选题池',
    },
    {
      id: 'next-family-rhythm',
      direction: '家庭作息',
      source: '爆款分析',
      sourceRoute: '#viral-analysis',
      title: '一家人的作息，怎样一起慢慢调回来？',
      angle: '家庭场景、晚间节奏、陪伴关系',
      detail: '用家庭成员共同生活的细节承接作息调整，让内容更有真实感和连续性。',
      action: '查看详情',
    },
    {
      id: 'next-season-table',
      direction: '日常饮食',
      source: '热点雷达',
      sourceRoute: '#hotspot-radar',
      title: '换季餐桌上，哪些调整最容易坚持？',
      angle: '一日三餐、家庭备餐、轻量习惯',
      detail: '把换季轻养护落到一日三餐，适合继续拆成短内容和朋友圈日常分享。',
      action: '查看详情',
    },
  ],
  weeklyExpressions: [
    {
      id: 'next-season-article',
      day: '周二',
      topic: '换季轻补：从什么时候开始准备',
      type: '公众号文章',
      status: '待创作',
      action: '去创作',
      route: '#content-creation',
    },
    {
      id: 'next-family-script',
      day: '周四',
      topic: '一家人的晚间节奏怎么调',
      type: '视频脚本',
      status: '待排期',
      action: '去排期',
      route: '#topic-pool?focus=calendar',
    },
    {
      id: 'next-light-care-draft',
      day: '周日',
      topic: '换季餐桌上的低负担调整',
      type: '图文内容',
      status: '已完成',
      action: '查看成稿',
      route: '#content-assets',
    },
  ],
};

export function getWeeklyHomeData(offset: number): WeeklyHomeData {
  if (offset < 0) return previousWeekData;
  if (offset > 0) {
    if (offset === 1) return nextWeekData;
    return {
      weeklyBrief: {
        ...nextWeekData.weeklyBrief,
        title: '下一周还没有形成完整的经营周刊',
        paragraphs: [
          '当前周次还没有足够的热点、表达和复盘资料形成完整判断。可以先从选题池挑选一个方向，建立下一轮内容表达。',
          '当新的内容进入生产流程后，本周经营简报会继续补充对应的观察和建议。',
        ],
      },
      weeklyOpportunities: nextWeekData.weeklyOpportunities,
      weeklyExpressions: [],
    };
  }
  return {
    weeklyBrief,
    weeklyOpportunities,
    weeklyExpressions,
  };
}
