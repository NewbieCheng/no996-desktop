import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { ProductSidebar } from './components/ProductSidebar';
import {
  createScheduleId,
  createTopicId,
  loadTopicItems,
  saveTopicItems,
} from './topicPoolStorage';
import {
  contentStatusLabels,
  scheduleStatusLabels,
  topicStatusLabels,
  topicTypeLabels,
  type TopicItem,
  type TopicSchedule,
  type ScheduleStatus,
  type TopicType,
} from './topicPoolTypes';

type TopicFocus = 'pool' | 'calendar';
type TopicFilter = 'all' | TopicType;
type AgentRole = 'assistant' | 'user';

interface AgentMessage {
  id: string;
  role: AgentRole;
  text: string;
  topic?: TopicItem;
  isError?: boolean;
}

interface TopicPoolPageProps {
  initialFocus: TopicFocus;
}

type AgentParseResult = { missing: string[] } | { topic: TopicItem };

const CALENDAR_YEAR = 2026;
const CALENDAR_MONTH = 8;
const TODAY = '2026-08-24';

const initialAgentMessages: AgentMessage[] = [
  {
    id: 'agent-welcome',
    role: 'assistant',
    text: `你好，我可以帮你把一个想法整理成完整选题。

请告诉我：

1. 想讨论什么主题？
2. 想从什么角度切入？
3. 选题类型是：爆款、热点还是灵感？
4. 是否有参考内容？

示例：我想做一条关于年轻人低度饮酒趋势的内容，切入家庭聚会中的轻饮场景，类型选热点。`,
  },
];

function getScheduleStatus(schedule: TopicSchedule): ScheduleStatus {
  if (schedule.contentId || schedule.status === 'completed') {
    return 'completed';
  }
  return schedule.date < TODAY ? 'overdue' : 'pending';
}

function getCalendarMonthTitle(year: number, month: number) {
  return `${year}年${month}月`;
}

function shiftCalendarMonth(year: number, month: number, offset: number) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function getCreationHash(topic?: TopicItem, schedule?: TopicSchedule, mode = 'create') {
  const params = new URLSearchParams();
  if (topic) {
    params.set('topicId', topic.id);
  }
  if (schedule) {
    params.set('scheduleId', schedule.id);
    params.set('scheduleDate', schedule.date);
  }
  if (topic) {
    params.set('title', topic.title);
    params.set('detail', topic.detail);
    params.set('reference', topic.reference);
    params.set('type', topic.type);
  }
  params.set('mode', mode);
  return `#content-creation?${params.toString()}`;
}

function formatDate(date: string, withWeekday = false) {
  const [, month, day] = date.split('-');
  const dateValue = `${Number(month)}月${Number(day)}日`;
  if (!withWeekday) {
    return dateValue;
  }

  const weekday = new Date(`${date}T00:00:00Z`).toLocaleDateString('zh-CN', {
    weekday: 'short',
    timeZone: 'UTC',
  });
  return `${dateValue} ${weekday}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const leadingDays = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days = Array.from({ length: leadingDays + daysInMonth }, (_, index) => {
    if (index < leadingDays) {
      return null;
    }

    const day = index - leadingDays + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function getTopicTypeFromText(input: string): TopicType | null {
  if (input.includes('爆款')) {
    return 'viral';
  }
  if (input.includes('热点')) {
    return 'hotspot';
  }
  if (input.includes('灵感')) {
    return 'inspiration';
  }
  return null;
}

function getTopicTitleFromText(input: string) {
  const normalized = input
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const aboutMatch = normalized.match(/(?:关于|围绕)(.+?)(?:的内容|内容|趋势|主题|，|,|。|$)/);
  if (aboutMatch?.[1]) {
    return aboutMatch[1].replace(/^(想做一条|做一条|想讨论)/, '').trim();
  }

  const cleaned = normalized
    .replace(/^我想(?:做一条|讨论|聊聊)?/, '')
    .replace(/(?:类型选|类型是).+$/, '')
    .replace(/[，。,].*$/, '')
    .trim();
  return cleaned.length >= 4 ? cleaned.slice(0, 32) : '';
}

function parseAgentRequest(input: string): AgentParseResult {
  const title = getTopicTitleFromText(input);
  const type = getTopicTypeFromText(input);
  const angleMatch = input.match(/(?:从|切入)([^，。,。\n]+)/);
  const referenceMatch = input.match(/参考(?:内容)?[：:]?\s*([^\n。]+)/);

  if (!title || !type) {
    return {
      missing: [!title ? '想讨论的主题' : '', !type ? '选题类型（爆款、热点或灵感）' : ''].filter(
        Boolean,
      ),
    };
  }

  const angle = angleMatch?.[1]?.trim();
  const topic: TopicItem = {
    id: createTopicId(),
    title,
    type,
    detail: angle
      ? `从${angle}切入，整理一条适合继续创作的内容方向，先把真实场景讲清楚。`
      : `围绕${title}整理一条适合继续创作的内容方向，先从真实使用场景开始。`,
    reference: referenceMatch?.[1]?.trim() || '暂无',
    status: 'active',
    schedules: [],
    contentStatus: 'not-started',
  };

  return { topic };
}

function formatScheduleSummary(topic: TopicItem) {
  if (topic.schedules.length === 0) {
    return '未排期';
  }
  if (topic.schedules.length === 1) {
    const [schedule] = topic.schedules;
    return `${formatDate(schedule.date)} · ${schedule.channel}`;
  }
  return `${topic.schedules.length} 个排期`;
}

function TypeBadge({ type }: { type: TopicType }) {
  return (
    <span className={`topic-type-badge topic-type-badge--${type}`}>{topicTypeLabels[type]}</span>
  );
}

function TopicCard({
  topic,
  isFocused,
  isDraggable,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  topic: TopicItem;
  isFocused: boolean;
  isDraggable: boolean;
  onClick: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <article
      className={`topic-card${isFocused ? ' topic-card--focused' : ''}`}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="topic-card__topline">
        <TypeBadge type={topic.type} />
        <span className={`topic-status topic-status--${topic.status}`}>
          {topicStatusLabels[topic.status]}
        </span>
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.detail}</p>
      <div className="topic-card__meta">
        <span>
          <span className="topic-card__meta-label">排期</span>
          {formatScheduleSummary(topic)}
        </span>
        <span>
          <span className="topic-card__meta-label">创作</span>
          {contentStatusLabels[topic.contentStatus]}
        </span>
      </div>
    </article>
  );
}

function CalendarPanel({
  topics,
  year,
  month,
  focusedScheduleId,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onDropTopic,
  onDropSchedule,
  onOpenSchedule,
  onStartBlankCreation,
}: {
  topics: TopicItem[];
  year: number;
  month: number;
  focusedScheduleId: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onDropTopic: (topicId: string, date: string) => void;
  onDropSchedule: (scheduleId: string, date: string) => void;
  onOpenSchedule: (topic: TopicItem, schedule: TopicSchedule) => void;
  onStartBlankCreation: () => void;
}) {
  const calendarDays = useMemo(() => getCalendarDays(year, month), [month, year]);
  const scheduleEntries = useMemo(() => {
    const entries = new Map<string, Array<{ topic: TopicItem; schedule: TopicSchedule }>>();
    topics.forEach((topic) => {
      topic.schedules.forEach((schedule) => {
        const current = entries.get(schedule.date) ?? [];
        current.push({ topic, schedule });
        entries.set(schedule.date, current);
      });
    });
    return entries;
  }, [topics]);

  useEffect(() => {
    if (!focusedScheduleId) {
      return;
    }
    const timer = window.setTimeout(() => {
      document
        .querySelector(`[data-schedule-id="${focusedScheduleId}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusedScheduleId, month, year]);

  const handleDrop = (event: DragEvent<HTMLDivElement>, date: string) => {
    event.preventDefault();
    const scheduleId = event.dataTransfer.getData('text/schedule-id');
    const topicId = event.dataTransfer.getData('text/topic-id');
    if (scheduleId) {
      onDropSchedule(scheduleId, date);
    } else if (topicId) {
      onDropTopic(topicId, date);
    }
  };

  return (
    <section className="topic-calendar-panel" aria-labelledby="topic-calendar-title">
      <div className="topic-calendar-panel__header">
        <div>
          <h2 id="topic-calendar-title">选题排期</h2>
          <p>拖动选题卡到日期，安排内容节奏。</p>
        </div>
        <div className="topic-calendar-panel__controls">
          <button type="button" className="topic-calendar-panel__nav" onClick={onPreviousMonth}>
            上个月
          </button>
          <button type="button" className="topic-calendar-panel__today" onClick={onToday}>
            回到今天
          </button>
          <button type="button" className="topic-calendar-panel__nav" onClick={onNextMonth}>
            下个月
          </button>
        </div>
        <strong className="topic-calendar-panel__month">
          {getCalendarMonthTitle(year, month)}
        </strong>
      </div>
      <div
        className="topic-calendar"
        role="grid"
        aria-label={`${getCalendarMonthTitle(year, month)}选题排期日历`}
      >
        {['一', '二', '三', '四', '五', '六', '日'].map((weekday) => (
          <div className="topic-calendar__weekday" role="columnheader" key={weekday}>
            周{weekday}
          </div>
        ))}
        {calendarDays.map((date, index) => {
          const entries = date ? (scheduleEntries.get(date) ?? []) : [];
          return (
            <div
              className={`topic-calendar__day${date === TODAY ? ' topic-calendar__day--today' : ''}${
                date ? '' : ' topic-calendar__day--empty'
              }`}
              data-date={date ?? undefined}
              role="gridcell"
              key={date ?? `empty-${index}`}
              onDragOver={(event) => {
                if (date) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(event) => {
                if (date) {
                  handleDrop(event, date);
                }
              }}
            >
              {date ? (
                <span className="topic-calendar__day-number">{Number(date.slice(-2))}</span>
              ) : null}
              <div className="topic-calendar__entries">
                {entries.map(({ topic, schedule }) => (
                  <div
                    className={`topic-calendar-entry topic-calendar-entry--${topic.type}${
                      focusedScheduleId === schedule.id ? ' topic-calendar-entry--focused' : ''
                    }`}
                    key={schedule.id}
                    data-schedule-id={schedule.id}
                    draggable
                    role="button"
                    tabIndex={0}
                    aria-label={`${topic.title} ${formatDate(schedule.date)} ${scheduleStatusLabels[getScheduleStatus(schedule)]}`}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/schedule-id', schedule.id);
                    }}
                    onClick={() => onOpenSchedule(topic, schedule)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onOpenSchedule(topic, schedule);
                      }
                    }}
                    title="点击查看排期详情，也可以拖动改期"
                  >
                    <span className="topic-calendar-entry__title">{topic.title}</span>
                    <small>
                      {formatDate(schedule.date)} · {schedule.channel}
                    </small>
                    <span
                      className={`topic-calendar-entry__status topic-schedule-status--${getScheduleStatus(schedule)}`}
                    >
                      {scheduleStatusLabels[getScheduleStatus(schedule)]}
                    </span>
                    <button
                      type="button"
                      className="topic-calendar-entry__action"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenSchedule(topic, schedule);
                      }}
                    >
                      {getScheduleStatus(schedule) === 'completed' ? '查看成稿' : '去创作'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="topic-calendar-panel__hint">
        <span className="topic-drag-mark" aria-hidden="true">
          ↗
        </span>
        从左侧拖动选题到任意日期
      </div>
      <div className="topic-calendar-panel__footer">
        <span>也可以先进入空白内容创作，再主动选择已排期选题。</span>
        <button type="button" className="button button--primary" onClick={onStartBlankCreation}>
          开始创作
        </button>
      </div>
    </section>
  );
}

function TopicAgentDrawer({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (topic: TopicItem) => void;
}) {
  const [messages, setMessages] = useState<AgentMessage[]>(initialAgentMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastRequest, setLastRequest] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setIsSending(false);
    }
  }, [isOpen]);

  const sendRequest = (request: string) => {
    const normalizedRequest = request.trim();
    if (!normalizedRequest || isSending) {
      return;
    }

    setLastRequest(normalizedRequest);
    setInput('');
    setIsSending(true);
    setMessages((current) => [
      ...current,
      { id: createTopicId('agent-message'), role: 'user', text: normalizedRequest },
    ]);

    timerRef.current = window.setTimeout(() => {
      if (normalizedRequest.includes('创建失败')) {
        setMessages((current) => [
          ...current,
          {
            id: createTopicId('agent-message'),
            role: 'assistant',
            text: '这次整理没有完成，请检查输入后重新发送。',
            isError: true,
          },
        ]);
        setIsSending(false);
        return;
      }

      const parsed = parseAgentRequest(normalizedRequest);
      if (!('topic' in parsed)) {
        setMessages((current) => [
          ...current,
          {
            id: createTopicId('agent-message'),
            role: 'assistant',
            text: `我还需要知道${parsed.missing.join('和')}，补充后我再帮你创建选题。`,
          },
        ]);
        setIsSending(false);
        return;
      }

      onCreate(parsed.topic);
      setMessages((current) => [
        ...current,
        {
          id: createTopicId('agent-message'),
          role: 'assistant',
          text: '好的，我已经帮你整理成一条选题，已自动加入选题池。',
          topic: parsed.topic,
        },
      ]);
      setIsSending(false);
    }, 720);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="topic-agent-layer">
      <button
        type="button"
        className="topic-agent-backdrop"
        aria-label="关闭 AI 创建选题"
        onClick={onClose}
      />
      <aside
        className="topic-agent-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-agent-title"
      >
        <div className="topic-agent-drawer__header">
          <div>
            <span className="drawer-kicker">内容增长助手</span>
            <h2 id="topic-agent-title">AI 创建选题</h2>
          </div>
          <button
            type="button"
            className="topic-dialog-close"
            aria-label="关闭 AI 创建选题"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="topic-agent-drawer__body">
          <div className="topic-agent-messages" aria-live="polite">
            {messages.map((message) => (
              <div
                className={`topic-agent-message topic-agent-message--${message.role}`}
                key={message.id}
              >
                <span className="topic-agent-message__role">
                  {message.role === 'assistant' ? 'AI 专家' : '你'}
                </span>
                <p>{message.text}</p>
                {message.topic ? <AgentResult topic={message.topic} /> : null}
                {message.isError && message.id === messages[messages.length - 1]?.id ? (
                  <button
                    type="button"
                    className="button button--secondary topic-agent-retry"
                    onClick={() => sendRequest(lastRequest)}
                  >
                    重新发送
                  </button>
                ) : null}
              </div>
            ))}
            {isSending ? (
              <div className="topic-agent-message topic-agent-message--assistant topic-agent-message--loading">
                <span className="topic-agent-message__role">AI 专家</span>
                <p>正在整理选题...</p>
                <span className="topic-agent-loading-bar" aria-hidden="true" />
              </div>
            ) : null}
          </div>
          <form
            className="topic-agent-composer"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              sendRequest(input);
            }}
          >
            <label htmlFor="topic-agent-input">告诉 AI 你的想法</label>
            <textarea
              id="topic-agent-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="例如：我想做一条关于家庭轻饮场景的内容，类型选热点。"
              rows={4}
            />
            <div className="topic-agent-composer__footer">
              <span>输入主题和类型后，AI 会生成结构化选题。</span>
              <button
                type="submit"
                className="button button--primary"
                disabled={!input.trim() || isSending}
              >
                {isSending ? '整理中' : '发送'}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}

function AgentResult({ topic }: { topic: TopicItem }) {
  return (
    <div className="topic-agent-result">
      <div>
        <span>标题</span>
        <strong>{topic.title}</strong>
      </div>
      <div>
        <span>类型</span>
        <strong>{topicTypeLabels[topic.type]}</strong>
      </div>
      <div>
        <span>选题详情</span>
        <p>{topic.detail}</p>
      </div>
      <div>
        <span>参考内容</span>
        <p>{topic.reference}</p>
      </div>
      <div>
        <span>选题 ID</span>
        <code>{topic.id}</code>
      </div>
    </div>
  );
}

function TopicDetailDialog({
  topic,
  onClose,
  onSave,
  onArchive,
  onDelete,
  onGoToCreation,
  canCreate,
}: {
  topic: TopicItem;
  onClose: () => void;
  onSave: (topic: TopicItem) => void;
  onArchive: () => void;
  onDelete: () => void;
  onGoToCreation: () => void;
  canCreate: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(topic);

  useEffect(() => setDraft(topic), [topic]);

  return (
    <div className="topic-modal-layer">
      <button
        type="button"
        className="topic-modal-backdrop"
        aria-label="关闭选题详情"
        onClick={onClose}
      />
      <section
        className="topic-modal topic-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-detail-title"
      >
        <div className="topic-dialog-header">
          <div>
            <div className="topic-dialog-header__meta">
              <TypeBadge type={topic.type} />
              <span className={`topic-status topic-status--${topic.status}`}>
                {topicStatusLabels[topic.status]}
              </span>
            </div>
            <h2 id="topic-detail-title">{isEditing ? '编辑选题' : '选题详情'}</h2>
          </div>
          <button
            type="button"
            className="topic-dialog-close"
            aria-label="关闭选题详情"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {isEditing ? (
          <div className="topic-edit-form">
            <label>
              选题标题
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </label>
            <label>
              选题类型
              <select
                value={draft.type}
                onChange={(event) => setDraft({ ...draft, type: event.target.value as TopicType })}
              >
                <option value="viral">爆款</option>
                <option value="hotspot">热点</option>
                <option value="inspiration">灵感</option>
              </select>
            </label>
            <label>
              选题详情
              <textarea
                rows={4}
                value={draft.detail}
                onChange={(event) => setDraft({ ...draft, detail: event.target.value })}
              />
            </label>
            <label>
              参考内容
              <textarea
                rows={3}
                value={draft.reference}
                onChange={(event) => setDraft({ ...draft, reference: event.target.value })}
              />
            </label>
            <label>
              选题 ID
              <input value={draft.id} readOnly />
            </label>
          </div>
        ) : (
          <div className="topic-detail-content">
            <h3>{topic.title}</h3>
            <div className="topic-detail-content__block">
              <span>选题详情</span>
              <p>{topic.detail}</p>
            </div>
            <div className="topic-detail-content__block">
              <span>参考内容</span>
              <p>{topic.reference}</p>
            </div>
            <div className="topic-detail-grid">
              <div>
                <span>选题 ID</span>
                <code>{topic.id}</code>
              </div>
              <div>
                <span>当前创作状态</span>
                <strong>{contentStatusLabels[topic.contentStatus]}</strong>
              </div>
            </div>
            <div className="topic-detail-content__block">
              <span>当前排期</span>
              {topic.schedules.length > 0 ? (
                <div className="topic-schedule-list">
                  {topic.schedules.map((schedule) => (
                    <div className="topic-schedule-row" key={schedule.id}>
                      <strong>{formatDate(schedule.date, true)}</strong>
                      <span>{schedule.channel}</span>
                      <em
                        className={`topic-schedule-status topic-schedule-status--${getScheduleStatus(schedule)}`}
                      >
                        {scheduleStatusLabels[getScheduleStatus(schedule)]}
                      </em>
                      <small>{schedule.note}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p>暂无排期，请拖动选题卡到右侧月历。</p>
              )}
            </div>
          </div>
        )}

        <div className="topic-dialog-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setIsEditing(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  onSave(draft);
                  setIsEditing(false);
                }}
              >
                保存修改
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setIsEditing(true)}
              >
                编辑
              </button>
              <button type="button" className="button button--secondary" onClick={onArchive}>
                {topic.status === 'archived' ? '恢复' : '归档'}
              </button>
              <button type="button" className="button button--danger" onClick={onDelete}>
                删除
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={onGoToCreation}
                disabled={!canCreate}
                title={!canCreate ? '该选题没有可继续创作的排期' : undefined}
              >
                去创作
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ScheduleDetailDialog({
  topic,
  schedule,
  onClose,
  onViewTopic,
  onCancel,
  onGoToCreation,
  onViewContent,
}: {
  topic: TopicItem;
  schedule: TopicSchedule;
  onClose: () => void;
  onViewTopic: () => void;
  onCancel: () => void;
  onGoToCreation: () => void;
  onViewContent: () => void;
}) {
  const scheduleStatus = getScheduleStatus(schedule);
  const isCompleted = scheduleStatus === 'completed';
  return (
    <div className="topic-modal-layer">
      <button
        type="button"
        className="topic-modal-backdrop"
        aria-label="关闭排期详情"
        onClick={onClose}
      />
      <section
        className="topic-modal topic-schedule-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-detail-title"
      >
        <div className="topic-dialog-header">
          <div>
            <span className="drawer-kicker">内容排期</span>
            <h2 id="schedule-detail-title">排期详情</h2>
          </div>
          <button
            type="button"
            className="topic-dialog-close"
            aria-label="关闭排期详情"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="topic-schedule-detail">
          <div className="topic-schedule-detail__date">
            <strong>{formatDate(schedule.date, true)}</strong>
            <span>{schedule.channel}</span>
            <em className={`topic-schedule-status topic-schedule-status--${scheduleStatus}`}>
              {scheduleStatusLabels[scheduleStatus]}
            </em>
          </div>
          <h3>{topic.title}</h3>
          <span className="topic-schedule-detail__snapshot">
            标题快照：{schedule.titleSnapshot}
          </span>
          <p>{schedule.note || '暂无排期备注。'}</p>
          <div className="topic-detail-grid">
            <div>
              <span>选题类型</span>
              <strong>{topicTypeLabels[topic.type]}</strong>
            </div>
            <div>
              <span>{isCompleted ? '成稿 ID' : '当前状态'}</span>
              <strong>
                {isCompleted
                  ? (schedule.contentId ?? topic.contentId ?? '已关联成稿')
                  : scheduleStatusLabels[scheduleStatus]}
              </strong>
            </div>
          </div>
        </div>
        <div className="topic-dialog-footer">
          <button type="button" className="button button--danger" onClick={onCancel}>
            取消排期
          </button>
          <button type="button" className="button button--secondary" onClick={onViewTopic}>
            查看选题
          </button>
          {isCompleted ? (
            <button type="button" className="button button--primary" onClick={onViewContent}>
              查看成稿
            </button>
          ) : (
            <button type="button" className="button button--primary" onClick={onGoToCreation}>
              去创作
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function SchedulePickerDialog({
  topic,
  onClose,
  onConfirm,
}: {
  topic: TopicItem;
  onClose: () => void;
  onConfirm: (schedule: TopicSchedule) => void;
}) {
  const [selectedScheduleId, setSelectedScheduleId] = useState(topic.schedules[0]?.id ?? '');
  const selectedSchedule = topic.schedules.find((schedule) => schedule.id === selectedScheduleId);
  return (
    <div className="topic-modal-layer">
      <button
        type="button"
        className="topic-modal-backdrop"
        aria-label="关闭排期选择"
        onClick={onClose}
      />
      <section
        className="topic-modal topic-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-picker-title"
      >
        <div className="topic-dialog-header">
          <div>
            <span className="drawer-kicker">多个排期</span>
            <h2 id="schedule-picker-title">选择排期</h2>
          </div>
          <button
            type="button"
            className="topic-dialog-close"
            aria-label="关闭排期选择"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="topic-picker-body">
          <p>这个选题有多个排期，请选择要进入内容创作的排期。</p>
          <div className="topic-picker-list">
            {topic.schedules.map((schedule) => (
              <button
                type="button"
                className={`topic-picker-option${selectedScheduleId === schedule.id ? ' topic-picker-option--selected' : ''}`}
                key={schedule.id}
                onClick={() => setSelectedScheduleId(schedule.id)}
              >
                <span>
                  <strong>{formatDate(schedule.date, true)}</strong>
                  <small>{schedule.note}</small>
                </span>
                <em>{schedule.channel}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="topic-dialog-footer">
          <button type="button" className="button button--secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="button button--primary"
            disabled={!selectedSchedule}
            onClick={() => selectedSchedule && onConfirm(selectedSchedule)}
          >
            确认去创作
          </button>
        </div>
      </section>
    </div>
  );
}

function ScheduleDateDialog({
  topic,
  onClose,
  onSkip,
  onConfirm,
}: {
  topic: TopicItem;
  onClose: () => void;
  onSkip: () => void;
  onConfirm: (date: string) => void;
}) {
  const [date, setDate] = useState(TODAY);
  return (
    <div className="topic-modal-layer topic-modal-layer--confirm">
      <button
        type="button"
        className="topic-modal-backdrop"
        aria-label="关闭日期选择"
        onClick={onClose}
      />
      <section
        className="topic-modal topic-date-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-date-title"
      >
        <div className="topic-dialog-header">
          <div>
            <span className="drawer-kicker">进入创作前</span>
            <h2 id="topic-date-title">是否先安排一个创作日期？</h2>
          </div>
          <button
            type="button"
            className="topic-dialog-close"
            aria-label="关闭日期选择"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="topic-date-dialog__body">
          <p>为「{topic.title}」安排排期，之后可以从日历进入内容创作。</p>
          <label htmlFor="topic-creation-date">创作日期</label>
          <input
            id="topic-creation-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="topic-dialog-footer">
          <button type="button" className="button button--secondary" onClick={onSkip}>
            跳过排期
          </button>
          <button
            type="button"
            className="button button--primary"
            disabled={!date}
            onClick={() => onConfirm(date)}
          >
            确认排期
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfirmCancelScheduleDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="topic-modal-layer topic-modal-layer--confirm">
      <button
        type="button"
        className="topic-modal-backdrop"
        aria-label="关闭取消排期确认"
        onClick={onClose}
      />
      <section
        className="topic-modal topic-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-schedule-title"
      >
        <div className="topic-dialog-header">
          <div>
            <span className="drawer-kicker">请确认操作</span>
            <h2 id="cancel-schedule-title">取消排期</h2>
          </div>
          <button
            type="button"
            className="topic-dialog-close"
            aria-label="关闭取消排期确认"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="topic-confirm-dialog__body">
          <p>确定取消这条排期吗？</p>
          <small>已生成的内容不会被删除。</small>
        </div>
        <div className="topic-dialog-footer">
          <button type="button" className="button button--secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="button button--danger" onClick={onConfirm}>
            确认取消
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfirmDeleteDialog({
  onClose,
  onConfirm,
  hasIncompleteSchedules,
}: {
  onClose: () => void;
  onConfirm: () => void;
  hasIncompleteSchedules: boolean;
}) {
  return (
    <div className="topic-modal-layer topic-modal-layer--confirm">
      <button
        type="button"
        className="topic-modal-backdrop"
        aria-label="关闭删除确认"
        onClick={onClose}
      />
      <section
        className="topic-modal topic-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-delete-title"
      >
        <div className="topic-dialog-header">
          <div>
            <span className="drawer-kicker">请确认操作</span>
            <h2 id="topic-delete-title">删除选题</h2>
          </div>
          <button
            type="button"
            className="topic-dialog-close"
            aria-label="关闭删除确认"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="topic-confirm-dialog__body">
          <p>
            {hasIncompleteSchedules
              ? '当前选题还有未完成的排期，删除后会移除已计划的排期。'
              : '删除后，这条选题将从选题池和排期日历中移除。'}
          </p>
          <small>已生成的成稿和已完成排期历史会保留。</small>
        </div>
        <div className="topic-dialog-footer">
          <button type="button" className="button button--secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="button button--danger" onClick={onConfirm}>
            确认删除
          </button>
        </div>
      </section>
    </div>
  );
}

export function TopicPoolPage({ initialFocus }: TopicPoolPageProps) {
  const [topics, setTopics] = useState<TopicItem[]>(loadTopicItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TopicFilter>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<{
    topic: TopicItem;
    schedule: TopicSchedule;
  } | null>(null);
  const [schedulePickerTopic, setSchedulePickerTopic] = useState<TopicItem | null>(null);
  const [scheduleDateTopic, setScheduleDateTopic] = useState<TopicItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{
    topic: TopicItem;
    schedule: TopicSchedule;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TopicItem | null>(null);
  const [focusedTopicId, setFocusedTopicId] = useState('');
  const [focusedScheduleId, setFocusedScheduleId] = useState('');
  const [draggedTopicId, setDraggedTopicId] = useState('');
  const [toast, setToast] = useState('');
  const [calendarCursor, setCalendarCursor] = useState({
    year: CALENDAR_YEAR,
    month: CALENDAR_MONTH,
  });
  const handledTopicQueryRef = useRef(false);

  const activeTopics = useMemo(() => topics.filter((topic) => topic.status === 'active'), [topics]);
  const archivedTopics = useMemo(
    () => topics.filter((topic) => topic.status === 'archived'),
    [topics],
  );
  const visibleTopics = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const scope = showArchived ? archivedTopics : activeTopics;
    return scope.filter((topic) => {
      const matchesType = typeFilter === 'all' || topic.type === typeFilter;
      const matchesSearch = !normalizedQuery || topic.title.toLowerCase().includes(normalizedQuery);
      return matchesType && matchesSearch;
    });
  }, [activeTopics, archivedTopics, searchQuery, showArchived, typeFilter]);

  const stats = useMemo(
    () => ({
      total: activeTopics.length,
      viral: activeTopics.filter((topic) => topic.type === 'viral').length,
      hotspot: activeTopics.filter((topic) => topic.type === 'hotspot').length,
      inspiration: activeTopics.filter((topic) => topic.type === 'inspiration').length,
    }),
    [activeTopics],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const topicId = params.get('topicId');
    if (topicId && !handledTopicQueryRef.current) {
      const topic = topics.find((item) => item.id === topicId);
      if (topic) {
        setSelectedTopic(topic);
        setFocusedTopicId(topic.id);
        handledTopicQueryRef.current = true;
      }
    }
  }, [topics]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateTopics = (updater: (current: TopicItem[]) => TopicItem[]) => {
    setTopics((current) => {
      const next = updater(current);
      saveTopicItems(next);
      return next;
    });
  };

  const handleCreateTopic = (topic: TopicItem) => {
    updateTopics((current) => [topic, ...current]);
    setFocusedTopicId(topic.id);
    setToast(`已创建「${topic.title}」`);
  };

  const handleAddSchedule = (topicId: string, date: string) => {
    const topic = topics.find((item) => item.id === topicId);
    if (!topic || topic.status !== 'active') {
      return;
    }
    if (topic.schedules.some((schedule) => schedule.date === date)) {
      setToast('该选题在这一天已经排期');
      return;
    }

    const schedule: TopicSchedule = {
      id: createScheduleId(),
      date,
      channel: '待定平台',
      note: '拖拽生成的排期，后续可在内容创作中确认平台。',
      titleSnapshot: topic.title,
      status: 'pending',
    };
    updateTopics((current) =>
      current.map((item) =>
        item.id === topicId ? { ...item, schedules: [...item.schedules, schedule] } : item,
      ),
    );
    setToast(`已安排在${formatDate(date)}`);
  };

  const handleReschedule = (scheduleId: string, date: string) => {
    const source = topics
      .map((topic) => ({ topic, schedule: topic.schedules.find((item) => item.id === scheduleId) }))
      .find((item): item is { topic: TopicItem; schedule: TopicSchedule } =>
        Boolean(item.schedule),
      );
    if (!source || source.topic.status !== 'active') {
      return;
    }
    if (source.schedule.date === date) {
      return;
    }
    if (
      source.topic.schedules.some(
        (schedule) => schedule.id !== scheduleId && schedule.date === date,
      )
    ) {
      setToast('该选题在这一天已经排期');
      return;
    }
    updateTopics((current) =>
      current.map((topic) =>
        topic.id === source.topic.id
          ? {
              ...topic,
              schedules: topic.schedules.map((schedule) =>
                schedule.id === scheduleId
                  ? { ...schedule, date, status: schedule.contentId ? 'completed' : 'pending' }
                  : schedule,
              ),
            }
          : topic,
      ),
    );
    setCalendarCursor({ year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) });
    setFocusedScheduleId(scheduleId);
    setToast(`已改期至${formatDate(date)}`);
  };

  const handleCancelSchedule = () => {
    if (!cancelTarget) {
      return;
    }
    const { topic, schedule } = cancelTarget;
    updateTopics((current) =>
      current.map((item) =>
        item.id === topic.id
          ? {
              ...item,
              schedules: item.schedules.filter((itemSchedule) => itemSchedule.id !== schedule.id),
            }
          : item,
      ),
    );
    setCancelTarget(null);
    setSelectedSchedule(null);
    setToast('已取消排期');
  };

  const handleGoToCreation = (topic: TopicItem, schedule?: TopicSchedule) => {
    if (topic.status !== 'active') {
      setToast('已归档选题不能进入新的创作流程，请先恢复选题');
      return;
    }
    if (schedule) {
      window.location.hash = getCreationHash(topic, schedule);
      return;
    }
    const creatableSchedules = topic.schedules.filter(
      (item) => getScheduleStatus(item) !== 'completed',
    );
    if (creatableSchedules.length === 0 && topic.schedules.length === 0) {
      setScheduleDateTopic(topic);
      return;
    }
    if (creatableSchedules.length > 1) {
      setSelectedSchedule(null);
      setSchedulePickerTopic(topic);
      return;
    }
    if (creatableSchedules.length === 1) {
      window.location.hash = getCreationHash(topic, creatableSchedules[0]);
    }
  };

  const handleCreateScheduleForCreation = (date: string) => {
    if (!scheduleDateTopic) {
      return;
    }
    if (scheduleDateTopic.schedules.some((schedule) => schedule.date === date)) {
      setToast('该选题在这一天已经排期');
      return;
    }
    const schedule: TopicSchedule = {
      id: createScheduleId(),
      date,
      channel: '待定平台',
      note: '从去创作流程创建的排期，后续可在内容创作中确认平台。',
      titleSnapshot: scheduleDateTopic.title,
      status: 'pending',
    };
    updateTopics((current) =>
      current.map((topic) =>
        topic.id === scheduleDateTopic.id
          ? { ...topic, schedules: [...topic.schedules, schedule] }
          : topic,
      ),
    );
    setScheduleDateTopic(null);
    setCalendarCursor({ year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) });
    setFocusedScheduleId(schedule.id);
    setSelectedTopic(null);
    setToast(`已安排在${formatDate(date)}，请从日历进入创作`);
  };

  const handleSaveTopic = (nextTopic: TopicItem) => {
    updateTopics((current) => current.map((item) => (item.id === nextTopic.id ? nextTopic : item)));
    setSelectedTopic(nextTopic);
    setToast('选题已保存');
  };

  const handleArchiveTopic = (topic: TopicItem) => {
    const hasIncompleteSchedules = topic.schedules.some(
      (schedule) => getScheduleStatus(schedule) !== 'completed',
    );
    if (topic.status === 'active' && hasIncompleteSchedules) {
      setToast('当前选题还有未完成的排期，完成或取消排期后才能归档。');
      return;
    }
    const nextStatus: TopicItem['status'] = topic.status === 'archived' ? 'active' : 'archived';
    updateTopics((current) =>
      current.map((item) => (item.id === topic.id ? { ...item, status: nextStatus } : item)),
    );
    setSelectedTopic(null);
    setToast(nextStatus === 'archived' ? '选题已归档' : '选题已恢复');
  };

  const handleDeleteTopic = () => {
    if (!deleteTarget) {
      return;
    }
    const deletedId = deleteTarget.id;
    updateTopics((current) =>
      current.map((item) =>
        item.id === deletedId
          ? {
              ...item,
              status: 'deleted',
              schedules: item.schedules.filter(
                (schedule) => getScheduleStatus(schedule) === 'completed',
              ),
            }
          : item,
      ),
    );
    setDeleteTarget(null);
    setSelectedTopic(null);
    setSelectedSchedule(null);
    setToast('选题已删除');
  };

  const handleStartBlankCreation = () => {
    window.location.hash = '#content-creation?mode=blank';
  };

  const openTopicDetail = (topic: TopicItem) => {
    setFocusedTopicId(topic.id);
    setSelectedTopic(topic);
  };

  return (
    <div className="app-shell app-shell--topic-pool">
      <ProductSidebar
        activeModule={initialFocus === 'calendar' ? 'topic-calendar' : 'topic-pool'}
      />
      <main className="app-main topic-pool-main" id="topic-pool">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>内容增长</span>
            <span aria-hidden="true">/</span>
            <strong>选题池与排期</strong>
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>

        <div className="page-content topic-pool-content">
          <div className="topic-pool-top-row">
            <div className="topic-stat-strip" aria-label="选题统计">
              <div className="topic-stat-item topic-stat-item--total">
                <span>总计</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="topic-stat-item">
                <span>爆款</span>
                <strong>{stats.viral}</strong>
              </div>
              <div className="topic-stat-item">
                <span>热点</span>
                <strong>{stats.hotspot}</strong>
              </div>
              <div className="topic-stat-item">
                <span>灵感</span>
                <strong>{stats.inspiration}</strong>
              </div>
            </div>
            <div className="topic-pool-heading__actions">
              <button
                type="button"
                className="button button--secondary topic-pool-heading__hotspot"
                onClick={() => {
                  window.location.hash = '#hotspot-radar?return=topic-pool';
                }}
              >
                <span aria-hidden="true">⌕</span>
                找热点
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => setIsAgentOpen(true)}
              >
                <span aria-hidden="true">＋</span>
                新建选题
              </button>
            </div>
          </div>

          <div className="topic-workspace">
            <section
              className={`topic-pool-panel${initialFocus === 'pool' ? ' topic-panel--focus' : ''}`}
              aria-labelledby="topic-pool-title"
            >
              <div className="topic-pool-panel__header">
                <div>
                  <div className="topic-pool-panel__title-row">
                    <h2 id="topic-pool-title">{showArchived ? '已归档选题' : '选题池'}</h2>
                    <span>{visibleTopics.length} 条</span>
                  </div>
                  <p>
                    {showArchived
                      ? '已归档的选题可以恢复到正常池。'
                      : '爆款、热点和灵感统一放在这里。'}
                  </p>
                </div>
                <button
                  type="button"
                  className="topic-archive-toggle"
                  onClick={() => setShowArchived((current) => !current)}
                >
                  {showArchived ? '返回正常选题' : `已归档 ${archivedTopics.length}`}
                </button>
              </div>
              <div className="topic-pool-toolbar">
                <label className="topic-search">
                  <span aria-hidden="true">⌕</span>
                  <span className="visually-hidden">搜索选题</span>
                  <input
                    type="search"
                    aria-label="搜索选题标题"
                    placeholder="搜索选题标题"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>
                <div className="topic-filter-tabs" aria-label="选题类型筛选">
                  {(['all', 'viral', 'hotspot', 'inspiration'] as const).map((filter) => (
                    <button
                      type="button"
                      className={`topic-filter-tab${typeFilter === filter ? ' topic-filter-tab--active' : ''}`}
                      aria-pressed={typeFilter === filter}
                      key={filter}
                      onClick={() => setTypeFilter(filter)}
                    >
                      {filter === 'all' ? '全部' : topicTypeLabels[filter]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="topic-card-list">
                {visibleTopics.length > 0 ? (
                  visibleTopics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      isFocused={focusedTopicId === topic.id}
                      isDraggable={!showArchived && topic.status === 'active'}
                      onClick={() => openTopicDetail(topic)}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/topic-id', topic.id);
                        setDraggedTopicId(topic.id);
                      }}
                      onDragEnd={() => setDraggedTopicId('')}
                    />
                  ))
                ) : (
                  <div className="topic-empty-state">
                    <span className="topic-empty-state__mark" aria-hidden="true">
                      ⌕
                    </span>
                    <h3>{showArchived ? '还没有已归档选题' : '没有匹配的选题'}</h3>
                    <p>
                      {showArchived ? '归档选题会出现在这里。' : '试试调整搜索关键词或类型筛选。'}
                    </p>
                    {!showArchived ? (
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => {
                          setSearchQuery('');
                          setTypeFilter('all');
                        }}
                      >
                        清除筛选
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
              {draggedTopicId ? (
                <p className="topic-dragging-hint">正在拖动选题，请放到右侧日历的日期上。</p>
              ) : null}
            </section>

            <section
              className={`topic-calendar-wrap${initialFocus === 'calendar' ? ' topic-panel--focus' : ''}`}
              aria-label="选题排期区域"
            >
              <CalendarPanel
                topics={activeTopics}
                year={calendarCursor.year}
                month={calendarCursor.month}
                focusedScheduleId={focusedScheduleId}
                onPreviousMonth={() =>
                  setCalendarCursor((current) =>
                    shiftCalendarMonth(current.year, current.month, -1),
                  )
                }
                onNextMonth={() =>
                  setCalendarCursor((current) => shiftCalendarMonth(current.year, current.month, 1))
                }
                onToday={() => setCalendarCursor({ year: CALENDAR_YEAR, month: CALENDAR_MONTH })}
                onDropTopic={handleAddSchedule}
                onDropSchedule={handleReschedule}
                onOpenSchedule={(topic, schedule) => setSelectedSchedule({ topic, schedule })}
                onStartBlankCreation={handleStartBlankCreation}
              />
            </section>
          </div>
        </div>
      </main>

      <TopicAgentDrawer
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        onCreate={handleCreateTopic}
      />
      {selectedTopic ? (
        <TopicDetailDialog
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
          onSave={handleSaveTopic}
          onArchive={() => handleArchiveTopic(selectedTopic)}
          onDelete={() => setDeleteTarget(selectedTopic)}
          onGoToCreation={() => handleGoToCreation(selectedTopic)}
          canCreate={
            selectedTopic.status === 'active' &&
            (selectedTopic.schedules.length === 0 ||
              selectedTopic.schedules.some(
                (schedule) => getScheduleStatus(schedule) !== 'completed',
              ))
          }
        />
      ) : null}
      {selectedSchedule ? (
        <ScheduleDetailDialog
          topic={selectedSchedule.topic}
          schedule={selectedSchedule.schedule}
          onClose={() => setSelectedSchedule(null)}
          onViewTopic={() => {
            setSelectedTopic(selectedSchedule.topic);
            setSelectedSchedule(null);
          }}
          onCancel={() => setCancelTarget(selectedSchedule)}
          onGoToCreation={() =>
            handleGoToCreation(selectedSchedule.topic, selectedSchedule.schedule)
          }
          onViewContent={() => {
            window.location.hash = getCreationHash(
              selectedSchedule.topic,
              selectedSchedule.schedule,
              'preview',
            );
          }}
        />
      ) : null}
      {schedulePickerTopic ? (
        <SchedulePickerDialog
          topic={schedulePickerTopic}
          onClose={() => setSchedulePickerTopic(null)}
          onConfirm={(schedule) => handleGoToCreation(schedulePickerTopic, schedule)}
        />
      ) : null}
      {scheduleDateTopic ? (
        <ScheduleDateDialog
          topic={scheduleDateTopic}
          onClose={() => setScheduleDateTopic(null)}
          onSkip={() => {
            const topic = scheduleDateTopic;
            setScheduleDateTopic(null);
            window.location.hash = getCreationHash(topic);
          }}
          onConfirm={handleCreateScheduleForCreation}
        />
      ) : null}
      {cancelTarget ? (
        <ConfirmCancelScheduleDialog
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelSchedule}
        />
      ) : null}
      {deleteTarget ? (
        <ConfirmDeleteDialog
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteTopic}
          hasIncompleteSchedules={deleteTarget.schedules.some(
            (schedule) => getScheduleStatus(schedule) !== 'completed',
          )}
        />
      ) : null}
      {toast ? (
        <div className="expert-toast topic-toast" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>
          {toast}
        </div>
      ) : null}
    </div>
  );
}
