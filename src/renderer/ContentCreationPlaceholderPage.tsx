import { useMemo, useState } from 'react';
import { ProductSidebar } from './components/ProductSidebar';
import { createTopicId, loadTopicItems, saveTopicItems } from './topicPoolStorage';
import {
  scheduleStatusLabels,
  topicTypeLabels,
  type TopicItem,
  type TopicSchedule,
  type TopicType,
} from './topicPoolTypes';

function getCreationContext() {
  if (typeof window === 'undefined') {
    return {
      mode: 'blank',
      topicId: '',
      scheduleId: '',
      scheduleDate: '',
      title: '',
      detail: '',
      reference: '',
      type: '',
    };
  }

  const query = window.location.hash.split('?')[1] ?? '';
  const params = new URLSearchParams(query);
  return {
    mode: params.get('mode') ?? 'blank',
    topicId: params.get('topicId') ?? '',
    scheduleId: params.get('scheduleId') ?? '',
    scheduleDate: params.get('scheduleDate') ?? '',
    title: params.get('title') ?? '',
    detail: params.get('detail') ?? '',
    reference: params.get('reference') ?? '',
    type: params.get('type') ?? '',
  };
}

function formatDate(date: string) {
  if (!date) {
    return '未安排';
  }
  const [, month, day] = date.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

function getTopicSchedule(topic: TopicItem | undefined, scheduleId: string) {
  return topic?.schedules.find((schedule) => schedule.id === scheduleId);
}

function getScheduleStatus(schedule: TopicSchedule) {
  if (schedule.contentId || schedule.status === 'completed') {
    return 'completed' as const;
  }
  return schedule.status;
}

export function ContentCreationPlaceholderPage() {
  const context = getCreationContext();
  const [topics, setTopics] = useState<TopicItem[]>(loadTopicItems);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(context.topicId);
  const [selectedScheduleId, setSelectedScheduleId] = useState(context.scheduleId);
  const selectedTopic = topics.find((item) => item.id === selectedTopicId);
  const selectedSchedule = getTopicSchedule(selectedTopic, selectedScheduleId);
  const [selectedType, setSelectedType] = useState<TopicType>(
    (selectedTopic?.type ?? context.type ?? 'viral') as TopicType,
  );
  const [contentId, setContentId] = useState('');

  const scheduledTopics = useMemo(
    () => topics.filter((topic) => topic.status === 'active' && topic.schedules.length > 0),
    [topics],
  );
  const selectableTopics = showAllTopics
    ? topics.filter((topic) => topic.status === 'active')
    : scheduledTopics;
  const inheritedTitle = selectedTopic?.title ?? context.title;
  const inheritedDetail = selectedTopic?.detail ?? context.detail;
  const inheritedReference = selectedTopic?.reference ?? context.reference;
  const isPreview = context.mode === 'preview';

  const handleTopicChange = (topicId: string) => {
    const nextTopic = topics.find((topic) => topic.id === topicId);
    setSelectedTopicId(topicId);
    setSelectedScheduleId('');
    if (nextTopic) {
      setSelectedType(nextTopic.type);
    }
  };

  const handleSimulateComplete = () => {
    const nextContentId = createTopicId('content');
    setTopics((current) => {
      const next = current.map((topic) => {
        if (topic.id !== selectedTopicId) {
          return topic;
        }
        return {
          ...topic,
          contentStatus: 'completed' as const,
          contentId: nextContentId,
          schedules: topic.schedules.map((schedule) =>
            schedule.id === selectedScheduleId
              ? { ...schedule, status: 'completed' as const, contentId: nextContentId }
              : schedule,
          ),
        };
      });
      saveTopicItems(next);
      return next;
    });
    setContentId(nextContentId);
  };

  return (
    <div className="app-shell app-shell--content-creation">
      <ProductSidebar activeModule="content-creation" />
      <main className="app-main content-creation-main" id="content-creation">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>内容增长</span>
            <span aria-hidden="true">/</span>
            <strong>内容创作</strong>
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>

        <div className="page-content content-creation-content">
          <section
            className="content-creation-placeholder"
            aria-labelledby="content-creation-title"
          >
            <span className="content-creation-placeholder__mark" aria-hidden="true">
              ◇
            </span>
            <p className="page-kicker">内容增长 / 创作占位</p>
            <h1 id="content-creation-title">{isPreview ? '成稿预览' : '内容创作'}</h1>
            <p className="page-description">
              {isPreview
                ? '这里展示已完成排期关联的 Demo 成稿入口。'
                : '这里是内容创作页面的占位入口，当前只验证选题、类型和排期的绑定关系。'}
            </p>

            {isPreview ? (
              <div className="content-preview-card">
                <span>已生成成稿</span>
                <strong>
                  {selectedSchedule?.contentId ?? selectedTopic?.contentId ?? 'Demo 内容'}
                </strong>
                <p>内容预览占位：成稿内容将在后续阶段接入。</p>
              </div>
            ) : (
              <>
                <div className="content-creation-selector">
                  <div className="content-creation-selector__header">
                    <div>
                      <span>选题选择</span>
                      <strong>{showAllTopics ? '全部正常选题' : '当前已排期选题'}</strong>
                    </div>
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => setShowAllTopics((current) => !current)}
                    >
                      {showAllTopics ? '只看已排期选题' : '切换到全部选题'}
                    </button>
                  </div>
                  <label htmlFor="creation-topic-select">选择选题（可不选）</label>
                  <select
                    id="creation-topic-select"
                    value={selectedTopicId}
                    onChange={(event) => handleTopicChange(event.target.value)}
                  >
                    <option value="">不选择选题</option>
                    {selectableTopics.map((topic) => (
                      <option value={topic.id} key={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                  {selectedTopic ? (
                    <label htmlFor="creation-schedule-select">
                      关联排期（可不选）
                      <select
                        id="creation-schedule-select"
                        value={selectedScheduleId}
                        onChange={(event) => setSelectedScheduleId(event.target.value)}
                      >
                        <option value="">不绑定排期</option>
                        {selectedTopic.schedules.map((schedule) => (
                          <option value={schedule.id} key={schedule.id}>
                            {formatDate(schedule.date)} ·{' '}
                            {scheduleStatusLabels[getScheduleStatus(schedule)]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                <div className="content-creation-binding">
                  <div>
                    <span>当前选题</span>
                    <strong>{inheritedTitle || '暂未选择选题'}</strong>
                  </div>
                  {inheritedDetail ? <p>{inheritedDetail}</p> : null}
                  {inheritedReference ? <small>参考内容：{inheritedReference}</small> : null}
                  <div className="content-creation-binding__meta">
                    <label htmlFor="creation-type-select">选题类型</label>
                    <select
                      id="creation-type-select"
                      value={selectedType}
                      onChange={(event) => setSelectedType(event.target.value as TopicType)}
                    >
                      <option value="viral">{topicTypeLabels.viral}</option>
                      <option value="hotspot">{topicTypeLabels.hotspot}</option>
                      <option value="inspiration">{topicTypeLabels.inspiration}</option>
                    </select>
                    <span>
                      排期：
                      {selectedSchedule
                        ? `${formatDate(selectedSchedule.date)} · ${selectedSchedule.channel}`
                        : '未绑定排期'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {contentId ? (
              <div className="content-creation-success" role="status">
                已模拟完成创作，生成内容 ID：{contentId}
              </div>
            ) : null}

            <div className="content-creation-placeholder__actions">
              {!isPreview ? (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleSimulateComplete}
                >
                  模拟完成创作
                </button>
              ) : null}
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  window.location.hash = selectedTopicId
                    ? `#topic-pool?focus=pool&topicId=${encodeURIComponent(selectedTopicId)}`
                    : '#topic-pool?focus=pool';
                }}
              >
                返回选题池
              </button>
              <span>真实内容创作能力将在后续阶段接入。</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
