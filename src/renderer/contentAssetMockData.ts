import { mockSplitCards } from './contentCreationMockData';
import type {
  AssetPlatform,
  ContentAssetGroup,
  ContentAssetVersion,
  PlatformDraft,
} from './contentAssetTypes';

function version(
  id: string,
  title: string,
  body: string,
  tags: string[],
  createdAt: string,
  source: ContentAssetVersion['source'] = '初始保存',
): ContentAssetVersion {
  return {
    id,
    version: 1,
    source,
    createdAt,
    title,
    body,
    tags,
  };
}

function draft(
  id: string,
  platform: AssetPlatform,
  title: string,
  body: string,
  tags: string[],
  createdAt: string,
): PlatformDraft {
  return {
    id,
    platform,
    title,
    body,
    tags,
    currentVersion: 1,
    versions: [version(`${id}-v1`, title, body, tags, createdAt)],
  };
}

const imageTextBody = `换季以后，很多人的生活节奏都会变得有点乱：早上赶时间，中午顾不上好好吃饭，晚上又想给自己留一点放松的时间。

与其把健康管理变成一张很难坚持的清单，不如先从一个固定的小场景开始。比如早餐后，给自己留出两分钟，选择一杯口味清爽、信息透明的轻养饮。

真正适合长期坚持的方式，往往不是一次做很多，而是能自然放回每天的生活里。`;

const videoBody = `【镜头 1｜周末餐桌】
画面：家人把小份餐食放到桌面上，留出自然交流的空间。
旁白：现在的家庭聚会，不一定要准备复杂的一桌菜。

【镜头 2｜分享饮用】
画面：不同口味的小份饮品被依次递到桌边。
旁白：先从轻松的分享开始，让每个人都能按自己的节奏参与。

【镜头 3｜信息说明】
画面：展示配料和饮用建议，不做夸张特写。
旁白：看清楚信息，再选择适合这次聚会的方式。`;

const articleBody = `很多人把家庭健康管理想象成一套复杂计划，其实，真正容易留下来的改变，常常从一个小动作开始。

早餐后、晚餐前，或者周末和家人聊天的时候，都是可以重新安排的生活节点。固定时刻的价值，不在于让生活变得更严格，而是减少一次临时决定。

选择轻养产品之前，先看清原料、配料和饮用方式，再判断它是否适合自己。事实透明，选择才有基础。`;

export const contentAssetMockGroups: ContentAssetGroup[] = [
  {
    id: 'asset-group-demo-01',
    title: '换季轻养，从早餐后的两分钟开始',
    mode: 'image-text',
    status: 'unpublished',
    sourcePlatform: 'xiaohongshu',
    topicId: 'topic-demo-0824-02',
    topicTitle: '把日常营养做成早餐后的固定动作',
    scheduleId: 'schedule-demo-0826-01',
    scheduleDate: '2026-08-26',
    createdAt: '2026-08-24T09:30:00+08:00',
    platforms: {
      xiaohongshu: draft(
        'asset-draft-demo-01-xhs',
        'xiaohongshu',
        '换季轻养，从早餐后的两分钟开始',
        imageTextBody,
        ['换季轻养', '早餐场景', '日常管理'],
        '2026-08-24T09:30:00+08:00',
      ),
    },
    splitStatus: 'generated',
    splitCards: mockSplitCards,
    splitStale: false,
  },
  {
    id: 'asset-group-demo-02',
    title: '家庭聚会中的轻饮场景',
    mode: 'video-script',
    status: 'unpublished',
    sourcePlatform: 'douyin',
    topicId: 'topic-demo-0824-01',
    topicTitle: '家庭聚会中的轻饮场景',
    scheduleId: 'schedule-demo-0825-01',
    scheduleDate: '2026-08-25',
    createdAt: '2026-08-23T15:10:00+08:00',
    platforms: {
      douyin: draft(
        'asset-draft-demo-02-douyin',
        'douyin',
        '家庭聚会中的轻饮场景',
        videoBody,
        ['家庭聚会', '轻饮场景'],
        '2026-08-23T15:10:00+08:00',
      ),
      xiaohongshu: draft(
        'asset-draft-demo-02-xhs',
        'xiaohongshu',
        '一顿饭里的轻松分享',
        '家庭聚会不需要被安排得很满，从一份小份分享和一次自然聊天开始，就足够让餐桌多一点轻松。',
        ['家庭聚会', '分享方式'],
        '2026-08-23T15:12:00+08:00',
      ),
      'video-account': draft(
        'asset-draft-demo-02-video',
        'video-account',
        '把轻松留给一顿饭',
        '周末和家人吃饭时，保留一点选择空间，也保留一点慢慢聊天的时间。',
        ['周末餐桌', '生活方式'],
        '2026-08-23T15:13:00+08:00',
      ),
    },
    splitStatus: 'not-applicable',
    splitCards: [],
    splitStale: false,
  },
  {
    id: 'asset-group-demo-03',
    title: '家庭健康管理不必从复杂计划开始',
    mode: 'wechat-article',
    status: 'published',
    sourcePlatform: 'wechat',
    createdAt: '2026-08-18T10:20:00+08:00',
    platforms: {
      wechat: draft(
        'asset-draft-demo-03-wechat',
        'wechat',
        '家庭健康管理不必从复杂计划开始',
        articleBody,
        ['家庭健康', '轻量行动', '信息透明'],
        '2026-08-18T10:20:00+08:00',
      ),
    },
    splitStatus: 'not-applicable',
    splitCards: [],
    splitStale: false,
  },
];

export function cloneContentAssetGroups(groups: ContentAssetGroup[]) {
  return groups.map((group) => ({
    ...group,
    platforms: Object.fromEntries(
      Object.entries(group.platforms).map(([platform, item]) => [
        platform,
        item
          ? {
              ...item,
              tags: [...item.tags],
              versions: item.versions.map((itemVersion) => ({
                ...itemVersion,
                tags: [...itemVersion.tags],
              })),
            }
          : item,
      ]),
    ) as ContentAssetGroup['platforms'],
    splitCards: group.splitCards.map((card) => ({ ...card })),
  }));
}
