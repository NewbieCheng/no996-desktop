import { useEffect, useMemo, useRef, useState } from 'react';
import { initialBrainDocuments, initialBrainFolders } from './enterpriseBrainMockData';
import { ProductSidebar } from './components/ProductSidebar';
import {
  creationModeOptions,
  getMockDraft,
  getMockFramework,
  getMockTitleOptions,
  getTopicTypeLabel,
  mockSplitCards,
  type CreationFramework,
  type CreationMode,
  type CreationTitleOption,
} from './contentCreationMockData';
import { createTopicId, loadTopicItems, saveTopicItems } from './topicPoolStorage';
import {
  createContentAssetGroup,
  loadContentAssetGroups,
  saveContentAssetGroups,
} from './contentAssetStorage';
import type { AssetPlatform } from './contentAssetTypes';
import {
  contentStatusLabels,
  scheduleStatusLabels,
  topicTypeLabels,
  type ScheduleStatus,
  type TopicItem,
  type TopicSchedule,
  type TopicType,
} from './topicPoolTypes';

type CreationPhase = 'context' | 'materials' | 'framework' | 'draft' | 'split';
type ProcessingKind = 'materials' | 'framework' | 'draft' | 'titles' | 'saving' | 'split';
type CreationErrorAction = 'framework' | 'draft' | 'titles' | 'save';

interface CreationContext {
  mode: string;
  analysisId: string;
  sourceUrl: string;
  topicId: string;
  scheduleId: string;
  scheduleDate: string;
  title: string;
  detail: string;
  reference: string;
  type: TopicType | '';
}

function getCreationContext(): CreationContext {
  if (typeof window === 'undefined') {
    return {
      mode: 'blank',
      analysisId: '',
      sourceUrl: '',
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
  const type = params.get('type');
  return {
    mode: params.get('mode') ?? 'blank',
    analysisId: params.get('analysisId') ?? '',
    sourceUrl: params.get('sourceUrl') ?? '',
    topicId: params.get('topicId') ?? '',
    scheduleId: params.get('scheduleId') ?? '',
    scheduleDate: params.get('scheduleDate') ?? '',
    title: params.get('title') ?? '',
    detail: params.get('detail') ?? '',
    reference: params.get('reference') ?? '',
    type: type === 'viral' || type === 'hotspot' || type === 'inspiration' ? type : '',
  };
}

function formatDate(date: string) {
  if (!date) {
    return '未安排';
  }
  const [, month, day] = date.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

function getScheduleStatus(schedule: TopicSchedule): ScheduleStatus {
  if (schedule.contentId || schedule.status === 'completed') {
    return 'completed';
  }
  return schedule.status;
}

function getPreferredSchedule(topic?: TopicItem) {
  return (
    topic?.schedules.find((schedule) => getScheduleStatus(schedule) !== 'completed') ??
    topic?.schedules[0]
  );
}

function getFolderName(folderId: string | null) {
  return initialBrainFolders.find((folder) => folder.id === folderId)?.name ?? '未归类';
}

function getModeName(mode: CreationMode | null) {
  return creationModeOptions.find((item) => item.id === mode)?.name ?? '';
}

function isValidContentLink(value: string) {
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(value.trim());
}

function getPlatformByChannel(channel?: string): AssetPlatform | undefined {
  if (!channel) return undefined;
  if (channel.includes('小红书')) return 'xiaohongshu';
  if (channel.includes('抖音')) return 'douyin';
  if (channel.includes('视频号')) return 'video-account';
  if (channel.includes('公众号')) return 'wechat';
  return undefined;
}

function resolveCreationPlatform(
  mode: CreationMode,
  scheduleChannel?: string,
  referenceLink?: string,
): AssetPlatform {
  const schedulePlatform = getPlatformByChannel(scheduleChannel);
  if (schedulePlatform) return schedulePlatform;
  if (mode === 'replicate') {
    const link = referenceLink?.toLowerCase() ?? '';
    if (link.includes('xiaohongshu') || link.includes('xhslink')) return 'xiaohongshu';
    if (link.includes('douyin') || link.includes('iesdouyin')) return 'douyin';
    if (link.includes('channels') || link.includes('视频号')) return 'video-account';
    if (link.includes('weixin') || link.includes('公众号')) return 'wechat';
  }
  if (mode === 'image-text') return 'xiaohongshu';
  if (mode === 'video-script') return 'douyin';
  return 'wechat';
}

function getAssetTitle(title: CreationTitleOption, mode: CreationMode, fallback: string) {
  if (mode === 'wechat-article') return title.articleTitle?.trim() || fallback;
  return title.coverTitle?.trim() || title.bodyTitle?.trim() || fallback;
}

function CreationProcessing({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="creation-processing" role="status" aria-live="polite">
      <div className="creation-processing__bar" aria-hidden="true">
        <span />
      </div>
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  );
}

function ContextPanel({
  topics,
  selectedTopicId,
  selectedScheduleId,
  selectedType,
  showAllTopics,
  compact = false,
  onTopicChange,
  onScheduleChange,
  onTypeChange,
  onToggleTopicScope,
}: {
  topics: TopicItem[];
  selectedTopicId: string;
  selectedScheduleId: string;
  selectedType: TopicType | '';
  showAllTopics: boolean;
  compact?: boolean;
  onTopicChange?: (topicId: string) => void;
  onScheduleChange?: (scheduleId: string) => void;
  onTypeChange?: (type: TopicType | '') => void;
  onToggleTopicScope?: () => void;
}) {
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);
  const selectableTopics = showAllTopics
    ? topics.filter((topic) => topic.status === 'active')
    : topics.filter((topic) => topic.status === 'active' && topic.schedules.length > 0);
  const selectedSchedule = selectedTopic?.schedules.find(
    (schedule) => schedule.id === selectedScheduleId,
  );

  return (
    <section
      className={`creation-context-card${compact ? ' creation-context-card--compact' : ''}`}
      aria-label="选题与排期信息"
    >
      <div className="creation-context-card__main content-creation-binding">
        <div className="creation-context-card__topic">
          <span className="creation-field-label">选题标题</span>
          <strong>{selectedTopic?.title ?? '暂未选择选题'}</strong>
          {selectedTopic?.detail ? <p>{selectedTopic.detail}</p> : null}
        </div>
        <div className="creation-context-card__meta">
          <div>
            <span className="creation-field-label">选题类型</span>
            <strong>{getTopicTypeLabel(selectedType)}</strong>
          </div>
          <div>
            <span className="creation-field-label">当前排期</span>
            <strong>
              {selectedSchedule
                ? `${formatDate(selectedSchedule.date)} · ${scheduleStatusLabels[getScheduleStatus(selectedSchedule)]}`
                : '未绑定排期'}
            </strong>
          </div>
          <div>
            <span className="creation-field-label">当前状态</span>
            <strong>
              {selectedSchedule
                ? scheduleStatusLabels[getScheduleStatus(selectedSchedule)]
                : selectedTopic
                  ? contentStatusLabels[selectedTopic.contentStatus]
                  : '未选择'}
            </strong>
          </div>
          <div>
            <span className="creation-field-label">参考内容</span>
            <strong>{selectedTopic?.reference ?? '暂无'}</strong>
          </div>
        </div>
      </div>

      {!compact && onTopicChange && onScheduleChange && onTypeChange ? (
        <div className="creation-context-card__selectors">
          <label>
            选择选题（可不选）
            <select
              aria-label="选择选题（可不选）"
              value={selectedTopicId}
              onChange={(event) => onTopicChange(event.target.value)}
            >
              <option value="">不选择选题</option>
              {selectableTopics.map((topic) => (
                <option value={topic.id} key={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>
          <div className="creation-selector__scope">
            <span>选题来源</span>
            <button type="button" className="button button--secondary" onClick={onToggleTopicScope}>
              {showAllTopics ? '只看已排期选题' : '切换到全部选题'}
            </button>
          </div>
          {selectedTopic ? (
            <label>
              关联排期（可不选）
              <select
                aria-label="关联排期（可不选）"
                value={selectedScheduleId}
                onChange={(event) => onScheduleChange(event.target.value)}
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
          <label>
            选题类型{selectedTopic ? ' · 来自选题管理' : ''}
            <select
              aria-label="选择选题类型"
              value={selectedType}
              disabled={Boolean(selectedTopic)}
              onChange={(event) => onTypeChange(event.target.value as TopicType | '')}
            >
              <option value="">不指定类型</option>
              <option value="viral">{topicTypeLabels.viral}</option>
              <option value="hotspot">{topicTypeLabels.hotspot}</option>
              <option value="inspiration">{topicTypeLabels.inspiration}</option>
            </select>
          </label>
        </div>
      ) : null}
    </section>
  );
}

function ErrorNotice({
  message,
  onClose,
  onRetry,
  retryLabel = '重新尝试',
}: {
  message: string;
  onClose: () => void;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="creation-error" role="alert">
      <span>{message}</span>
      <div>
        {onRetry ? (
          <button type="button" className="button button--secondary" onClick={onRetry}>
            {retryLabel}
          </button>
        ) : null}
        <button
          type="button"
          className="creation-error__close"
          onClick={onClose}
          aria-label="关闭错误提示"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function DocumentPicker({
  selectedIds,
  onToggle,
  onClose,
  onConfirm,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const documents = initialBrainDocuments.filter((document) => document.kind === 'markdown');
  return (
    <div className="creation-modal-layer">
      <button
        className="creation-modal-backdrop"
        type="button"
        onClick={onClose}
        aria-label="关闭文档选择"
      />
      <section
        className="creation-document-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-picker-title"
      >
        <div className="creation-modal__header">
          <div>
            <span className="creation-section-kicker">企业大脑</span>
            <h2 id="document-picker-title">选择知识库文档</h2>
          </div>
          <button
            type="button"
            className="creation-modal__close"
            onClick={onClose}
            aria-label="关闭文档选择"
          >
            ×
          </button>
        </div>
        <p className="creation-modal__description">
          选择一篇或多篇 Markdown 文档，作为本次创作的事实依据。
        </p>
        <div className="creation-document-list">
          {documents.length ? (
            documents.map((document) => {
              const isSelected = selectedIds.includes(document.id);
              return (
                <button
                  type="button"
                  className={`creation-document-option${isSelected ? ' is-selected' : ''}`}
                  key={document.id}
                  onClick={() => onToggle(document.id)}
                  aria-pressed={isSelected}
                >
                  <span className="creation-document-option__icon" aria-hidden="true">
                    ≡
                  </span>
                  <span>
                    <strong>{document.title}</strong>
                    <small>
                      {getFolderName(document.folderId)} · {document.fileName}
                    </small>
                  </span>
                  <span className="creation-document-option__state" aria-hidden="true">
                    {isSelected ? '已选' : '选择'}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="creation-empty-state">企业大脑中暂时没有可选的 Markdown 文档。</div>
          )}
        </div>
        <div className="creation-modal__footer">
          <span>已选择 {selectedIds.length} 篇</span>
          <div>
            <button type="button" className="button button--secondary" onClick={onClose}>
              取消
            </button>
            <button type="button" className="button button--primary" onClick={onConfirm}>
              确认选择
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DraftTitle({ option, mode }: { option: CreationTitleOption; mode: CreationMode }) {
  if (mode === 'wechat-article') {
    return <strong>{option.articleTitle}</strong>;
  }
  return (
    <span className="creation-title-option__copy">
      <strong>{option.coverTitle}</strong>
      <small>{option.bodyTitle}</small>
    </span>
  );
}

function FrameworkView({
  framework,
  suggestion,
  isProcessing,
  onSuggestionChange,
  onRegenerate,
  onConfirm,
}: {
  framework: CreationFramework;
  suggestion: string;
  isProcessing: boolean;
  onSuggestionChange: (value: string) => void;
  onRegenerate: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="creation-work-card" aria-labelledby="creation-framework-title">
      <div className="creation-work-card__header">
        <div>
          <span className="creation-section-kicker">AI 整理结果</span>
          <h2 id="creation-framework-title">内容框架</h2>
          <p>先确认内容要讲什么，再进入成稿编辑。</p>
        </div>
        <span className="creation-state-mark">待确认</span>
      </div>
      {isProcessing ? (
        <CreationProcessing label="AI 正在优化内容框架" detail="正在根据你的建议重新组织内容结构" />
      ) : null}
      <div className="creation-framework-outline">
        <div className="creation-framework-outline__lead">
          <span>创作目标</span>
          <p>{framework.goal}</p>
        </div>
        <div className="creation-framework-outline__row creation-framework-outline__row--two">
          <div>
            <span>目标受众</span>
            <p>{framework.audience}</p>
          </div>
          <div>
            <span>核心观点</span>
            <p>{framework.viewpoint}</p>
          </div>
        </div>
        <div className="creation-framework-outline__section">
          <span>内容结构</span>
          <ol>
            {framework.structure.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div className="creation-framework-outline__row creation-framework-outline__row--three">
          <div>
            <span>不建议出现的内容</span>
            <ul>
              {framework.avoid.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <span>预计内容长度</span>
            <p>{framework.length}</p>
          </div>
          <div>
            <span>语气建议</span>
            <p>{framework.tone}</p>
          </div>
        </div>
      </div>
      <div className="creation-suggestion-box creation-suggestion-box--framework">
        <label htmlFor="framework-suggestion">
          <span>请告诉 AI 需要如何调整这个内容框架</span>
          <small>可选：补充场景、语气、重点或需要删减的内容。</small>
        </label>
        <textarea
          id="framework-suggestion"
          value={suggestion}
          onChange={(event) => onSuggestionChange(event.target.value)}
          placeholder="例如：增加下午三点的办公室场景，让开头更具体。"
          rows={3}
        />
      </div>
      <div className="creation-action-bar">
        <button
          type="button"
          className="button button--secondary"
          disabled={isProcessing}
          onClick={onRegenerate}
        >
          重新生成框架
        </button>
        <button
          type="button"
          className="button button--primary"
          disabled={isProcessing}
          onClick={onConfirm}
        >
          确认内容框架
        </button>
      </div>
    </section>
  );
}

function DraftView({
  mode,
  draft,
  suggestion,
  titleOptions,
  activeTitle,
  activeTitleSource,
  selectedTitleId,
  manualDraft,
  isManualEditing,
  isProcessing,
  saveSuccess,
  onDraftChange,
  onSuggestionChange,
  onRegenerateDraft,
  onSelectTitle,
  onRefreshTitles,
  onOpenManualTitle,
  onCloseManualTitle,
  onManualChange,
  onConfirmManualTitle,
  onSave,
}: {
  mode: CreationMode;
  draft: string;
  suggestion: string;
  titleOptions: CreationTitleOption[];
  activeTitle: CreationTitleOption | null;
  activeTitleSource: 'ai' | 'manual' | null;
  selectedTitleId: string | null;
  manualDraft: CreationTitleOption;
  isManualEditing: boolean;
  isProcessing: boolean;
  saveSuccess: boolean;
  onDraftChange: (value: string) => void;
  onSuggestionChange: (value: string) => void;
  onRegenerateDraft: () => void;
  onSelectTitle: (option: CreationTitleOption) => void;
  onRefreshTitles: () => void;
  onOpenManualTitle: () => void;
  onCloseManualTitle: () => void;
  onManualChange: (field: 'coverTitle' | 'bodyTitle' | 'articleTitle', value: string) => void;
  onConfirmManualTitle: () => void;
  onSave: () => void;
}) {
  return (
    <section
      className="creation-work-card creation-draft-card"
      aria-labelledby="creation-draft-title"
    >
      <div className="creation-work-card__header">
        <div>
          <span className="creation-section-kicker">最终内容</span>
          <h2 id="creation-draft-title">成稿内容</h2>
          <p>{getModeName(mode)} · 可直接编辑正文，再选择一组标题。</p>
        </div>
        <span className="creation-state-mark creation-state-mark--ready">可编辑</span>
      </div>
      {isProcessing ? (
        <CreationProcessing label="AI 正在生成内容" detail="正在保留当前上下文并更新成稿" />
      ) : null}
      <div className="creation-draft-layout">
        <div className="creation-draft-editor">
          <div className="creation-field-heading">
            <span>成稿正文</span>
            <small>内容版本 Demo</small>
          </div>
          <textarea
            id="draft-editor"
            aria-label="成稿正文"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            rows={18}
          />
          <div className="creation-suggestion-box creation-suggestion-box--draft">
            <label htmlFor="draft-suggestion">请输入希望 AI 修改的方向</label>
            <textarea
              id="draft-suggestion"
              value={suggestion}
              onChange={(event) => onSuggestionChange(event.target.value)}
              placeholder="例如：把第二段改得更像办公室下午三点的真实场景。"
              rows={2}
            />
            <button
              type="button"
              className="button button--secondary"
              disabled={isProcessing}
              onClick={onRegenerateDraft}
            >
              重新生成成稿
            </button>
          </div>
        </div>

        <aside className="creation-title-panel" aria-labelledby="title-options-title">
          <div className="creation-title-panel__header">
            <div>
              <span className="creation-section-kicker">AI 标题方案</span>
              <h3 id="title-options-title">选择一组标题</h3>
            </div>
            <button
              type="button"
              className="button button--secondary"
              disabled={isProcessing}
              onClick={onRefreshTitles}
            >
              重新换 5 组
            </button>
          </div>
          {activeTitle ? (
            <div className="creation-active-title" aria-live="polite">
              <span>当前生效 · {activeTitleSource === 'manual' ? '手动修改' : 'AI 标题'}</span>
              <DraftTitle option={activeTitle} mode={mode} />
            </div>
          ) : null}
          <div className="creation-title-list">
            {titleOptions.map((option) => {
              const isSelected = selectedTitleId === option.id;
              return (
                <article
                  className={`creation-title-option${isSelected ? ' is-selected' : ''}`}
                  key={option.id}
                >
                  <DraftTitle option={option} mode={mode} />
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => onSelectTitle(option)}
                    disabled={isProcessing}
                  >
                    {isSelected ? '当前生效' : '选择此组'}
                  </button>
                </article>
              );
            })}
          </div>
          <div className="creation-manual-title-prompt">
            <span>以上都不满意？</span>
            <span aria-hidden="true">➡️</span>
            <button
              type="button"
              className="creation-manual-title-toggle"
              onClick={onOpenManualTitle}
              disabled={isProcessing}
            >
              手动修改组合标题
            </button>
          </div>
          {isManualEditing ? (
            <div className="creation-modal-layer creation-modal-layer--title" role="presentation">
              <button
                type="button"
                className="creation-modal-backdrop"
                onClick={onCloseManualTitle}
                aria-label="关闭手动标题编辑"
              />
              <section
                className="creation-title-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="manual-title-dialog-title"
              >
                <div className="creation-title-dialog__header">
                  <div>
                    <span className="creation-section-kicker">标题编辑</span>
                    <h2 id="manual-title-dialog-title">手动修改组合标题</h2>
                    <p>如果 AI 标题都不合适，可以直接修改这一组标题。</p>
                  </div>
                  <button
                    type="button"
                    className="creation-modal__close"
                    onClick={onCloseManualTitle}
                    aria-label="关闭手动标题编辑"
                  >
                    ×
                  </button>
                </div>
                <div className="creation-manual-title-form">
                  {mode === 'wechat-article' ? (
                    <label>
                      文章标题
                      <input
                        value={manualDraft.articleTitle ?? ''}
                        onChange={(event) => onManualChange('articleTitle', event.target.value)}
                      />
                    </label>
                  ) : (
                    <>
                      <label>
                        封面标题
                        <input
                          value={manualDraft.coverTitle ?? ''}
                          onChange={(event) => onManualChange('coverTitle', event.target.value)}
                        />
                      </label>
                      <label>
                        正文标题 / 笔记标题
                        <input
                          value={manualDraft.bodyTitle ?? ''}
                          onChange={(event) => onManualChange('bodyTitle', event.target.value)}
                        />
                      </label>
                    </>
                  )}
                </div>
                <div className="creation-title-dialog__footer">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={onCloseManualTitle}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={onConfirmManualTitle}
                  >
                    确认手动标题
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </aside>
      </div>
      {saveSuccess ? (
        <div className="creation-save-success" role="status">
          已保存到待发布成稿库
        </div>
      ) : null}
      <div className="creation-action-bar creation-action-bar--save">
        <span>
          {activeTitle
            ? '当前标题会与成稿一起保存。'
            : '请先选择一组标题，或确认手动修改后的标题。'}
        </span>
        <button
          type="button"
          className="button button--primary"
          disabled={isProcessing || !activeTitle}
          onClick={onSave}
        >
          保存到待发布成稿库
        </button>
      </div>
    </section>
  );
}

function SplitView({
  copiedIds,
  onCopy,
}: {
  copiedIds: Set<string>;
  onCopy: (id: string, prompt: string) => void;
}) {
  return (
    <section className="creation-work-card" aria-labelledby="split-title">
      <div className="creation-work-card__header">
        <div>
          <span className="creation-section-kicker">图文延伸结果</span>
          <h2 id="split-title">分屏结构与生图提示词</h2>
          <p>成稿已保存，以下内容可以继续交给设计或生图流程。</p>
        </div>
        <span className="creation-state-mark creation-state-mark--ready">已生成</span>
      </div>
      <div className="creation-split-grid">
        {mockSplitCards.map((card) => {
          const isCopied = copiedIds.has(card.id);
          return (
            <article className="creation-split-card" key={card.id}>
              <div className="creation-split-card__topline">
                <strong>{card.screen}</strong>
                <span>图文结构</span>
              </div>
              <dl>
                <div>
                  <dt>排版建议</dt>
                  <dd>{card.layout}</dd>
                </div>
                <div>
                  <dt>文字内容</dt>
                  <dd>{card.copy}</dd>
                </div>
                <div>
                  <dt>画面构图</dt>
                  <dd>{card.composition}</dd>
                </div>
                <div>
                  <dt>生图提示词</dt>
                  <dd>{card.prompt}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => onCopy(card.id, card.prompt)}
              >
                {isCopied ? '已复制' : '复制'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ContentCreationPage() {
  const context = useMemo(getCreationContext, []);
  const [topics, setTopics] = useState<TopicItem[]>(loadTopicItems);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(context.topicId);
  const [selectedScheduleId, setSelectedScheduleId] = useState(context.scheduleId);
  const [selectedType, setSelectedType] = useState<TopicType | ''>(context.type);
  const [selectedMode, setSelectedMode] = useState<CreationMode | null>(
    context.mode === 'preview' ? 'image-text' : context.mode === 'replicate' ? 'replicate' : null,
  );
  const [phase, setPhase] = useState<CreationPhase>(
    context.mode === 'preview' ? 'draft' : 'context',
  );
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [draftDocumentIds, setDraftDocumentIds] = useState<string[]>([]);
  const [manualMaterial, setManualMaterial] = useState('');
  const [referenceLink, setReferenceLink] = useState(context.sourceUrl);
  const [linkError, setLinkError] = useState('');
  const [isDocumentPickerOpen, setIsDocumentPickerOpen] = useState(false);
  const [processing, setProcessing] = useState<ProcessingKind | null>(null);
  const [creationError, setCreationError] = useState<{
    message: string;
    action?: CreationErrorAction;
  } | null>(null);
  const [framework, setFramework] = useState<CreationFramework>(() =>
    getMockFramework('image-text'),
  );
  const [frameworkRound, setFrameworkRound] = useState(0);
  const [frameworkSuggestion, setFrameworkSuggestion] = useState('');
  const [draft, setDraft] = useState(() => getMockDraft('image-text'));
  const [draftRound, setDraftRound] = useState(0);
  const [draftSuggestion, setDraftSuggestion] = useState('');
  const [titleOptions, setTitleOptions] = useState<CreationTitleOption[]>(() =>
    getMockTitleOptions('image-text'),
  );
  const [titleRound, setTitleRound] = useState(0);
  const [activeTitle, setActiveTitle] = useState<CreationTitleOption | null>(
    context.mode === 'preview' ? getMockTitleOptions('image-text')[0] : null,
  );
  const [activeTitleSource, setActiveTitleSource] = useState<'ai' | 'manual' | null>(
    context.mode === 'preview' ? 'ai' : null,
  );
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(
    context.mode === 'preview' ? getMockTitleOptions('image-text')[0].id : null,
  );
  const [manualTitleDraft, setManualTitleDraft] = useState<CreationTitleOption>(
    () => getMockTitleOptions('image-text')[0],
  );
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(context.mode === 'preview');
  const [savedContentId, setSavedContentId] = useState('');
  const [savedAssetGroupId, setSavedAssetGroupId] = useState('');
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [splitReady, setSplitReady] = useState(false);
  const [legacySuccess, setLegacySuccess] = useState('');
  const timersRef = useRef<number[]>([]);
  const contextHydrationRef = useRef(false);

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);
  const selectedSchedule = selectedTopic?.schedules.find(
    (schedule) => schedule.id === selectedScheduleId,
  );
  const isPreview = context.mode === 'preview';
  const selectedDocuments = initialBrainDocuments.filter((document) =>
    draftDocumentIds.includes(document.id),
  );

  useEffect(() => {
    return () => timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (
      contextHydrationRef.current ||
      !context.topicId ||
      context.topicId !== selectedTopicId ||
      !selectedTopic
    ) {
      return;
    }
    contextHydrationRef.current = true;
    if (!selectedScheduleId) {
      setSelectedScheduleId(getPreferredSchedule(selectedTopic)?.id ?? '');
    }
    if (!selectedType) {
      setSelectedType(selectedTopic.type);
    }
  }, [context.topicId, selectedTopic, selectedTopicId, selectedScheduleId, selectedType]);

  useEffect(() => {
    if (!isPreview || selectedTopic) {
      return;
    }
    if (context.title) {
      setLegacySuccess('');
    }
  }, [context.title, isPreview, selectedTopic]);

  const later = (callback: () => void, delay = 1100) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  };

  const handleTopicChange = (topicId: string) => {
    const nextTopic = topics.find((topic) => topic.id === topicId);
    setSelectedTopicId(topicId);
    setSelectedScheduleId(getPreferredSchedule(nextTopic)?.id ?? '');
    setSelectedType(nextTopic?.type ?? '');
  };

  const handleModeSelect = (mode: CreationMode) => {
    setSelectedMode(mode);
    setTitleOptions(getMockTitleOptions(mode));
    setManualTitleDraft(getMockTitleOptions(mode)[0]);
    setActiveTitle(null);
    setActiveTitleSource(null);
    setSelectedTitleId(null);
    setCreationError(null);
  };

  const handleStartCreation = () => {
    if (!selectedMode) {
      return;
    }
    setPhase('materials');
    setCreationError(null);
    setLinkError('');
  };

  const handleStartMaterials = () => {
    if (!selectedMode || processing) {
      return;
    }
    if (selectedMode === 'replicate') {
      if (!referenceLink.trim()) {
        setLinkError('请输入原爆款内容链接');
        return;
      }
      if (!isValidContentLink(referenceLink)) {
        setLinkError('请输入有效内容链接');
        return;
      }
    }

    setDraftDocumentIds(selectedDocumentIds);
    setProcessing('materials');
    setCreationError(null);
    later(() => {
      const mode = selectedMode;
      setDraft(getMockDraft(mode));
      setTitleOptions(getMockTitleOptions(mode));
      setManualTitleDraft(getMockTitleOptions(mode)[0]);
      setDraftRound(0);
      setTitleRound(0);
      setSaveSuccess(false);
      setProcessing(null);
      if (mode === 'replicate') {
        setPhase('draft');
      } else {
        setFramework(getMockFramework(mode));
        setFrameworkRound(0);
        setPhase('framework');
      }
    });
  };

  const handleFrameworkRegenerate = () => {
    if (!selectedMode || processing) {
      return;
    }
    setProcessing('framework');
    setCreationError(null);
    later(() => {
      if (frameworkSuggestion.includes('失败')) {
        setCreationError({
          message: '内容框架暂时没有生成成功，请重新尝试。',
          action: 'framework',
        });
        setProcessing(null);
        return;
      }
      const nextRound = frameworkRound + 1;
      setFramework(getMockFramework(selectedMode, nextRound));
      setFrameworkRound(nextRound);
      setProcessing(null);
    });
  };

  const handleConfirmFramework = () => {
    if (!selectedMode || processing) {
      return;
    }
    setDraft(getMockDraft(selectedMode));
    setTitleOptions(getMockTitleOptions(selectedMode));
    setManualTitleDraft(getMockTitleOptions(selectedMode)[0]);
    setPhase('draft');
    setCreationError(null);
  };

  const handleDraftRegenerate = () => {
    if (!selectedMode || processing) {
      return;
    }
    setProcessing('draft');
    setCreationError(null);
    later(() => {
      if (draftSuggestion.includes('失败')) {
        setCreationError({ message: '成稿暂时没有生成成功，请重新尝试。', action: 'draft' });
        setProcessing(null);
        return;
      }
      const nextRound = draftRound + 1;
      setDraft(getMockDraft(selectedMode, nextRound));
      setDraftRound(nextRound);
      setProcessing(null);
    });
  };

  const handleSelectTitle = (option: CreationTitleOption) => {
    setActiveTitle(option);
    setActiveTitleSource('ai');
    setSelectedTitleId(option.id);
    setIsManualEditing(false);
    setSaveSuccess(false);
    setCreationError(null);
  };

  const handleRefreshTitles = () => {
    if (!selectedMode || processing) {
      return;
    }
    setProcessing('titles');
    setCreationError(null);
    later(() => {
      const nextRound = titleRound + 1;
      setTitleOptions(getMockTitleOptions(selectedMode, nextRound));
      setTitleRound(nextRound);
      setSelectedTitleId(null);
      setProcessing(null);
    });
  };

  const handleOpenManualTitle = () => {
    setManualTitleDraft(activeTitle ?? titleOptions[0]);
    setIsManualEditing(true);
  };

  const handleManualTitleChange = (
    field: 'coverTitle' | 'bodyTitle' | 'articleTitle',
    value: string,
  ) => {
    setManualTitleDraft((current) => ({ ...current, [field]: value }));
  };

  const handleConfirmManualTitle = () => {
    const hasTitle = Boolean(
      selectedMode === 'wechat-article'
        ? manualTitleDraft.articleTitle?.trim()
        : manualTitleDraft.coverTitle?.trim() || manualTitleDraft.bodyTitle?.trim(),
    );
    if (!hasTitle) {
      setCreationError({ message: '请至少填写一个标题后再确认。' });
      return;
    }
    setActiveTitle({ ...manualTitleDraft, id: `manual-${Date.now()}` });
    setActiveTitleSource('manual');
    setSelectedTitleId(null);
    setIsManualEditing(false);
    setSaveSuccess(false);
    setCreationError(null);
  };

  const updateTopicsWithContent = (contentId: string) => {
    setTopics((current) => {
      const next = current.map((topic) => {
        if (topic.id !== selectedTopicId) {
          return topic;
        }
        return {
          ...topic,
          contentStatus: 'completed' as const,
          contentId,
          schedules: topic.schedules.map((schedule) =>
            schedule.id === selectedScheduleId
              ? { ...schedule, status: 'completed' as const, contentId }
              : schedule,
          ),
        };
      });
      saveTopicItems(next);
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedMode || !activeTitle || processing) {
      return;
    }
    setProcessing('saving');
    setCreationError(null);
    later(() => {
      if (draftSuggestion.includes('保存失败')) {
        setCreationError({ message: '保存没有完成，请重新保存当前成稿。', action: 'save' });
        setProcessing(null);
        return;
      }
      const contentId = savedContentId || createTopicId('content');
      updateTopicsWithContent(contentId);
      setSavedContentId(contentId);
      if (!savedAssetGroupId) {
        const assetTitle = getAssetTitle(
          activeTitle,
          selectedMode,
          selectedTopic?.title ?? context.title ?? '未命名成稿',
        );
        const assetGroup = createContentAssetGroup({
          title: assetTitle,
          mode: selectedMode,
          sourcePlatform: resolveCreationPlatform(
            selectedMode,
            selectedSchedule?.channel,
            referenceLink,
          ),
          body: draft,
          tags: selectedType ? [getTopicTypeLabel(selectedType)] : [],
          topicId: selectedTopic?.id || context.topicId || undefined,
          topicTitle: selectedTopic?.title || context.title || undefined,
          scheduleId: selectedSchedule?.id || context.scheduleId || undefined,
          scheduleDate: selectedSchedule?.date || context.scheduleDate || undefined,
          splitCards: selectedMode === 'image-text' ? mockSplitCards : [],
        });
        const currentAssets = loadContentAssetGroups();
        saveContentAssetGroups([assetGroup, ...currentAssets]);
        setSavedAssetGroupId(assetGroup.id);
      }
      setSaveSuccess(true);
      setProcessing(null);
      if (selectedMode === 'image-text') {
        setPhase('split');
        setSplitReady(false);
        setProcessing('split');
        later(() => {
          setSplitReady(true);
          setProcessing(null);
        }, 1200);
      }
    });
  };

  const handleRetry = () => {
    if (!creationError?.action) {
      return;
    }
    if (creationError.action === 'framework') handleFrameworkRegenerate();
    if (creationError.action === 'draft') handleDraftRegenerate();
    if (creationError.action === 'titles') handleRefreshTitles();
    if (creationError.action === 'save') handleSave();
  };

  const handleLegacyComplete = () => {
    const contentId = createTopicId('content');
    updateTopicsWithContent(contentId);
    setSavedContentId(contentId);
    setLegacySuccess(`已模拟完成创作，生成内容 ID：${contentId}`);
  };

  const handleCopyPrompt = async (id: string, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Clipboard access may be unavailable in a local demo. The UI still confirms the action.
    }
    setCopiedIds((current) => new Set(current).add(id));
    later(() => {
      setCopiedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, 1800);
  };

  const returnToTopicPool = () => {
    window.location.hash = selectedTopicId
      ? `#topic-pool?focus=pool&topicId=${encodeURIComponent(selectedTopicId)}`
      : '#topic-pool?focus=pool';
  };

  return (
    <div className="app-shell app-shell--content-creation">
      <ProductSidebar activeModule="content-creation" />
      <main className="app-main content-creation-main" id="content-creation">
        <header className="topbar">
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>

        <div className="page-content content-creation-content">
          {creationError ? (
            <ErrorNotice
              message={creationError.message}
              onClose={() => setCreationError(null)}
              onRetry={creationError.action ? handleRetry : undefined}
              retryLabel={creationError.action === 'save' ? '重新保存' : '重新尝试'}
            />
          ) : null}

          {context.mode === 'replicate' ? (
            <div className="creation-replication-context" role="status">
              <div>
                <strong>爆款分析上下文已带入</strong>
                <span>
                  {context.analysisId ? `分析记录 ${context.analysisId}` : '当前分析记录'} ·
                  文字版脚本与拆解报告
                </span>
              </div>
              <span>创作方式已选择：爆款一键复刻</span>
            </div>
          ) : null}

          {phase === 'context' ? (
            <>
              <ContextPanel
                topics={topics}
                selectedTopicId={selectedTopicId}
                selectedScheduleId={selectedScheduleId}
                selectedType={selectedType}
                showAllTopics={showAllTopics}
                onTopicChange={handleTopicChange}
                onScheduleChange={setSelectedScheduleId}
                onTypeChange={setSelectedType}
                onToggleTopicScope={() => setShowAllTopics((current) => !current)}
              />
              <section className="creation-method-section" aria-labelledby="creation-method-title">
                <div className="creation-section-heading">
                  <div>
                    <span className="creation-section-kicker">创作方式</span>
                    <h2 id="creation-method-title">选择一种创作方式</h2>
                  </div>
                </div>
                <div className="creation-method-grid">
                  {creationModeOptions.map((option) => (
                    <button
                      type="button"
                      className={`creation-method-card${selectedMode === option.id ? ' is-selected' : ''}`}
                      key={option.id}
                      onClick={() => handleModeSelect(option.id)}
                      aria-pressed={selectedMode === option.id}
                    >
                      <span className="creation-method-card__icon" aria-hidden="true">
                        {option.icon}
                      </span>
                      <span className="creation-method-card__copy">
                        <strong>{option.name}</strong>
                        <small>{option.description}</small>
                        <em>{option.output}</em>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              {legacySuccess ? (
                <div className="creation-save-success" role="status">
                  {legacySuccess}
                </div>
              ) : null}
              <div className="creation-action-bar creation-action-bar--page">
                <span>
                  {selectedMode
                    ? `已选择：${getModeName(selectedMode)}`
                    : '请选择一种创作方式后继续。'}
                </span>
                <div className="creation-action-bar__buttons">
                  {context.mode === 'blank' ? (
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={handleLegacyComplete}
                    >
                      模拟完成创作
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={returnToTopicPool}
                  >
                    返回选题池
                  </button>
                  <button
                    type="button"
                    className="button button--primary button--wide"
                    disabled={!selectedMode}
                    onClick={handleStartCreation}
                  >
                    开始创作
                  </button>
                </div>
              </div>
            </>
          ) : (
            <ContextPanel
              topics={topics}
              selectedTopicId={selectedTopicId}
              selectedScheduleId={selectedScheduleId}
              selectedType={selectedType}
              showAllTopics={showAllTopics}
              compact
            />
          )}

          {phase === 'materials' ? (
            <section
              className="creation-work-card creation-materials-card"
              aria-labelledby="materials-title"
            >
              <div className="creation-work-card__header">
                <div>
                  <span className="creation-section-kicker">素材收集</span>
                  <h2 id="materials-title">
                    {selectedMode === 'replicate' ? '爆款一键复刻' : '收集创作素材'}
                  </h2>
                </div>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setPhase('context')}
                  disabled={Boolean(processing)}
                >
                  返回选择方式
                </button>
              </div>
              {selectedMode === 'replicate' ? (
                <div className="creation-link-field">
                  <label htmlFor="reference-link">原爆款内容链接</label>
                  <input
                    id="reference-link"
                    type="url"
                    value={referenceLink}
                    onChange={(event) => {
                      setReferenceLink(event.target.value);
                      setLinkError('');
                    }}
                    placeholder="https://example.com/content/your-reference"
                    aria-invalid={Boolean(linkError)}
                  />
                  {linkError ? <span className="creation-inline-error">{linkError}</span> : null}
                </div>
              ) : null}
              <div className="creation-material-columns">
                <div className="creation-material-section">
                  <div className="creation-field-heading">
                    <div>
                      <span>企业知识库素材</span>
                      <small>从企业大脑选择 Markdown 文档</small>
                    </div>
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => setIsDocumentPickerOpen(true)}
                    >
                      从企业大脑选择
                    </button>
                  </div>
                  <div className="creation-selected-documents">
                    {selectedDocuments.length ? (
                      selectedDocuments.map((document) => (
                        <div className="creation-selected-document" key={document.id}>
                          <span className="creation-selected-document__icon" aria-hidden="true">
                            ≡
                          </span>
                          <span>
                            <strong>{document.title}</strong>
                            <small>
                              {getFolderName(document.folderId)} · {document.fileName}
                            </small>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraftDocumentIds((current) =>
                                current.filter((id) => id !== document.id),
                              )
                            }
                            aria-label={`删除已选文档 ${document.title}`}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="creation-empty-state creation-empty-state--inline">
                        尚未选择文档，可以只使用手动素材继续。
                      </div>
                    )}
                  </div>
                </div>
                <div className="creation-material-section">
                  <label className="creation-field-heading" htmlFor="manual-material">
                    <span>手动输入素材</span>
                    <small>事实、案例、表达要求或限制条件</small>
                  </label>
                  <textarea
                    id="manual-material"
                    value={manualMaterial}
                    onChange={(event) => setManualMaterial(event.target.value)}
                    placeholder="请输入与本次创作有关的补充素材、事实、案例、表达要求或限制条件"
                    rows={8}
                  />
                </div>
              </div>
              <div className="creation-material-summary">
                <div>
                  <span>当前选题</span>
                  <strong>{selectedTopic?.title ?? '未绑定选题'}</strong>
                </div>
                <div>
                  <span>当前排期</span>
                  <strong>
                    {selectedSchedule ? formatDate(selectedSchedule.date) : '未绑定排期'}
                  </strong>
                </div>
                <div>
                  <span>知识库文档</span>
                  <strong>{draftDocumentIds.length} 篇</strong>
                </div>
                <div>
                  <span>手动输入</span>
                  <strong>{manualMaterial.trim().length} 字</strong>
                </div>
              </div>
              {processing === 'materials' ? (
                <CreationProcessing
                  label={
                    selectedMode === 'replicate' ? 'AI 正在分析原内容和整理素材' : 'AI 正在整理素材'
                  }
                  detail="正在合并选题、知识库文档和手动补充内容"
                />
              ) : null}
              <div className="creation-action-bar">
                <span>准备好后，AI 会先整理结构化创作依据。</span>
                <button
                  type="button"
                  className="button button--primary"
                  disabled={Boolean(processing)}
                  onClick={handleStartMaterials}
                >
                  {selectedMode === 'replicate' ? '开始复刻' : '开始整理素材'}
                </button>
              </div>
            </section>
          ) : null}

          {phase === 'framework' && selectedMode ? (
            <>
              <div className="creation-workflow-stepper" aria-label="创作进度">
                <span className="is-done">1 素材</span>
                <span className="is-active">2 内容框架</span>
                <span>3 成稿预览</span>
              </div>
              <FrameworkView
                framework={framework}
                suggestion={frameworkSuggestion}
                isProcessing={processing === 'framework'}
                onSuggestionChange={setFrameworkSuggestion}
                onRegenerate={handleFrameworkRegenerate}
                onConfirm={handleConfirmFramework}
              />
            </>
          ) : null}

          {phase === 'draft' && selectedMode ? (
            <>
              <div className="creation-workflow-stepper" aria-label="创作进度">
                <span className="is-done">1 素材</span>
                <span className={selectedMode === 'replicate' ? 'is-done' : 'is-done'}>
                  {selectedMode === 'replicate' ? '2 直接成稿' : '2 内容框架'}
                </span>
                <span className="is-active">3 成稿预览</span>
              </div>
              <DraftView
                mode={selectedMode}
                draft={draft}
                suggestion={draftSuggestion}
                titleOptions={titleOptions}
                activeTitle={activeTitle}
                activeTitleSource={activeTitleSource}
                selectedTitleId={selectedTitleId}
                manualDraft={manualTitleDraft}
                isManualEditing={isManualEditing}
                isProcessing={Boolean(processing)}
                saveSuccess={saveSuccess}
                onDraftChange={setDraft}
                onSuggestionChange={setDraftSuggestion}
                onRegenerateDraft={handleDraftRegenerate}
                onSelectTitle={handleSelectTitle}
                onRefreshTitles={handleRefreshTitles}
                onOpenManualTitle={handleOpenManualTitle}
                onCloseManualTitle={() => setIsManualEditing(false)}
                onManualChange={handleManualTitleChange}
                onConfirmManualTitle={handleConfirmManualTitle}
                onSave={handleSave}
              />
              {saveSuccess && savedAssetGroupId ? (
                <a
                  className="button button--primary creation-assets-link"
                  href={`#content-assets?groupId=${encodeURIComponent(savedAssetGroupId)}`}
                >
                  进入内容资产库
                </a>
              ) : null}
              {isPreview ? (
                <button
                  type="button"
                  className="button button--secondary creation-return-button"
                  onClick={returnToTopicPool}
                >
                  返回选题池
                </button>
              ) : null}
            </>
          ) : null}

          {phase === 'split' && selectedMode === 'image-text' ? (
            <>
              {!splitReady || processing === 'split' ? (
                <CreationProcessing
                  label="正在根据成稿整理分屏结构和生图提示词"
                  detail="AI 正在把成稿拆成适合继续制作的画面卡片"
                />
              ) : (
                <SplitView copiedIds={copiedIds} onCopy={handleCopyPrompt} />
              )}
              {splitReady ? (
                <div className="creation-next-links">
                  <a
                    className="button button--primary"
                    href={
                      savedAssetGroupId
                        ? `#content-assets?groupId=${encodeURIComponent(savedAssetGroupId)}`
                        : '#content-assets'
                    }
                  >
                    进入内容资产库
                  </a>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={returnToTopicPool}
                  >
                    返回选题池
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
      {isDocumentPickerOpen ? (
        <DocumentPicker
          selectedIds={selectedDocumentIds}
          onToggle={(id) =>
            setSelectedDocumentIds((current) =>
              current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
            )
          }
          onClose={() => setIsDocumentPickerOpen(false)}
          onConfirm={() => {
            setDraftDocumentIds(selectedDocumentIds);
            setIsDocumentPickerOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
