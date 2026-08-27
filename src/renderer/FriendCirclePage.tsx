import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { initialBrainDocuments } from './enterpriseBrainMockData';
import { ProductSidebar } from './components/ProductSidebar';
import {
  addWeeks,
  createContent,
  createScheduleWeek,
  defaultFriendCircleConfig,
  formatShortDate,
  formatWeekRange,
  FRIEND_CIRCLE_CURRENT_WEEK,
  getWeekDates,
  getMarkdownDocuments,
  type FriendCircleContent,
  type FriendCircleDay,
  type FriendCircleMaterial,
  type FriendCircleMode,
  type FriendCircleWeek,
  type FriendCircleWeekConfig,
  initialFriendCircleWeeks,
  friendCircleActivities,
  friendCircleProducts,
} from './friendCircleMockData';

type FriendCircleView = 'overview' | 'config' | 'planning' | 'materials' | 'content';

type ProcessingKind = 'week' | 'day' | 'rewrite';
type ProcessingSource = 'create' | 'regenerate';

interface ProcessingState {
  kind: ProcessingKind;
  source?: ProcessingSource;
  dayDate?: string;
  contentId?: string;
  step: number;
  attempt: number;
}

interface GenerationError {
  kind: ProcessingKind;
  message: string;
  dayDate?: string;
  contentId?: string;
}

interface EditDraft {
  dayDate: string;
  topicIndex: number | null;
  theme: string;
  topic: string;
}

const weekProcessingSteps = [
  '正在理解本周运营目标',
  '正在拆解内容主题',
  '正在安排每日发布节奏',
  '正在生成朋友圈选题',
];

const dayProcessingSteps = ['正在整理当天选题和素材', '正在整理不同表达角度', '正在生成不同版本'];

const rewriteProcessingSteps = ['正在调整表达语气', '正在保留当前选题', '正在生成三个版本'];
const friendCircleWeekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function formatFullDate(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)} 月 ${Number(day)} 日`;
}

function getEmptyWeek(start: string): FriendCircleWeek {
  return {
    start,
    hasSchedule: false,
    generationStatus: 'idle',
    config: null,
    days: [],
  };
}

function getConfigForWeek(week: FriendCircleWeek): FriendCircleWeekConfig {
  return week.config
    ? { ...week.config }
    : {
        ...defaultFriendCircleConfig,
        purpose: '',
        tasks: '',
        productName: '',
        activityName: '',
      };
}

function getContentTopic(day: FriendCircleDay, content: FriendCircleContent) {
  return day.topics.find((topic) => topic.id === content.topicId);
}

function getSelectedMaterial(day: FriendCircleDay, topicId: string): FriendCircleMaterial {
  return day.materials[topicId] ?? { documentIds: [], manual: '' };
}

function updateDayInWeek(
  week: FriendCircleWeek,
  dayDate: string,
  updater: (day: FriendCircleDay) => FriendCircleDay,
) {
  return {
    ...week,
    days: week.days.map((day) => (day.date === dayDate ? updater(day) : day)),
  };
}

function ProcessingPanel({
  state,
  day,
  error,
  onRetry,
  onBack,
}: {
  state: ProcessingState;
  day: FriendCircleDay | null;
  error: GenerationError | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const steps =
    state.kind === 'week'
      ? weekProcessingSteps
      : state.kind === 'day'
        ? dayProcessingSteps
        : rewriteProcessingSteps;
  const title =
    state.kind === 'week'
      ? state.source === 'regenerate'
        ? '正在重新生成本周朋友圈排期'
        : '正在规划本周朋友圈内容'
      : state.kind === 'day'
        ? `正在生成${day?.weekday ?? '当天'}的朋友圈内容`
        : '正在根据优化要求重写这条朋友圈';
  const description =
    state.kind === 'week'
      ? 'Agent 会根据本周目标和发布节奏整理一份可编辑的排期。'
      : state.kind === 'day'
        ? '只处理当前日期，不会影响其他日期的生成状态。'
        : '保留当前选题，只更新这条朋友圈的三个表达版本。';

  if (error) {
    return (
      <section className="fc-processing-shell" aria-labelledby="fc-processing-title">
        <p className="page-kicker">朋友圈经营 / 状态反馈</p>
        <h1 id="fc-processing-title">这次处理没有完成</h1>
        <div className="fc-error-card" role="alert">
          <span className="fc-error-card__mark" aria-hidden="true">
            !
          </span>
          <div>
            <strong>{error.message}</strong>
            <p>已保留当前排期和素材，你可以重新尝试。</p>
          </div>
          <div className="fc-error-card__actions">
            <button type="button" className="button button--secondary" onClick={onBack}>
              返回查看
            </button>
            <button type="button" className="button button--primary" onClick={onRetry}>
              重新生成
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="fc-processing-shell" aria-labelledby="fc-processing-title">
      <p className="page-kicker">朋友圈经营 / Agent 处理中</p>
      <h1 id="fc-processing-title">{title}</h1>
      <p className="fc-processing-description">{description}</p>
      <div className="fc-processing-card" role="status" aria-live="polite">
        <div className="fc-processing-card__topline">
          <span>朋友圈生成助手</span>
          <span>
            {Math.min(state.step + 1, steps.length)} / {steps.length}
          </span>
        </div>
        <div className="fc-processing-progress" aria-hidden="true">
          <span style={{ width: `${Math.min(100, ((state.step + 1) / steps.length) * 100)}%` }} />
        </div>
        <div className="fc-processing-steps">
          {steps.map((step, index) => (
            <div
              className={`fc-processing-step${index < state.step ? ' is-complete' : ''}${index === state.step ? ' is-active' : ''}`}
              key={step}
            >
              <span aria-hidden="true">
                {index < state.step ? '✓' : index === state.step ? '·' : ''}
              </span>
              <strong>
                {step}
                {index === state.step ? '...' : ''}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WeekNavigation({
  start,
  onPrevious,
  onNext,
}: {
  start: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fc-week-navigation" aria-label="周排期切换">
      <button type="button" className="fc-week-navigation__button" onClick={onPrevious}>
        ‹ 上一周
      </button>
      <strong>{formatWeekRange(start)}</strong>
      <button type="button" className="fc-week-navigation__button" onClick={onNext}>
        下一周 ›
      </button>
    </div>
  );
}

function ScheduleCard({
  day,
  mode,
  onGenerate,
  onView,
  onEditTheme,
  onEditTopic,
}: {
  day: FriendCircleDay;
  mode: 'overview' | 'planning';
  onGenerate: () => void;
  onView: () => void;
  onEditTheme?: () => void;
  onEditTopic?: (topicIndex: number) => void;
}) {
  const actionLabel =
    day.status === 'generating'
      ? '生成中'
      : day.status === 'completed'
        ? '查看'
        : day.status === 'failed'
          ? '重新生成'
          : '生成朋友圈';
  const isDisabled = day.status === 'generating';

  return (
    <article className={`fc-schedule-card fc-schedule-card--${day.status}`}>
      <div className="fc-schedule-card__date">
        <strong>{day.weekday}</strong>
        <span>{formatShortDate(day.date)}</span>
        {day.status === 'completed' ? <small>已生成</small> : null}
        {day.status === 'failed' ? <small className="is-error">生成失败</small> : null}
      </div>
      <div className="fc-schedule-card__body">
        <div className="fc-schedule-card__theme-line">
          <span>当日主题</span>
          <strong>{day.theme}</strong>
          {mode === 'planning' && onEditTheme ? (
            <button type="button" className="fc-inline-link" onClick={onEditTheme}>
              编辑
            </button>
          ) : null}
        </div>
        <div className="fc-schedule-card__topic-heading">
          <span>朋友圈选题</span>
          {mode === 'planning' ? <small>{day.topics.length} 条</small> : null}
        </div>
        <ol className="fc-topic-list">
          {day.topics.map((topic, index) => (
            <li key={topic.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{topic.title}</strong>
              {mode === 'planning' && onEditTopic ? (
                <button type="button" className="fc-inline-link" onClick={() => onEditTopic(index)}>
                  编辑
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
      <div className="fc-schedule-card__action">
        {day.status === 'failed' ? (
          <span className="fc-status-text fc-status-text--error">本日生成失败</span>
        ) : null}
        <button
          type="button"
          className={`button ${day.status === 'completed' ? 'button--secondary' : 'button--primary'} fc-schedule-action`}
          disabled={isDisabled}
          onClick={day.status === 'completed' ? onView : onGenerate}
        >
          {day.status === 'generating' ? (
            <span className="fc-button-loading-mark" aria-hidden="true" />
          ) : null}
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

function ModeCard({
  mode,
  active,
  title,
  description,
  onSelect,
}: {
  mode: FriendCircleMode;
  active: boolean;
  title: string;
  description: string;
  onSelect: (mode: FriendCircleMode) => void;
}) {
  return (
    <button
      type="button"
      className={`fc-mode-card${active ? ' is-selected' : ''}`}
      aria-pressed={active}
      onClick={() => onSelect(mode)}
    >
      <span className="fc-radio" aria-hidden="true" />
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}

export function FriendCirclePage() {
  const [activeView, setActiveView] = useState<FriendCircleView>('overview');
  const [activeWeekStart, setActiveWeekStart] = useState(FRIEND_CIRCLE_CURRENT_WEEK);
  const [weeks, setWeeks] = useState<Record<string, FriendCircleWeek>>(() => ({
    ...initialFriendCircleWeeks,
  }));
  const [configDraft, setConfigDraft] = useState<FriendCircleWeekConfig>(() => ({
    ...defaultFriendCircleConfig,
  }));
  const [configError, setConfigError] = useState('');
  const [picker, setPicker] = useState<'product' | 'activity' | null>(null);
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [processingError, setProcessingError] = useState<GenerationError | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState('');
  const [openMaterialTopicId, setOpenMaterialTopicId] = useState<string | null>(null);
  const [documentQuery, setDocumentQuery] = useState('');
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [overallSuggestion, setOverallSuggestion] = useState('');
  const [detailContentId, setDetailContentId] = useState<string | null>(null);
  const [detailVersion, setDetailVersion] = useState<0 | 1 | 2>(0);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState('');
  const [rewriteSuggestion, setRewriteSuggestion] = useState('');
  const [copiedContentId, setCopiedContentId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const week = weeks[activeWeekStart] ?? getEmptyWeek(activeWeekStart);
  const selectedDay = week.days.find((day) => day.date === selectedDayDate) ?? null;
  const detailDay =
    week.days.find((day) => day.contents.some((content) => content.id === detailContentId)) ?? null;
  const detailContent =
    detailDay?.contents.find((content) => content.id === detailContentId) ?? null;
  const markdownDocuments = useMemo(() => getMarkdownDocuments(initialBrainDocuments), []);
  const visibleDocuments = useMemo(() => {
    const query = documentQuery.trim().toLowerCase();
    if (!query) return markdownDocuments;
    return markdownDocuments.filter((document) =>
      `${document.title} ${document.fileName}`.toLowerCase().includes(query),
    );
  }, [documentQuery, markdownDocuments]);

  useEffect(() => {
    if (!processing) return undefined;
    const stepTimer = window.setInterval(() => {
      setProcessing((current) => {
        if (!current) return current;
        return { ...current, step: Math.min(current.step + 1, 3) };
      });
    }, 320);
    const finishTimer = window.setTimeout(() => {
      setProcessing((current) => {
        if (!current) return current;
        const shouldFail =
          current.kind === 'week'
            ? configDraft.purpose.includes('模拟失败')
            : current.kind === 'day'
              ? Boolean(
                  selectedDay?.topics.some((topic) =>
                    getSelectedMaterial(selectedDay, topic.id).manual.includes('模拟失败'),
                  ),
                )
              : rewriteSuggestion.includes('模拟失败');

        if (shouldFail) {
          const nextError: GenerationError = {
            kind: current.kind,
            dayDate: current.dayDate,
            contentId: current.contentId,
            message: '本次朋友圈生成失败，请重新尝试。',
          };
          setProcessingError(nextError);
          if (current.kind === 'day' && current.dayDate) {
            setWeeks((currentWeeks) => {
              const currentWeek = currentWeeks[activeWeekStart];
              if (!currentWeek) return currentWeeks;
              return {
                ...currentWeeks,
                [activeWeekStart]: updateDayInWeek(currentWeek, current.dayDate!, (day) => ({
                  ...day,
                  status: 'failed',
                })),
              };
            });
          }
          return current;
        }

        if (current.kind === 'week') {
          const newWeeks = { ...weeks };
          for (let index = 0; index < configDraft.cycleWeeks; index += 1) {
            const start = addWeeks(activeWeekStart, index);
            newWeeks[start] = createScheduleWeek(start, configDraft);
          }
          setWeeks(newWeeks);
          setProcessingError(null);
          setActiveView('planning');
        } else if (current.kind === 'day' && current.dayDate) {
          const day = week.days.find((item) => item.date === current.dayDate);
          if (day) {
            setWeeks((currentWeeks) => {
              const currentWeek = currentWeeks[activeWeekStart];
              if (!currentWeek) return currentWeeks;
              const nextContents = day.topics.map((topic, topicIndex) =>
                createContent(
                  topic,
                  currentWeek.days.findIndex((item) => item.date === day.date),
                  topicIndex,
                ),
              );
              return {
                ...currentWeeks,
                [activeWeekStart]: updateDayInWeek(currentWeek, current.dayDate!, (currentDay) => ({
                  ...currentDay,
                  status: 'completed',
                  contents: nextContents,
                })),
              };
            });
            setSelectedDayDate(current.dayDate);
            setActiveView('content');
          }
          setProcessingError(null);
        } else if (current.kind === 'rewrite' && current.contentId) {
          setWeeks((currentWeeks) => {
            const currentWeek = currentWeeks[activeWeekStart];
            if (!currentWeek) return currentWeeks;
            return {
              ...currentWeeks,
              [activeWeekStart]: {
                ...currentWeek,
                days: currentWeek.days.map((day) => ({
                  ...day,
                  contents: day.contents.map((content) =>
                    content.id === current.contentId
                      ? {
                          ...content,
                          versions: [
                            `根据“${rewriteSuggestion.trim() || '让表达更贴近日常场景'}”重新整理。${getContentTopic(day, content)?.title ?? '这条内容'}，可以先从今天最容易做到的一件小事开始。`,
                            `如果想把这件事说得更具体，可以从一个真实场景开始：${rewriteSuggestion.trim() || '把调整放回每天的生活节奏'}。${getContentTopic(day, content)?.title ?? ''}，不必一次做到完美。`,
                            `关于${getContentTopic(day, content)?.title ?? '今天的这个话题'}，我们更愿意保留一点余地。${rewriteSuggestion.trim() || '先记录感受，再决定下一步怎么调整'}，会更容易坚持。`,
                          ],
                          currentVersion: 0,
                          manuallyEdited: false,
                        }
                      : content,
                  ),
                })),
              },
            };
          });
          setDetailVersion(0);
          setEditingContentId(null);
          setProcessingError(null);
        }
        return null;
      });
    }, 1450);
    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(finishTimer);
    };
  }, [
    activeWeekStart,
    configDraft,
    processing?.attempt,
    processing?.contentId,
    processing?.dayDate,
    processing?.kind,
    processing?.source,
    rewriteSuggestion,
  ]);

  useEffect(() => {
    if (!copiedContentId) return undefined;
    const timer = window.setTimeout(() => setCopiedContentId(null), 1600);
    return () => window.clearTimeout(timer);
  }, [copiedContentId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateCurrentWeek(updater: (currentWeek: FriendCircleWeek) => FriendCircleWeek) {
    setWeeks((currentWeeks) => {
      const currentWeek = currentWeeks[activeWeekStart] ?? getEmptyWeek(activeWeekStart);
      return { ...currentWeeks, [activeWeekStart]: updater(currentWeek) };
    });
  }

  function handleWeekChange(offset: number) {
    const nextStart = addWeeks(activeWeekStart, offset);
    setActiveWeekStart(nextStart);
    setActiveView('overview');
    setSelectedDayDate('');
    setProcessingError(null);
  }

  function openConfig() {
    setConfigDraft(getConfigForWeek(week));
    setConfigError('');
    setPicker(null);
    setActiveView('config');
  }

  function handleConfigSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (configDraft.mode === 'campaign' && !configDraft.productName && !configDraft.activityName) {
      setConfigError('主题推广周需要先选择产品或活动方案。');
      return;
    }
    if (!configDraft.purpose.trim() || !configDraft.tasks.trim()) {
      setConfigError('运营目的和核心任务都需要填写。');
      return;
    }
    if (
      (configDraft.publishMode === 'weekly' && configDraft.weeklyCount < 1) ||
      (configDraft.publishMode === 'daily' &&
        configDraft.dailyCounts.some((count) => !Number.isInteger(count) || count < 1 || count > 4))
    ) {
      setConfigError(
        configDraft.publishMode === 'daily'
          ? '每天发布数量需要填写 1–4 条。'
          : '本周发布数量需要填写 1 条或以上。',
      );
      return;
    }
    setConfigError('');
    setProcessingError(null);
    setProcessing({ kind: 'week', source: 'create', step: 0, attempt: Date.now() });
  }

  function startPlanRegeneration() {
    setProcessingError(null);
    setProcessing({ kind: 'week', source: 'regenerate', step: 0, attempt: Date.now() });
  }

  function openMaterials(dayDate: string) {
    setSelectedDayDate(dayDate);
    setOpenMaterialTopicId(null);
    setDocumentQuery('');
    setProcessingError(null);
    setActiveView('materials');
  }

  function startSelectedDayGeneration() {
    if (!selectedDay) return;
    const hasMaterial = selectedDay.topics.some((topic) => {
      const material = getSelectedMaterial(selectedDay, topic.id);
      return material.documentIds.length > 0 || material.manual.trim().length > 0;
    });
    if (!hasMaterial) {
      setToast('本日没有补充额外素材，请确认是否直接生成。');
      setProcessingError({ kind: 'day', dayDate: selectedDay.date, message: 'EMPTY_MATERIALS' });
      return;
    }
    updateCurrentWeek((currentWeek) =>
      updateDayInWeek(currentWeek, selectedDay.date, (day) => ({ ...day, status: 'generating' })),
    );
    setProcessingError(null);
    setProcessing({ kind: 'day', dayDate: selectedDay.date, step: 0, attempt: Date.now() });
  }

  function continueWithoutMaterial() {
    if (!selectedDay) return;
    updateCurrentWeek((currentWeek) =>
      updateDayInWeek(currentWeek, selectedDay.date, (day) => ({ ...day, status: 'generating' })),
    );
    setProcessingError(null);
    setProcessing({ kind: 'day', dayDate: selectedDay.date, step: 0, attempt: Date.now() });
  }

  function updateMaterial(
    dayDate: string,
    topicId: string,
    updater: (material: FriendCircleMaterial) => FriendCircleMaterial,
  ) {
    updateCurrentWeek((currentWeek) =>
      updateDayInWeek(currentWeek, dayDate, (day) => ({
        ...day,
        materials: {
          ...day.materials,
          [topicId]: updater(getSelectedMaterial(day, topicId)),
        },
      })),
    );
  }

  function toggleDocument(topicId: string, documentId: string) {
    if (!selectedDay) return;
    updateMaterial(selectedDay.date, topicId, (material) => ({
      ...material,
      documentIds: material.documentIds.includes(documentId)
        ? material.documentIds.filter((id) => id !== documentId)
        : [...material.documentIds, documentId],
    }));
  }

  function saveEdit() {
    if (!editing) return;
    updateCurrentWeek((currentWeek) =>
      updateDayInWeek(currentWeek, editing.dayDate, (day) => ({
        ...day,
        theme: editing.topicIndex === null ? editing.theme.trim() || day.theme : day.theme,
        topics:
          editing.topicIndex === null
            ? day.topics
            : day.topics.map((topic, index) =>
                index === editing.topicIndex
                  ? { ...topic, title: editing.topic.trim() || topic.title }
                  : topic,
              ),
      })),
    );
    setEditing(null);
    setToast('已保存排期修改');
  }

  function editTheme(day: FriendCircleDay) {
    setEditing({ dayDate: day.date, topicIndex: null, theme: day.theme, topic: '' });
  }

  function editTopic(day: FriendCircleDay, topicIndex: number) {
    setEditing({
      dayDate: day.date,
      topicIndex,
      theme: day.theme,
      topic: day.topics[topicIndex]?.title ?? '',
    });
  }

  function confirmPlan() {
    updateCurrentWeek((currentWeek) => ({
      ...currentWeek,
      hasSchedule: true,
      generationStatus: 'ready',
    }));
    setEditing(null);
    setActiveView('overview');
    setToast('本周排期已确认');
  }

  function openContent(dayDate: string) {
    setSelectedDayDate(dayDate);
    setDetailContentId(null);
    setEditingContentId(null);
    setActiveView('content');
  }

  function openDetail(content: FriendCircleContent, day: FriendCircleDay) {
    setSelectedDayDate(day.date);
    setDetailContentId(content.id);
    setDetailVersion(content.currentVersion);
    setEditingContentId(null);
    setRewriteSuggestion('');
    setProcessingError(null);
  }

  function copyContent(content: FriendCircleContent, version: 0 | 1 | 2 = content.currentVersion) {
    const text = content.versions[version];
    void navigator.clipboard?.writeText(text);
    setCopiedContentId(content.id);
    setToast('内容已复制');
  }

  function startContentEdit() {
    if (!detailContent) return;
    setEditingContentId(detailContent.id);
    setContentDraft(detailContent.versions[detailVersion]);
  }

  function saveContentEdit() {
    if (!detailContentId) return;
    updateCurrentWeek((currentWeek) => ({
      ...currentWeek,
      days: currentWeek.days.map((day) => ({
        ...day,
        contents: day.contents.map((content) =>
          content.id === detailContentId
            ? {
                ...content,
                versions: content.versions.map((version, index) =>
                  index === detailVersion ? contentDraft : version,
                ) as [string, string, string],
                manuallyEdited: true,
              }
            : content,
        ),
      })),
    }));
    setEditingContentId(null);
    setToast('已保存修改');
  }

  function adoptDetailVersion() {
    if (!detailContentId) return;
    updateCurrentWeek((currentWeek) => ({
      ...currentWeek,
      days: currentWeek.days.map((day) => ({
        ...day,
        contents: day.contents.map((content) =>
          content.id === detailContentId ? { ...content, currentVersion: detailVersion } : content,
        ),
      })),
    }));
    setToast('已采用当前版本');
  }

  function startRewrite() {
    if (!detailContentId) return;
    setProcessingError(null);
    setProcessing({
      kind: 'rewrite',
      contentId: detailContentId,
      step: 0,
      attempt: Date.now(),
    });
  }

  function retryProcessing() {
    if (!processingError) return;
    const error = processingError;
    setProcessingError(null);
    if (error.kind === 'week') {
      setProcessing({ kind: 'week', source: 'create', step: 0, attempt: Date.now() });
    } else if (error.kind === 'day' && error.dayDate) {
      updateCurrentWeek((currentWeek) =>
        updateDayInWeek(currentWeek, error.dayDate!, (day) => ({ ...day, status: 'generating' })),
      );
      setProcessing({ kind: 'day', dayDate: error.dayDate, step: 0, attempt: Date.now() });
    } else if (error.kind === 'rewrite' && error.contentId) {
      setProcessing({ kind: 'rewrite', contentId: error.contentId, step: 0, attempt: Date.now() });
    }
  }

  function renderOverview() {
    const completedCount = week.days.filter((day) => day.status === 'completed').length;
    return (
      <div className="fc-page-content">
        <div className="fc-page-heading fc-page-heading--actions-only">
          {!week.hasSchedule ? (
            <button
              type="button"
              className="button button--primary fc-heading-action"
              onClick={openConfig}
            >
              生成本周朋友圈
            </button>
          ) : null}
        </div>

        <WeekNavigation
          start={activeWeekStart}
          onPrevious={() => handleWeekChange(-1)}
          onNext={() => handleWeekChange(1)}
        />

        {week.generationStatus === 'failed' ? (
          <div className="fc-inline-error" role="alert">
            <span>本周排期生成失败，请重新尝试。</span>
            <button type="button" className="button button--secondary" onClick={openConfig}>
              重新生成
            </button>
          </div>
        ) : null}

        {!week.hasSchedule ? (
          <section className="fc-empty-state" aria-labelledby="fc-empty-title">
            <span className="fc-empty-state__mark" aria-hidden="true">
              －
            </span>
            <h2 id="fc-empty-title">本周还没有朋友圈排期</h2>
            <p>从本周经营目标开始，生成一份可以逐天执行的内容节奏。</p>
            <button type="button" className="button button--primary" onClick={openConfig}>
              生成本周朋友圈
            </button>
          </section>
        ) : (
          <section className="fc-schedule-section" aria-labelledby="fc-schedule-title">
            <div className="fc-section-header">
              <div>
                <span className="fc-section-label">周排期总览</span>
                <h2 id="fc-schedule-title">{formatWeekRange(activeWeekStart)} 的发布安排</h2>
              </div>
              <span className="fc-heading-status">
                已确认排期 · {completedCount} / {week.days.length} 天已生成
              </span>
            </div>
            <div className="fc-schedule-list">
              {week.days.map((day) => (
                <ScheduleCard
                  key={day.date}
                  day={day}
                  mode="overview"
                  onGenerate={() => openMaterials(day.date)}
                  onView={() => openContent(day.date)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  function renderConfig() {
    const pickerOptions = picker === 'product' ? friendCircleProducts : friendCircleActivities;
    return (
      <div className="fc-page-content">
        <div className="fc-config-heading">
          <h1>
            这周是 {formatFullDate(activeWeekStart)} 到{' '}
            {formatFullDate(getWeekDates(activeWeekStart)[6])}，我们来发点什么？
          </h1>
        </div>
        <form className="fc-config-form" onSubmit={handleConfigSubmit}>
          <section className="fc-form-section">
            <div className="fc-form-section__heading fc-form-section__heading--single">
              <h2>规划周期</h2>
            </div>
            <label className="fc-field">
              <select
                aria-label="规划周期"
                value={configDraft.cycleWeeks}
                onChange={(event) =>
                  setConfigDraft((current) => ({
                    ...current,
                    cycleWeeks: Number(event.target.value),
                  }))
                }
              >
                <option value={1}>{formatWeekRange(activeWeekStart)}</option>
                <option value={2}>{formatWeekRange(activeWeekStart)} 起连续 2 周</option>
                <option value={3}>{formatWeekRange(activeWeekStart)} 起连续 3 周</option>
              </select>
            </label>
          </section>

          <section className="fc-form-section">
            <div className="fc-form-section__heading">
              <div>
                <span className="fc-section-label">经营方式</span>
                <h2>这一周更接近哪种经营节奏？</h2>
              </div>
            </div>
            <div className="fc-mode-grid">
              <ModeCard
                mode="campaign"
                active={configDraft.mode === 'campaign'}
                title="主题推广周"
                description="围绕一个主推内容，形成一周有重点的朋友圈节奏。"
                onSelect={(mode) => setConfigDraft((current) => ({ ...current, mode }))}
              />
              <ModeCard
                mode="daily"
                active={configDraft.mode === 'daily'}
                title="日常经营周"
                description="围绕用户关系和真实场景，保持稳定的日常表达。"
                onSelect={(mode) => setConfigDraft((current) => ({ ...current, mode }))}
              />
            </div>
          </section>

          {configDraft.mode === 'campaign' ? (
            <section className="fc-form-section">
              <div className="fc-form-section__heading">
                <div>
                  <span className="fc-section-label">主题推广周配置</span>
                  <h2>主推内容</h2>
                </div>
              </div>
              <div className="fc-picker-row">
                <div className="fc-picker-wrap">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setPicker(picker === 'product' ? null : 'product')}
                  >
                    选择产品库
                  </button>
                  {picker === 'product' ? (
                    <div className="fc-picker-menu">
                      {pickerOptions.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={configDraft.productName === option ? 'is-selected' : ''}
                          onClick={() => {
                            setConfigDraft((current) => ({
                              ...current,
                              productName: option,
                            }));
                            setPicker(null);
                          }}
                        >
                          <span>{option}</span>
                          {configDraft.productName === option ? <small>已选择</small> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="fc-picker-wrap">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setPicker(picker === 'activity' ? null : 'activity')}
                  >
                    选择活动方案
                  </button>
                  {picker === 'activity' ? (
                    <div className="fc-picker-menu">
                      {pickerOptions.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={configDraft.activityName === option ? 'is-selected' : ''}
                          onClick={() => {
                            setConfigDraft((current) => ({
                              ...current,
                              activityName: option,
                            }));
                            setPicker(null);
                          }}
                        >
                          <span>{option}</span>
                          {configDraft.activityName === option ? <small>已选择</small> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="fc-selected-resource">
                <span>已选择：</span>
                <div className="fc-selected-resource__values">
                  {configDraft.productName ? (
                    <strong>产品：{configDraft.productName}</strong>
                  ) : null}
                  {configDraft.activityName ? (
                    <strong>活动：{configDraft.activityName}</strong>
                  ) : null}
                  {!configDraft.productName && !configDraft.activityName ? (
                    <strong>尚未选择主推内容</strong>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className="fc-form-section">
            <div className="fc-form-section__heading">
              <div>
                <span className="fc-section-label">发布数量</span>
                <h2>这周准备发多少条？</h2>
              </div>
            </div>
            <div className="fc-publish-options">
              <label
                className={`fc-publish-option${configDraft.publishMode === 'weekly' ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="publish-mode"
                  checked={configDraft.publishMode === 'weekly'}
                  onChange={() =>
                    setConfigDraft((current) => ({ ...current, publishMode: 'weekly' }))
                  }
                />
                <span className="fc-publish-option__copy">
                  <span className="fc-publish-option__lead">本周共发</span>
                  <input
                    aria-label="本周共发条数"
                    type="number"
                    min={1}
                    value={configDraft.weeklyCount}
                    onChange={(event) =>
                      setConfigDraft((current) => ({
                        ...current,
                        weeklyCount: Number(event.target.value),
                      }))
                    }
                  />
                  <span>条，平均分配到每天</span>
                </span>
              </label>
              <label
                className={`fc-publish-option fc-publish-option--daily${configDraft.publishMode === 'daily' ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="publish-mode"
                  checked={configDraft.publishMode === 'daily'}
                  onChange={() =>
                    setConfigDraft((current) => ({ ...current, publishMode: 'daily' }))
                  }
                />
                <div className="fc-publish-option__copy fc-publish-option__copy--daily">
                  <span className="fc-publish-option__lead">每天分别设置</span>
                  <div className="fc-daily-counts" aria-label="每天发布条数">
                    {friendCircleWeekdays.map((weekday, dayIndex) => (
                      <div className="fc-daily-count" key={weekday}>
                        <span>{weekday}</span>
                        <input
                          aria-label={`${weekday}发布条数`}
                          type="number"
                          min={1}
                          max={4}
                          value={configDraft.dailyCounts[dayIndex] ?? 1}
                          onChange={(event) =>
                            setConfigDraft((current) => ({
                              ...current,
                              dailyCounts: current.dailyCounts.map((count, currentDayIndex) =>
                                currentDayIndex === dayIndex ? Number(event.target.value) : count,
                              ),
                            }))
                          }
                        />
                        <span>条</span>
                      </div>
                    ))}
                  </div>
                </div>
              </label>
            </div>
          </section>

          <section className="fc-form-section fc-form-section--fields">
            <label className="fc-field">
              <span className="fc-field__section-title">本周运营目的</span>
              <textarea
                value={configDraft.purpose}
                onChange={(event) =>
                  setConfigDraft((current) => ({ ...current, purpose: event.target.value }))
                }
                placeholder="例如：让新用户先理解日常轻养护，再自然进入咨询。"
                rows={4}
              />
            </label>
            <label className="fc-field">
              <span className="fc-field__section-title">核心任务</span>
              <textarea
                value={configDraft.tasks}
                onChange={(event) =>
                  setConfigDraft((current) => ({ ...current, tasks: event.target.value }))
                }
                placeholder="例如：增加真实生活场景，减少单纯产品介绍。"
                rows={4}
              />
            </label>
          </section>

          {configError ? (
            <div className="fc-form-error" role="alert">
              {configError}
            </div>
          ) : null}
          <div className="fc-form-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setActiveView('overview')}
            >
              返回
            </button>
            <button type="submit" className="button button--primary button--wide">
              下一步
            </button>
          </div>
        </form>
      </div>
    );
  }

  function renderPlanning() {
    return (
      <div className="fc-page-content">
        <div className="fc-page-heading">
          <div>
            <button
              type="button"
              className="fc-back-link"
              onClick={() => setActiveView('overview')}
            >
              ‹ 返回周排期总览
            </button>
            <p className="page-kicker">朋友圈经营 / 周排期规划</p>
            <h1>确认本周朋友圈排期</h1>
            <p className="page-description">可以编辑主题和单条选题，确认后再按天补充素材。</p>
          </div>
          <span className="fc-heading-status">{formatWeekRange(activeWeekStart)}</span>
        </div>
        <section
          className="fc-schedule-section fc-planning-section"
          aria-labelledby="fc-planning-title"
        >
          <div className="fc-section-header">
            <div>
              <span className="fc-section-label">Agent 生成结果</span>
              <h2 id="fc-planning-title">一周七天的内容节奏</h2>
            </div>
            <span className="fc-section-note">编辑不会自动生成正文</span>
          </div>
          <div className="fc-schedule-list">
            {week.days.map((day) => (
              <div key={day.date}>
                <ScheduleCard
                  day={day}
                  mode="planning"
                  onGenerate={() => openMaterials(day.date)}
                  onView={() => openContent(day.date)}
                  onEditTheme={() => editTheme(day)}
                  onEditTopic={(topicIndex) => editTopic(day, topicIndex)}
                />
                {editing?.dayDate === day.date ? (
                  <div className="fc-inline-edit" aria-label="编辑排期">
                    <label className="fc-field">
                      <span>当日主题</span>
                      <input
                        value={editing.theme}
                        onChange={(event) =>
                          setEditing((current) =>
                            current ? { ...current, theme: event.target.value } : current,
                          )
                        }
                      />
                    </label>
                    {editing.topicIndex !== null ? (
                      <label className="fc-field">
                        <span>朋友圈选题</span>
                        <input
                          value={editing.topic}
                          onChange={(event) =>
                            setEditing((current) =>
                              current ? { ...current, topic: event.target.value } : current,
                            )
                          }
                        />
                      </label>
                    ) : null}
                    <div className="fc-inline-edit__actions">
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => setEditing(null)}
                      >
                        取消
                      </button>
                      <button type="button" className="button button--primary" onClick={saveEdit}>
                        保存
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
        <section className="fc-overall-edit" aria-labelledby="fc-overall-title">
          <div>
            <span className="fc-section-label">整体修改</span>
            <h2 id="fc-overall-title">还想调整这一周的表达方向？</h2>
          </div>
          <textarea
            value={overallSuggestion}
            onChange={(event) => setOverallSuggestion(event.target.value)}
            placeholder="例如：减少产品介绍，多增加真实生活场景。"
            rows={3}
          />
          <div className="fc-form-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={startPlanRegeneration}
            >
              重新生成排期
            </button>
            <button type="button" className="button button--primary" onClick={confirmPlan}>
              确认排期
            </button>
          </div>
        </section>
      </div>
    );
  }

  function renderMaterials() {
    if (!selectedDay) return null;
    const emptyPrompt =
      processingError?.kind === 'day' && processingError.message === 'EMPTY_MATERIALS';
    return (
      <div className="fc-page-content">
        <div className="fc-page-heading fc-materials-heading">
          <div>
            <button
              type="button"
              className="fc-back-link"
              onClick={() => setActiveView('overview')}
            >
              ‹ 返回周排期总览
            </button>
            <p className="page-kicker">朋友圈经营 / 单日素材补充</p>
            <h1>
              {selectedDay.weekday} {formatShortDate(selectedDay.date)} · 补充朋友圈素材
            </h1>
            <p className="page-description">
              当天规划几条，就补充几组素材。可以只选企业资料，也可以手动补充。
            </p>
          </div>
          <span className="fc-heading-status">今天计划生成 {selectedDay.topics.length} 条</span>
        </div>
        <section className="fc-materials-card" aria-labelledby="fc-materials-title">
          <div className="fc-materials-intro">
            <span className="fc-section-label">当日主题</span>
            <h2 id="fc-materials-title">{selectedDay.theme}</h2>
            <p>素材不是必填项，全部跳过也可以直接生成。</p>
          </div>
          <div className="fc-material-topic-list">
            {selectedDay.topics.map((topic, topicIndex) => {
              const material = getSelectedMaterial(selectedDay, topic.id);
              const selectedDocs = markdownDocuments.filter((document) =>
                material.documentIds.includes(document.id),
              );
              return (
                <article className="fc-material-topic" key={topic.id}>
                  <div className="fc-material-topic__heading">
                    <span>朋友圈选题 {String(topicIndex + 1).padStart(2, '0')}</span>
                    <h3>{topic.title}</h3>
                  </div>
                  <div className="fc-material-topic__body">
                    <div className="fc-material-picker">
                      <span className="fc-field-label">企业大脑素材</span>
                      <button
                        type="button"
                        className="fc-select-trigger"
                        onClick={() =>
                          setOpenMaterialTopicId(openMaterialTopicId === topic.id ? null : topic.id)
                        }
                        aria-expanded={openMaterialTopicId === topic.id}
                      >
                        <span>
                          {selectedDocs.length
                            ? `已选 ${selectedDocs.length} 篇 Markdown 文档`
                            : '选择企业资料'}
                        </span>
                        <span aria-hidden="true">⌄</span>
                      </button>
                      {openMaterialTopicId === topic.id ? (
                        <div className="fc-document-menu">
                          <input
                            type="search"
                            value={documentQuery}
                            onChange={(event) => setDocumentQuery(event.target.value)}
                            placeholder="搜索文档"
                            aria-label="搜索企业大脑文档"
                          />
                          <div className="fc-document-menu__list">
                            {visibleDocuments.map((document) => {
                              const isSelected = material.documentIds.includes(document.id);
                              return (
                                <label
                                  className={`fc-document-option${isSelected ? ' is-selected' : ''}`}
                                  key={document.id}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleDocument(topic.id, document.id)}
                                  />
                                  <span>
                                    <strong>{document.title}</strong>
                                    <small>{document.fileName}</small>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            className="fc-document-menu__done"
                            onClick={() => setOpenMaterialTopicId(null)}
                          >
                            完成选择
                          </button>
                        </div>
                      ) : null}
                      {selectedDocs.length ? (
                        <div className="fc-document-tags">
                          {selectedDocs.map((document) => (
                            <span key={document.id}>
                              {document.title}
                              <button
                                type="button"
                                onClick={() => toggleDocument(topic.id, document.id)}
                                aria-label={`移除 ${document.title}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <label className="fc-field">
                      <span>手动补充素材</span>
                      <textarea
                        value={material.manual}
                        onChange={(event) =>
                          updateMaterial(selectedDay.date, topic.id, (current) => ({
                            ...current,
                            manual: event.target.value,
                          }))
                        }
                        placeholder="补充事实、案例、用户原话或今天想强调的场景"
                        rows={4}
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
          {emptyPrompt ? (
            <div className="fc-material-confirm" role="alert">
              <div>
                <strong>本日没有补充额外素材，是否直接生成？</strong>
                <span>可以返回继续补充，也可以使用排期选题直接生成。</span>
              </div>
              <div>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setProcessingError(null)}
                >
                  返回补充
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={continueWithoutMaterial}
                >
                  继续生成
                </button>
              </div>
            </div>
          ) : null}
          <div className="fc-form-actions fc-material-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() =>
                setProcessingError({
                  kind: 'day',
                  dayDate: selectedDay.date,
                  message: 'EMPTY_MATERIALS',
                })
              }
            >
              跳过素材
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={startSelectedDayGeneration}
            >
              生成当天朋友圈
            </button>
          </div>
        </section>
      </div>
    );
  }

  function renderContent() {
    if (!selectedDay) return null;
    return (
      <div className="fc-page-content">
        <div className="fc-page-heading">
          <div>
            <button
              type="button"
              className="fc-back-link"
              onClick={() => setActiveView('overview')}
            >
              ‹ 返回周排期总览
            </button>
            <p className="page-kicker">朋友圈经营 / 当天内容</p>
            <h1>
              {selectedDay.weekday} {formatShortDate(selectedDay.date)} · 朋友圈内容
            </h1>
            <p className="page-description">当日主题：{selectedDay.theme}</p>
          </div>
          <span className="fc-heading-status">今日共 {selectedDay.contents.length} 条</span>
        </div>
        <section className="fc-content-section" aria-labelledby="fc-content-title">
          <div className="fc-content-section__heading">
            <div>
              <span className="fc-section-label">内容查看</span>
              <h2 id="fc-content-title">单列内容卡片</h2>
            </div>
            <span className="fc-section-note">点击查看详情可切换版本和编辑文案</span>
          </div>
          <div className="fc-content-list">
            {selectedDay.contents.map((content, index) => {
              const topic = getContentTopic(selectedDay, content);
              const currentText = content.versions[content.currentVersion];
              return (
                <article className="fc-content-card" key={content.id}>
                  <div className="fc-content-card__header">
                    <div>
                      <span>
                        {String(index + 1).padStart(2, '0')} · {topic?.title ?? '朋友圈内容'}
                      </span>
                      <h3>{topic?.title ?? '朋友圈内容'}</h3>
                    </div>
                    {content.manuallyEdited ? (
                      <small className="fc-content-edited-mark">已手动编辑</small>
                    ) : null}
                  </div>
                  <p className="fc-content-card__copy">{currentText}</p>
                  <div className="fc-content-card__footer">
                    <span>当前采用：版本{['一', '二', '三'][content.currentVersion]}</span>
                    <div>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => openDetail(content, selectedDay)}
                      >
                        查看详情
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => copyContent(content)}
                      >
                        {copiedContentId === content.id ? '已复制' : '复制'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        {detailContent && detailDay ? (
          <aside className="fc-detail-layer" aria-label="朋友圈内容详情">
            <button
              type="button"
              className="fc-detail-backdrop"
              aria-label="关闭详情"
              onClick={() => setDetailContentId(null)}
            />
            <section
              className="fc-detail-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="fc-detail-title"
            >
              <div className="fc-detail-drawer__header">
                <div>
                  <span className="fc-section-label">朋友圈内容详情</span>
                  <h2 id="fc-detail-title">
                    {detailDay.weekday} {formatShortDate(detailDay.date)} · 第{' '}
                    {detailDay.contents.findIndex((content) => content.id === detailContent.id) + 1}{' '}
                    条
                  </h2>
                </div>
                <button
                  type="button"
                  className="fc-drawer-close"
                  onClick={() => setDetailContentId(null)}
                  aria-label="关闭详情"
                >
                  ×
                </button>
              </div>
              <div className="fc-detail-drawer__body">
                <div className="fc-detail-topic">
                  <span>主题</span>
                  <strong>
                    {getContentTopic(detailDay, detailContent)?.title ?? '朋友圈内容'}
                  </strong>
                </div>
                <div className="fc-version-switcher" aria-label="AI 版本">
                  {[0, 1, 2].map((version) => (
                    <button
                      type="button"
                      key={version}
                      className={detailVersion === version ? 'is-selected' : ''}
                      onClick={() => {
                        setDetailVersion(version as 0 | 1 | 2);
                        setEditingContentId(null);
                      }}
                    >
                      版本{['一', '二', '三'][version]}
                    </button>
                  ))}
                </div>
                <div className="fc-current-copy">
                  <div className="fc-field-heading">
                    <span>当前文案</span>
                    {detailContent.currentVersion === detailVersion ? (
                      <small>当前采用</small>
                    ) : null}
                  </div>
                  {editingContentId === detailContent.id ? (
                    <textarea
                      value={contentDraft}
                      onChange={(event) => setContentDraft(event.target.value)}
                      rows={10}
                    />
                  ) : (
                    <p>{detailContent.versions[detailVersion]}</p>
                  )}
                </div>
                <div className="fc-detail-actions">
                  {editingContentId === detailContent.id ? (
                    <>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => setEditingContentId(null)}
                      >
                        取消编辑
                      </button>
                      <button
                        type="button"
                        className="button button--primary"
                        onClick={saveContentEdit}
                      >
                        保存修改
                      </button>
                    </>
                  ) : (
                    <>
                      {detailContent.currentVersion !== detailVersion ? (
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={adoptDetailVersion}
                        >
                          采用此版本
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => copyContent(detailContent, detailVersion)}
                      >
                        {copiedContentId === detailContent.id ? '已复制' : '复制内容'}
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={startContentEdit}
                      >
                        编辑文案
                      </button>
                    </>
                  )}
                </div>
                <div className="fc-rewrite-box">
                  <label className="fc-field" htmlFor="fc-rewrite-input">
                    <span>优化要求</span>
                    <textarea
                      id="fc-rewrite-input"
                      value={rewriteSuggestion}
                      onChange={(event) => setRewriteSuggestion(event.target.value)}
                      placeholder="例如：增加办公室下午三点的真实场景，语气更像朋友交流。"
                      rows={4}
                    />
                  </label>
                  {processing?.kind === 'rewrite' && !processingError ? (
                    <div className="fc-inline-processing" role="status">
                      正在根据优化要求重写这条朋友圈...
                    </div>
                  ) : processingError?.kind === 'rewrite' ? (
                    <div className="fc-form-error" role="alert">
                      本次重写失败，请修改要求后重新尝试。
                      <button type="button" className="fc-inline-link" onClick={startRewrite}>
                        重新生成
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={startRewrite}
                    disabled={processing?.kind === 'rewrite'}
                  >
                    重新生成三个版本
                  </button>
                </div>
              </div>
            </section>
          </aside>
        ) : null}
      </div>
    );
  }

  function renderCurrentView() {
    if (processing?.kind === 'week' && !detailContent) {
      return (
        <div className="fc-page-content">
          <ProcessingPanel
            state={processing}
            day={selectedDay}
            error={processingError}
            onRetry={retryProcessing}
            onBack={() => setActiveView(processing.source === 'regenerate' ? 'planning' : 'config')}
          />
        </div>
      );
    }
    if (processing?.kind === 'day') {
      return (
        <div className="fc-page-content">
          <ProcessingPanel
            state={processing}
            day={selectedDay}
            error={processingError}
            onRetry={retryProcessing}
            onBack={() => setActiveView('materials')}
          />
        </div>
      );
    }
    if (activeView === 'config') return renderConfig();
    if (activeView === 'planning') return renderPlanning();
    if (activeView === 'materials') return renderMaterials();
    if (activeView === 'content') return renderContent();
    return renderOverview();
  }

  const breadcrumb =
    activeView === 'config'
      ? '本周配置'
      : activeView === 'planning'
        ? '周排期规划'
        : activeView === 'materials'
          ? '单日素材补充'
          : activeView === 'content'
            ? '当天朋友圈内容'
            : '朋友圈经营';

  return (
    <div className="app-shell app-shell--friend-circle">
      <ProductSidebar activeModule="friend-circle" />
      <main className="app-main friend-circle-main" id="friend-circle">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>复购经营</span>
            <span aria-hidden="true">/</span>
            <strong>{breadcrumb}</strong>
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>
        {renderCurrentView()}
      </main>
      {toast ? (
        <div className="fc-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
