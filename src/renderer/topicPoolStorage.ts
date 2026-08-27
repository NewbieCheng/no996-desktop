import type { HotspotItem } from './types';
import { topicPoolMockItems } from './topicPoolMockData';
import type { TopicItem } from './topicPoolTypes';
import type { ScheduleStatus, TopicSchedule } from './topicPoolTypes';

export const topicPoolStorageKey = 'no-overtime-workbench.topic-pool.items.v1';

function cloneTopicItems(items: TopicItem[]) {
  return items.map((item) => ({
    ...item,
    schedules: item.schedules.map((schedule) => normalizeSchedule(schedule, item.title)),
  }));
}

function normalizeTopic(item: TopicItem): TopicItem {
  const rawContentStatus = (item as unknown as { contentStatus?: string }).contentStatus;
  return {
    ...item,
    contentStatus: rawContentStatus === 'completed' ? 'completed' : 'not-started',
    schedules: item.schedules.map((schedule) => normalizeSchedule(schedule, item.title)),
  };
}

function getScheduleStatus(date: string, contentId?: string): ScheduleStatus {
  if (contentId) {
    return 'completed';
  }
  return date < '2026-08-24' ? 'overdue' : 'pending';
}

function normalizeSchedule(schedule: Partial<TopicSchedule>, topicTitle: string): TopicSchedule {
  const contentId = typeof schedule.contentId === 'string' ? schedule.contentId : undefined;
  return {
    id: schedule.id ?? createScheduleId(),
    date: schedule.date ?? '2026-08-24',
    channel: schedule.channel ?? '待定平台',
    note: schedule.note ?? '',
    titleSnapshot: schedule.titleSnapshot ?? topicTitle,
    status:
      schedule.status === 'completed' ||
      schedule.status === 'overdue' ||
      schedule.status === 'pending'
        ? schedule.status
        : getScheduleStatus(schedule.date ?? '2026-08-24', contentId),
    ...(contentId ? { contentId } : {}),
  };
}

export function loadTopicItems() {
  if (typeof window === 'undefined') {
    return cloneTopicItems(topicPoolMockItems);
  }

  const storedValue = window.localStorage.getItem(topicPoolStorageKey);
  if (!storedValue) {
    return cloneTopicItems(topicPoolMockItems);
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return cloneTopicItems(topicPoolMockItems);
    }

    return parsedValue.filter(isTopicItem).map(normalizeTopic);
  } catch {
    return cloneTopicItems(topicPoolMockItems);
  }
}

export function saveTopicItems(items: TopicItem[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(topicPoolStorageKey, JSON.stringify(items));
  }
}

export function createTopicId(prefix = 'topic') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createScheduleId() {
  return createTopicId('schedule');
}

export function createTopicFromHotspot(item: HotspotItem): TopicItem {
  return {
    id: createTopicId(),
    title: item.title,
    type: 'hotspot',
    detail: `${item.summary} ${item.angle}`,
    reference: `${item.platform}：${item.title}`,
    status: 'active',
    schedules: [],
    contentStatus: 'not-started',
    sourceHotspotId: item.id,
  };
}

export function getTopicBySourceHotspotId(hotspotId: string) {
  return loadTopicItems().find((item) => item.sourceHotspotId === hotspotId);
}

export function getLinkedHotspotIds() {
  return new Set(
    loadTopicItems()
      .map((item) => item.sourceHotspotId)
      .filter((id): id is string => Boolean(id)),
  );
}

function isTopicItem(value: unknown): value is TopicItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<TopicItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    (item.type === 'viral' || item.type === 'hotspot' || item.type === 'inspiration') &&
    typeof item.detail === 'string' &&
    typeof item.reference === 'string' &&
    (item.status === 'active' || item.status === 'archived' || item.status === 'deleted') &&
    (() => {
      const contentStatus = (item as unknown as { contentStatus?: unknown }).contentStatus;
      return (
        contentStatus === 'not-started' ||
        contentStatus === 'drafting' ||
        contentStatus === 'completed'
      );
    })() &&
    Array.isArray(item.schedules) &&
    item.schedules.every(isTopicSchedule)
  );
}

function isTopicSchedule(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const schedule = value as Partial<TopicItem['schedules'][number]>;
  return (
    typeof schedule.id === 'string' &&
    typeof schedule.date === 'string' &&
    typeof schedule.channel === 'string' &&
    typeof schedule.note === 'string' &&
    (schedule.status === undefined ||
      schedule.status === 'pending' ||
      schedule.status === 'completed' ||
      schedule.status === 'overdue') &&
    (schedule.titleSnapshot === undefined || typeof schedule.titleSnapshot === 'string')
  );
}
