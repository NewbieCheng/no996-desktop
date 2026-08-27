import type { CreationMode, SplitPromptCard } from './contentCreationMockData';

export type AssetPlatform = 'xiaohongshu' | 'douyin' | 'video-account' | 'wechat';
export type AssetPublishStatus = 'unpublished' | 'published';
export type AssetVersionSource = '初始保存' | 'AI 生成' | '手动编辑' | '恢复历史版本';

export interface ContentAssetVersion {
  id: string;
  version: number;
  source: AssetVersionSource;
  createdAt: string;
  title: string;
  body: string;
  tags: string[];
}

export interface PlatformDraft {
  id: string;
  platform: AssetPlatform;
  title: string;
  body: string;
  tags: string[];
  currentVersion: number;
  versions: ContentAssetVersion[];
}

export interface ContentAssetGroup {
  id: string;
  title: string;
  mode: CreationMode;
  status: AssetPublishStatus;
  sourcePlatform: AssetPlatform;
  topicId?: string;
  topicTitle?: string;
  scheduleId?: string;
  scheduleDate?: string;
  createdAt: string;
  platforms: Partial<Record<AssetPlatform, PlatformDraft>>;
  splitStatus: 'not-applicable' | 'generating' | 'generated' | 'error';
  splitCards: SplitPromptCard[];
  splitStale: boolean;
}

export const assetPlatformLabels: Record<AssetPlatform, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  'video-account': '视频号',
  wechat: '公众号',
};

export const assetStatusLabels: Record<AssetPublishStatus, string> = {
  unpublished: '待发布',
  published: '已发布',
};

export const assetModeLabels: Record<CreationMode, string> = {
  'image-text': '图文内容',
  'video-script': '视频脚本',
  'wechat-article': '公众号文章',
  replicate: '爆款一键复刻',
};
