import type { AssetPlatform } from './contentAssetTypes';

export type ReviewRecordStatus = 'pending' | 'entered' | 'analyzed';
export type AnalysisScope = 'single' | 'multiple' | 'date-range' | 'all';
export type AnalysisLogStatus = 'success' | 'failed';

export type MetricKey =
  | 'exposure'
  | 'views'
  | 'coverClickRate'
  | 'exitRate2s'
  | 'completionRate5s'
  | 'interactionRate'
  | 'likes'
  | 'comments'
  | 'danmaku'
  | 'favorites'
  | 'citations'
  | 'shares'
  | 'averageWatchDuration'
  | 'plays60s'
  | 'fullCompletionRate'
  | 'followersGain'
  | 'plays'
  | 'completionRate'
  | 'jumpRate2s'
  | 'averagePlayDuration'
  | 'profileVisits'
  | 'averageReadDuration'
  | 'newFollows'
  | 'listenFullText'
  | 'rewards'
  | 'chatMomentsShares'
  | 'setAsRingtone'
  | 'setAsStatus'
  | 'setAsMomentsCover'
  | 'wecomLinkClicks'
  | 'wecomLinkClickUsers'
  | 'addContactCount'
  | 'addContactUsers'
  | 'followersLoss'
  | 'dislikes'
  | 'likesCount';

export interface PlatformMetricDefinition {
  key: MetricKey;
  label: string;
  unit?: '%' | '秒';
}

export interface ContentDataRecord {
  id: string;
  assetGroupId?: string;
  platformDraftId?: string;
  platform: AssetPlatform;
  titleSnapshot: string;
  publishedAt: string;
  metrics: Partial<Record<MetricKey, string>>;
  status: ReviewRecordStatus;
  createdAt: string;
}

export interface ContentDataSnapshot {
  recordId: string;
  platform: AssetPlatform;
  titleSnapshot: string;
  publishedAt: string;
  metrics: Partial<Record<MetricKey, string>>;
}

export interface AnalysisReport {
  overview: string;
  strengths: string[];
  factors: string[];
  suggestions: string[];
}

export interface AnalysisLog {
  id: string;
  platform: AssetPlatform;
  scope: AnalysisScope;
  dateFrom?: string;
  dateTo?: string;
  recordIds: string[];
  dataCount: number;
  snapshots: ContentDataSnapshot[];
  report: AnalysisReport;
  createdAt: string;
  status: AnalysisLogStatus;
}

export const reviewPlatformOrder: AssetPlatform[] = [
  'xiaohongshu',
  'douyin',
  'video-account',
  'wechat',
];

export const reviewPlatformLabels: Record<AssetPlatform, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  'video-account': '视频号',
  wechat: '公众号',
};

export const platformMetricDefinitions: Record<AssetPlatform, PlatformMetricDefinition[]> = {
  xiaohongshu: [
    { key: 'exposure', label: '曝光量' },
    { key: 'views', label: '观看数' },
    { key: 'coverClickRate', label: '封面点击率', unit: '%' },
    { key: 'exitRate2s', label: '2 秒退出率', unit: '%' },
    { key: 'completionRate5s', label: '5 秒完播率', unit: '%' },
    { key: 'interactionRate', label: '互动率', unit: '%' },
    { key: 'likes', label: '点赞数' },
    { key: 'comments', label: '评论数' },
    { key: 'danmaku', label: '弹幕数' },
    { key: 'favorites', label: '收藏数' },
    { key: 'citations', label: '被引用数' },
    { key: 'shares', label: '分享数' },
    { key: 'averageWatchDuration', label: '平均观看时长', unit: '秒' },
    { key: 'plays60s', label: '60 秒播放数' },
    { key: 'fullCompletionRate', label: '全片完播率', unit: '%' },
    { key: 'followersGain', label: '涨粉数' },
  ],
  douyin: [
    { key: 'plays', label: '播放量' },
    { key: 'likes', label: '点赞量' },
    { key: 'comments', label: '评论数量' },
    { key: 'shares', label: '分享量' },
    { key: 'favorites', label: '收藏量' },
    { key: 'danmaku', label: '弹幕量' },
    { key: 'completionRate', label: '完播率', unit: '%' },
    { key: 'completionRate5s', label: '5 秒完播率', unit: '%' },
    { key: 'coverClickRate', label: '封面点击率', unit: '%' },
    { key: 'jumpRate2s', label: '2 秒跳出率', unit: '%' },
    { key: 'averagePlayDuration', label: '平均播放时长', unit: '秒' },
    { key: 'profileVisits', label: '主页访问量' },
    { key: 'followersGain', label: '涨粉量' },
    { key: 'followersLoss', label: '脱粉量' },
  ],
  'video-account': [
    { key: 'completionRate', label: '完播率', unit: '%' },
    { key: 'averagePlayDuration', label: '平均播放时长', unit: '秒' },
    { key: 'plays', label: '播放量' },
    { key: 'dislikes', label: '喜欢数' },
    { key: 'views', label: '在看数' },
    { key: 'likes', label: '点赞' },
    { key: 'comments', label: '评论数' },
    { key: 'followersGain', label: '关注量' },
    { key: 'shares', label: '分享量' },
    { key: 'chatMomentsShares', label: '转发聊天和朋友圈' },
    { key: 'setAsRingtone', label: '设为铃声' },
    { key: 'setAsStatus', label: '设为状态' },
    { key: 'setAsMomentsCover', label: '设为朋友圈封面' },
    { key: 'wecomLinkClicks', label: '企微链接点击次数' },
    { key: 'wecomLinkClickUsers', label: '企微链接点击人数' },
    { key: 'addContactCount', label: '添加到通讯录次数' },
    { key: 'addContactUsers', label: '添加到通讯录人数' },
  ],
  wechat: [
    { key: 'views', label: '阅读量' },
    { key: 'averageReadDuration', label: '平均阅读时长', unit: '秒' },
    { key: 'completionRate', label: '完读率', unit: '%' },
    { key: 'newFollows', label: '新增关注' },
    { key: 'listenFullText', label: '听全文数' },
    { key: 'shares', label: '分享' },
    { key: 'dislikes', label: '喜欢' },
    { key: 'likes', label: '点赞' },
    { key: 'favorites', label: '收藏' },
    { key: 'rewards', label: '赞赏' },
    { key: 'comments', label: '留言' },
  ],
};

export const reviewCoreMetricKeys: Record<AssetPlatform, MetricKey[]> = {
  xiaohongshu: [
    'exposure',
    'coverClickRate',
    'views',
    'likes',
    'favorites',
    'comments',
    'followersGain',
  ],
  douyin: [
    'plays',
    'likes',
    'comments',
    'shares',
    'favorites',
    'danmaku',
    'completionRate',
    'jumpRate2s',
    'followersGain',
    'followersLoss',
  ],
  'video-account': ['plays', 'dislikes', 'views', 'comments', 'shares', 'followersGain'],
  wechat: [
    'views',
    'averageReadDuration',
    'completionRate',
    'newFollows',
    'listenFullText',
    'shares',
    'dislikes',
    'likes',
    'favorites',
    'rewards',
    'comments',
  ],
};

export const reviewRecordStatusLabels: Record<ReviewRecordStatus, string> = {
  pending: '待录入',
  entered: '已录入',
  analyzed: '已分析',
};

export const analysisScopeLabels: Record<AnalysisScope, string> = {
  single: '当前选中 1 条',
  multiple: '当前选中多条',
  'date-range': '发布时间范围',
  all: '当前平台全部',
};

export function getPlatformMetricDefinitions(platform: AssetPlatform) {
  return platformMetricDefinitions[platform];
}

export function hasEnteredMetrics(record: ContentDataRecord) {
  return Object.values(record.metrics).some(
    (value) => value !== undefined && value !== '' && value !== '-',
  );
}

export function displayMetric(value?: string) {
  return value === undefined || value === '' || value === '-' ? '-' : value;
}
