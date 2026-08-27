import { cloneContentAssetGroups, contentAssetMockGroups } from './contentAssetMockData';
import type {
  AssetPlatform,
  AssetVersionSource,
  ContentAssetGroup,
  ContentAssetVersion,
  PlatformDraft,
} from './contentAssetTypes';
import type { CreationMode, SplitPromptCard } from './contentCreationMockData';

export const contentAssetStorageKey = 'no-overtime-workbench.content-assets.v1';

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function now() {
  return new Date().toISOString();
}

export function loadContentAssetGroups() {
  if (typeof window === 'undefined') {
    return cloneContentAssetGroups(contentAssetMockGroups);
  }

  const raw = window.localStorage.getItem(contentAssetStorageKey);
  if (!raw) {
    return cloneContentAssetGroups(contentAssetMockGroups);
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed as ContentAssetGroup[])
      : cloneContentAssetGroups(contentAssetMockGroups);
  } catch {
    return cloneContentAssetGroups(contentAssetMockGroups);
  }
}

export function saveContentAssetGroups(groups: ContentAssetGroup[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(contentAssetStorageKey, JSON.stringify(groups));
  }
}

export function createPlatformDraft({
  platform,
  title,
  body,
  tags,
  source = '初始保存',
}: {
  platform: AssetPlatform;
  title: string;
  body: string;
  tags: string[];
  source?: AssetVersionSource;
}): PlatformDraft {
  const createdAt = now();
  const itemId = createId(`asset-draft-${platform}`);
  const itemVersion: ContentAssetVersion = {
    id: createId('asset-version'),
    version: 1,
    source,
    createdAt,
    title,
    body,
    tags: [...tags],
  };
  return {
    id: itemId,
    platform,
    title,
    body,
    tags: [...tags],
    currentVersion: 1,
    versions: [itemVersion],
  };
}

export function createContentAssetGroup({
  title,
  mode,
  sourcePlatform,
  body,
  tags,
  topicId,
  topicTitle,
  scheduleId,
  scheduleDate,
  splitCards = [],
}: {
  title: string;
  mode: CreationMode;
  sourcePlatform: AssetPlatform;
  body: string;
  tags: string[];
  topicId?: string;
  topicTitle?: string;
  scheduleId?: string;
  scheduleDate?: string;
  splitCards?: SplitPromptCard[];
}): ContentAssetGroup {
  const id = createId('asset-group');
  return {
    id,
    title,
    mode,
    status: 'unpublished',
    sourcePlatform,
    topicId,
    topicTitle,
    scheduleId,
    scheduleDate,
    createdAt: now(),
    platforms: {
      [sourcePlatform]: createPlatformDraft({ platform: sourcePlatform, title, body, tags }),
    },
    splitStatus: mode === 'image-text' ? 'generated' : 'not-applicable',
    splitCards: splitCards.map((card) => ({ ...card })),
    splitStale: false,
  };
}

export function addOrRegeneratePlatform(
  group: ContentAssetGroup,
  {
    platform,
    title,
    body,
    tags,
  }: { platform: AssetPlatform; title: string; body: string; tags: string[] },
) {
  const current = group.platforms[platform];
  if (!current) {
    return {
      ...group,
      platforms: {
        ...group.platforms,
        [platform]: createPlatformDraft({
          platform,
          title,
          body,
          tags,
          source: 'AI 生成',
        }),
      },
    };
  }

  const nextVersion = current.currentVersion + 1;
  const itemVersion: ContentAssetVersion = {
    id: createId('asset-version'),
    version: nextVersion,
    source: 'AI 生成',
    createdAt: now(),
    title,
    body,
    tags: [...tags],
  };
  return {
    ...group,
    platforms: {
      ...group.platforms,
      [platform]: {
        ...current,
        title,
        body,
        tags: [...tags],
        currentVersion: nextVersion,
        versions: [...current.versions, itemVersion],
      },
    },
  };
}
