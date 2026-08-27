import type { BrainDocument } from './enterpriseBrainTypes';

export const FRIEND_CIRCLE_CURRENT_WEEK = '2026-08-24';

export type FriendCircleMode = 'campaign' | 'daily';
export type FriendCircleDayStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface FriendCircleTopic {
  id: string;
  title: string;
}

export interface FriendCircleMaterial {
  documentIds: string[];
  manual: string;
}

export interface FriendCircleContent {
  id: string;
  topicId: string;
  versions: [string, string, string];
  currentVersion: 0 | 1 | 2;
  manuallyEdited?: boolean;
}

export interface FriendCircleDay {
  date: string;
  weekday: string;
  theme: string;
  topics: FriendCircleTopic[];
  status: FriendCircleDayStatus;
  materials: Record<string, FriendCircleMaterial>;
  contents: FriendCircleContent[];
}

export interface FriendCircleWeekConfig {
  mode: FriendCircleMode;
  cycleWeeks: number;
  purpose: string;
  tasks: string;
  publishMode: 'weekly' | 'daily';
  weeklyCount: number;
  dailyCounts: number[];
  productName: string;
  activityName: string;
}

export interface FriendCircleWeek {
  start: string;
  hasSchedule: boolean;
  generationStatus: 'idle' | 'generating' | 'ready' | 'failed';
  config: FriendCircleWeekConfig | null;
  days: FriendCircleDay[];
}

export const defaultFriendCircleConfig: FriendCircleWeekConfig = {
  mode: 'campaign',
  cycleWeeks: 1,
  purpose: '让用户先理解春季轻养护，再自然进入咨询和体验环节。',
  tasks: '围绕真实生活场景建立信任，减少生硬的产品介绍。',
  publishMode: 'weekly',
  weeklyCount: 14,
  dailyCounts: [2, 2, 2, 2, 2, 2, 2],
  productName: '春季轻养护组合',
  activityName: '',
};

const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const topicSets = [
  {
    theme: '春季轻养护，从状态变化开始',
    topics: [
      '春季身体状态变化的 3 个常见信号',
      '为什么春季适合做日常轻养护',
      '不要一上来改变所有生活习惯',
    ],
  },
  {
    theme: '用户常见误区，先把边界讲清楚',
    topics: ['不是所有清淡饮食都适合久坐人群', '轻养护不是极端节食'],
  },
  {
    theme: '产品使用场景，放进真实的一天',
    topics: ['办公室人群如何安排日常轻养护'],
  },
  {
    theme: '一顿饭里的轻松选择',
    topics: ['忙完一天，晚餐可以从一件小事开始', '如何给家庭餐桌留一点调整空间'],
  },
  {
    theme: '把用户问题回答在前面',
    topics: ['什么时候适合开始调整作息', '轻养护产品应该怎么选'],
  },
  {
    theme: '真实反馈，记录变化而不是夸大结果',
    topics: ['用户为什么愿意坚持一个小习惯'],
  },
  {
    theme: '周末留一点时间照顾自己',
    topics: ['周末不安排满，身体也需要缓冲'],
  },
];

const contentSeeds = [
  [
    '很多人到了春季，会发现身体状态出现一些变化。与其突然改变所有习惯，不如先从每天能做到的小调整开始。',
    '换季之后，身体会提醒我们重新看看日常节奏。先记下睡眠、饮食和活动里的一个小变化，再决定下一步怎么做。',
    '春季轻养护不需要从一张复杂清单开始。今天少一点匆忙，多留意一个真实感受，也是一种对自己的照顾。',
  ],
  [
    '春季的生活节奏和身体状态都会发生变化，适合从饮食、睡眠和日常活动开始调整。重点不是做得多，而是能不能慢慢坚持。',
    '为什么总在春天重新安排生活？因为天气、作息和活动量都在变化。把调整放回日常，往往比追求一次到位更轻松。',
    '轻养护不是额外增加一项任务，而是把已经在做的事重新安排得更适合自己。先从一顿饭和一个晚上的睡眠开始。',
  ],
  [
    '真正容易坚持的调整，不是一次改变全部生活，而是先找到一件今天就能开始的小事。让身体适应，也让自己保留选择的余地。',
    '如果一开始就给自己安排太多规则，很容易把照顾自己变成新的压力。先选一件最容易做到的事，给变化留一点时间。',
    '日常轻养护没有统一答案。适合自己的节奏，通常来自一次次小而具体的尝试，而不是一份看起来完美的计划。',
  ],
];

function toDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addWeeks(start: string, offset: number) {
  const date = toDate(start);
  date.setUTCDate(date.getUTCDate() + offset * 7);
  return date.toISOString().slice(0, 10);
}

export function getWeekDates(start: string) {
  const monday = toDate(start);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function formatShortDate(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)}-${String(Number(day)).padStart(2, '0')}`;
}

export function formatWeekRange(start: string) {
  const dates = getWeekDates(start);
  const [, startMonth, startDay] = dates[0].split('-');
  const [, endMonth, endDay] = dates[6].split('-');
  return `${Number(startMonth)} 月 ${Number(startDay)} 日 - ${Number(endMonth)} 月 ${Number(endDay)} 日`;
}

function createMaterialMap(
  topics: FriendCircleTopic[],
  overrides?: Record<string, FriendCircleMaterial>,
) {
  return Object.fromEntries(
    topics.map((topic) => [topic.id, overrides?.[topic.id] ?? { documentIds: [], manual: '' }]),
  );
}

function createTopics(
  dayIndex: number,
  start: string,
  requestedCount?: number,
): FriendCircleTopic[] {
  const source = topicSets[dayIndex % topicSets.length];
  const availableTitles = Array.from(
    new Set([...source.topics, ...topicSets.flatMap((set) => set.topics)]),
  );
  const titles = availableTitles.slice(0, requestedCount ?? source.topics.length);
  return titles.map((title, topicIndex) => ({
    id: `${start}-${dayIndex + 1}-${topicIndex + 1}`,
    title,
  }));
}

export function createContent(
  topic: FriendCircleTopic,
  dayIndex: number,
  topicIndex: number,
): FriendCircleContent {
  const seed = contentSeeds[topicIndex % contentSeeds.length];
  const suffix =
    dayIndex > 0 ? ` 今天先从${dayIndex % 2 === 0 ? '工作间隙' : '晚餐之后'}的一件小事开始。` : '';
  return {
    id: `content-${topic.id}`,
    topicId: topic.id,
    versions: [`${seed[0]}${suffix}`, `${seed[1]}${suffix}`, `${seed[2]}${suffix}`],
    currentVersion: topicIndex % 2 === 0 ? 0 : 1,
  };
}

export function createScheduleWeek(
  start: string,
  config: FriendCircleWeekConfig,
  includeDemoStates = false,
): FriendCircleWeek {
  const dates = getWeekDates(start);
  return {
    start,
    hasSchedule: true,
    generationStatus: 'ready',
    config,
    days: dates.map((date, dayIndex) => {
      const source = topicSets[dayIndex % topicSets.length];
      const count =
        config.publishMode === 'daily'
          ? Math.max(1, config.dailyCounts[dayIndex] ?? 1)
          : Math.max(
              0,
              Math.floor(config.weeklyCount / 7) + (dayIndex < config.weeklyCount % 7 ? 1 : 0),
            );
      const normalizedTopics = createTopics(dayIndex, start, Math.min(4, Math.max(0, count)));
      return {
        date,
        weekday: weekdayNames[dayIndex],
        theme: source.theme,
        topics: normalizedTopics,
        status: includeDemoStates
          ? dayIndex === 0
            ? 'completed'
            : dayIndex === 6
              ? 'failed'
              : 'pending'
          : 'pending',
        materials: createMaterialMap(normalizedTopics),
        contents:
          includeDemoStates && dayIndex === 0
            ? normalizedTopics.map((topic, topicIndex) =>
                createContent(topic, dayIndex, topicIndex),
              )
            : [],
      };
    }),
  };
}

const initialCurrentWeek = createScheduleWeek(
  FRIEND_CIRCLE_CURRENT_WEEK,
  defaultFriendCircleConfig,
  true,
);
const initialMondayTopics = createTopics(0, FRIEND_CIRCLE_CURRENT_WEEK);

export const initialFriendCircleWeeks: Record<string, FriendCircleWeek> = {
  [FRIEND_CIRCLE_CURRENT_WEEK]: {
    ...initialCurrentWeek,
    days: initialCurrentWeek.days.map((day, dayIndex) =>
      dayIndex === 0
        ? {
            ...day,
            topics: initialMondayTopics,
            materials: createMaterialMap(initialMondayTopics),
            contents: initialMondayTopics.map((topic, topicIndex) =>
              createContent(topic, dayIndex, topicIndex),
            ),
          }
        : day,
    ),
  },
};

export const friendCircleProducts = ['春季轻养护组合', '晚间舒缓营养包', '办公室轻食方案'];

export const friendCircleActivities = [
  '春日轻养护体验周',
  '7 天生活节奏记录计划',
  '老用户关怀回访活动',
];

export function getMarkdownDocuments(documents: BrainDocument[]) {
  return documents.filter((document) => document.kind === 'markdown');
}
