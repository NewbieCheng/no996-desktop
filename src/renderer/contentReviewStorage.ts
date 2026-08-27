import { cloneContentAssetGroups, contentAssetMockGroups } from './contentAssetMockData';
import { loadContentAssetGroups } from './contentAssetStorage';
import type { AssetPublishStatus, ContentAssetGroup } from './contentAssetTypes';
import { contentReviewMockLogs, contentReviewMockRecords } from './contentReviewMockData';
import type { AnalysisLog, ContentDataRecord } from './contentReviewTypes';

export const contentReviewRecordsStorageKey = 'no-overtime-workbench.content-review.records.v1';
export const contentReviewLogsStorageKey = 'no-overtime-workbench.content-review.logs.v1';
const publicationStateStorageKey = 'no-overtime-workbench.content-review.publication-state.v1';
const deletedRecordsStorageKey = 'no-overtime-workbench.content-review.deleted-records.v1';

function cloneRecords(records: ContentDataRecord[]) {
  return records.map((record) => ({
    ...record,
    metrics: { ...record.metrics },
  }));
}

function cloneLogs(logs: AnalysisLog[]) {
  return logs.map((log) => ({
    ...log,
    recordIds: [...log.recordIds],
    snapshots: log.snapshots.map((snapshot) => ({
      ...snapshot,
      metrics: { ...snapshot.metrics },
    })),
    report: {
      overview: log.report.overview,
      strengths: [...log.report.strengths],
      factors: [...log.report.factors],
      suggestions: [...log.report.suggestions],
    },
  }));
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadContentReviewRecords() {
  return cloneRecords(readJson(contentReviewRecordsStorageKey, contentReviewMockRecords));
}

export function saveContentReviewRecords(records: ContentDataRecord[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(contentReviewRecordsStorageKey, JSON.stringify(records));
  }
}

export function loadAnalysisLogs() {
  return cloneLogs(readJson(contentReviewLogsStorageKey, contentReviewMockLogs));
}

export function saveAnalysisLogs(logs: AnalysisLog[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(contentReviewLogsStorageKey, JSON.stringify(logs));
  }
}

function loadPublicationState() {
  return readJson<Record<string, AssetPublishStatus>>(publicationStateStorageKey, {});
}

function savePublicationState(state: Record<string, AssetPublishStatus>) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(publicationStateStorageKey, JSON.stringify(state));
  }
}

function loadDeletedRecordIds() {
  return new Set(readJson<string[]>(deletedRecordsStorageKey, []));
}

function saveDeletedRecordIds(ids: Set<string>) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(deletedRecordsStorageKey, JSON.stringify([...ids]));
  }
}

function publishedDate(group: ContentAssetGroup) {
  return group.scheduleDate ?? group.createdAt.slice(0, 10);
}

function createPublishedRecord(
  group: ContentAssetGroup,
  platform: ContentAssetGroup['sourcePlatform'],
): ContentDataRecord {
  const draft = group.platforms[platform];
  return {
    id: `review-${group.id}-${platform}`,
    assetGroupId: group.id,
    platformDraftId: draft?.id,
    platform,
    titleSnapshot: draft?.title ?? group.title,
    publishedAt: publishedDate(group),
    metrics: {},
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export function syncPublishedAssetGroups(
  records: ContentDataRecord[] = loadContentReviewRecords(),
  groups: ContentAssetGroup[] = loadContentAssetGroups(),
) {
  const nextRecords = cloneRecords(records);
  const publicationState = loadPublicationState();
  const deletedIds = loadDeletedRecordIds();

  for (const group of groups) {
    const previousStatus = publicationState[group.id];
    const transitionedToPublished =
      group.status === 'published' && previousStatus === 'unpublished';
    if (transitionedToPublished) {
      for (const platform of ['xiaohongshu', 'douyin', 'video-account', 'wechat'] as const) {
        deletedIds.delete(`review-${group.id}-${platform}`);
      }
    }

    if (group.status === 'published') {
      for (const platform of ['xiaohongshu', 'douyin', 'video-account', 'wechat'] as const) {
        const recordId = `review-${group.id}-${platform}`;
        const existing = nextRecords.find((record) => record.id === recordId);
        if (!existing && !deletedIds.has(recordId)) {
          nextRecords.push(createPublishedRecord(group, platform));
        } else if (existing) {
          const draft = group.platforms[platform];
          if (draft && existing.platformDraftId !== draft.id) {
            existing.platformDraftId = draft.id;
          }
        }
      }
    }
    publicationState[group.id] = group.status;
  }

  savePublicationState(publicationState);
  saveDeletedRecordIds(deletedIds);
  saveContentReviewRecords(nextRecords);
  return nextRecords;
}

export function deleteContentReviewRecord(recordId: string, records: ContentDataRecord[]) {
  const deletedIds = loadDeletedRecordIds();
  deletedIds.add(recordId);
  saveDeletedRecordIds(deletedIds);
  const nextRecords = records.filter((record) => record.id !== recordId);
  saveContentReviewRecords(nextRecords);
  return nextRecords;
}

export function resetContentReviewStorageForDemo() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(contentReviewRecordsStorageKey);
  window.localStorage.removeItem(contentReviewLogsStorageKey);
  window.localStorage.removeItem(publicationStateStorageKey);
  window.localStorage.removeItem(deletedRecordsStorageKey);
  window.localStorage.setItem(
    'no-overtime-workbench.content-assets.v1',
    JSON.stringify(cloneContentAssetGroups(contentAssetMockGroups)),
  );
}
