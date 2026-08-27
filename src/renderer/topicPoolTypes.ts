export type TopicType = 'viral' | 'hotspot' | 'inspiration';
export type TopicStatus = 'active' | 'archived' | 'deleted';
export type ContentStatus = 'not-started' | 'completed';
export type ScheduleStatus = 'pending' | 'completed' | 'overdue';

export interface TopicSchedule {
  id: string;
  date: string;
  channel: string;
  note: string;
  titleSnapshot: string;
  status: ScheduleStatus;
  contentId?: string;
}

export interface TopicItem {
  id: string;
  title: string;
  type: TopicType;
  detail: string;
  reference: string;
  status: TopicStatus;
  schedules: TopicSchedule[];
  contentStatus: ContentStatus;
  contentId?: string;
  sourceHotspotId?: string;
}

export const topicTypeLabels: Record<TopicType, string> = {
  viral: '爆款',
  hotspot: '热点',
  inspiration: '灵感',
};

export const topicStatusLabels: Record<TopicStatus, string> = {
  active: '正常',
  archived: '已归档',
  deleted: '已删除',
};

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  pending: '待创作',
  completed: '已完成',
  overdue: '已逾期',
};

export const contentStatusLabels: Record<ContentStatus, string> = {
  'not-started': '未关联成稿',
  completed: '已关联成稿',
};
