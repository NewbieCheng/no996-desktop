import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductSidebar } from './components/ProductSidebar';
import { mockSplitCards } from './contentCreationMockData';
import {
  addOrRegeneratePlatform,
  loadContentAssetGroups,
  saveContentAssetGroups,
} from './contentAssetStorage';
import {
  assetModeLabels,
  assetPlatformLabels,
  assetStatusLabels,
  type AssetPlatform,
  type ContentAssetGroup,
  type PlatformDraft,
} from './contentAssetTypes';
import { loadTopicItems, saveTopicItems } from './topicPoolStorage';
import type { TopicItem, TopicSchedule } from './topicPoolTypes';

type AssetTab = 'unpublished' | 'published';
type DetailTab = 'content' | 'split' | 'history';

const assetPlatforms: AssetPlatform[] = ['xiaohongshu', 'douyin', 'video-account', 'wechat'];

function formatDate(date?: string) {
  if (!date) {
    return '未关联';
  }
  const [, month, day] = date.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

function getGeneratedPlatforms(group: ContentAssetGroup) {
  return assetPlatforms.filter((platform) => Boolean(group.platforms[platform]));
}

function getPrimaryDraft(group: ContentAssetGroup) {
  return group.platforms[group.sourcePlatform] ?? group.platforms[getGeneratedPlatforms(group)[0]];
}

function getExcerpt(body: string) {
  return body.split(/\n+/).filter(Boolean).slice(0, 5).join('\n');
}

function createAdaptedVariant(
  group: ContentAssetGroup,
  platform: AssetPlatform,
): { title: string; body: string; tags: string[] } {
  const source = getPrimaryDraft(group);
  const baseTitle = source?.title ?? group.title;
  const baseBody = source?.body ?? '';
  const titleSuffix: Record<AssetPlatform, string> = {
    xiaohongshu: '生活场景版',
    douyin: '短视频脚本版',
    'video-account': '视频号表达版',
    wechat: '公众号文章版',
  };
  return {
    title: `${baseTitle} · ${titleSuffix[platform]}`,
    body: `这是根据${assetPlatformLabels[platform]}表达习惯整理的适配版本。\n\n${baseBody}`,
    tags: [...(source?.tags ?? []), assetPlatformLabels[platform]],
  };
}

function addManualVersion(
  draft: PlatformDraft,
  title: string,
  body: string,
  tags: string[],
  source: '手动编辑' | '恢复历史版本',
) {
  const nextVersion = draft.currentVersion + 1;
  return {
    ...draft,
    title,
    body,
    tags: [...tags],
    currentVersion: nextVersion,
    versions: [
      ...draft.versions,
      {
        id: `asset-version-${Date.now()}-${nextVersion}`,
        version: nextVersion,
        source,
        createdAt: new Date().toISOString(),
        title,
        body,
        tags: [...tags],
      },
    ],
  };
}

function AssetProcessing({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="asset-processing" role="status" aria-live="polite">
      <div className="asset-processing__bar" aria-hidden="true">
        <span />
      </div>
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  );
}

function AssetToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="asset-toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="关闭提示">
        ×
      </button>
    </div>
  );
}

function ContentAssetCard({
  group,
  onOpen,
  onDistribute,
  onCopy,
}: {
  group: ContentAssetGroup;
  onOpen: () => void;
  onDistribute: () => void;
  onCopy: () => void;
}) {
  const primaryDraft = getPrimaryDraft(group);
  const generatedPlatforms = getGeneratedPlatforms(group);
  return (
    <article
      className="asset-group-card"
      tabIndex={0}
      role="button"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="asset-group-card__header">
        <div>
          <span className="asset-mode-mark">{assetModeLabels[group.mode]}</span>
          <h2>{group.title}</h2>
        </div>
        <span className={`asset-status-mark asset-status-mark--${group.status}`}>
          {assetStatusLabels[group.status]}
        </span>
      </div>
      <div className="asset-group-card__meta">
        <span>首个成稿：{assetPlatformLabels[group.sourcePlatform]}</span>
        <span>关联选题：{group.topicTitle ?? '未关联'}</span>
        <span>关联排期：{formatDate(group.scheduleDate)}</span>
      </div>
      <div className="asset-platform-summary">
        <span>已生成平台</span>
        <div>
          {generatedPlatforms.map((platform) => (
            <em key={platform}>{assetPlatformLabels[platform]}</em>
          ))}
          <small>
            {generatedPlatforms.length} / {assetPlatforms.length}
          </small>
        </div>
      </div>
      <p className="asset-group-card__excerpt">{getExcerpt(primaryDraft?.body ?? '')}</p>
      <div className="asset-group-card__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          查看详情
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={(event) => {
            event.stopPropagation();
            onDistribute();
          }}
        >
          多平台分发
        </button>
        <button
          type="button"
          className="button button--text"
          onClick={(event) => {
            event.stopPropagation();
            onCopy();
          }}
        >
          复制
        </button>
      </div>
    </article>
  );
}

function AssetDetailDrawer({
  group,
  selectedPlatform,
  processingSplit,
  onPlatformChange,
  onClose,
  onCopy,
  onCopyPrompt,
  onSaveDraft,
  onRestoreVersion,
  onOpenDistribution,
  onAssociateSchedule,
  onToggleStatus,
  onRegenerateSplit,
}: {
  group: ContentAssetGroup;
  selectedPlatform: AssetPlatform;
  processingSplit: boolean;
  onPlatformChange: (platform: AssetPlatform) => void;
  onClose: () => void;
  onCopy: (draft: PlatformDraft) => void;
  onCopyPrompt: (prompt: string) => void;
  onSaveDraft: (platform: AssetPlatform, title: string, body: string, tags: string[]) => void;
  onRestoreVersion: (platform: AssetPlatform, versionId: string) => void;
  onOpenDistribution: () => void;
  onAssociateSchedule: () => void;
  onToggleStatus: () => void;
  onRegenerateSplit: () => void;
}) {
  const [detailTab, setDetailTab] = useState<DetailTab>('content');
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const currentDraft = group.platforms[selectedPlatform];

  useEffect(() => {
    setDetailTab('content');
    setIsEditing(false);
  }, [group.id]);

  useEffect(() => {
    setTitle(currentDraft?.title ?? '');
    setBody(currentDraft?.body ?? '');
    setTags(currentDraft?.tags.join('、') ?? '');
    setIsEditing(false);
  }, [selectedPlatform, currentDraft?.id, currentDraft?.currentVersion]);

  const handleSave = () => {
    if (!currentDraft || !title.trim() || !body.trim()) {
      return;
    }
    onSaveDraft(
      selectedPlatform,
      title.trim(),
      body.trim(),
      tags
        .split(/[、,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    );
    setIsEditing(false);
  };

  return (
    <>
      <div className="asset-drawer-backdrop" onClick={onClose} />
      <aside className="asset-detail-drawer" aria-labelledby="asset-detail-title">
        <div className="asset-drawer__header">
          <div>
            <span className="asset-section-kicker">成稿组详情</span>
            <h2 id="asset-detail-title">{group.title}</h2>
            <p>
              {assetModeLabels[group.mode]} · {assetStatusLabels[group.status]}
            </p>
          </div>
          <button
            type="button"
            className="asset-close-button"
            onClick={onClose}
            aria-label="关闭详情"
          >
            ×
          </button>
        </div>
        <div className="asset-drawer__context">
          <div>
            <span>关联选题</span>
            <strong>{group.topicTitle ?? '未关联'}</strong>
          </div>
          <div>
            <span>关联排期</span>
            <strong>{formatDate(group.scheduleDate)}</strong>
          </div>
          <div>
            <span>已生成平台</span>
            <strong>
              {getGeneratedPlatforms(group)
                .map((item) => assetPlatformLabels[item])
                .join(' / ')}
            </strong>
          </div>
        </div>
        <div className="asset-platform-tabs" role="tablist" aria-label="平台版本">
          {assetPlatforms.map((platform) => {
            const isGenerated = Boolean(group.platforms[platform]);
            return (
              <button
                type="button"
                role="tab"
                aria-selected={selectedPlatform === platform}
                className={`asset-platform-tab${selectedPlatform === platform ? ' is-active' : ''}${isGenerated ? ' is-generated' : ''}`}
                key={platform}
                onClick={() => onPlatformChange(platform)}
              >
                <span>{assetPlatformLabels[platform]}</span>
                <small>{isGenerated ? '已生成' : '暂未生成'}</small>
              </button>
            );
          })}
        </div>
        <div className="asset-drawer__body">
          {detailTab === 'content' ? (
            currentDraft ? (
              <div className="asset-platform-content">
                {isEditing ? (
                  <div className="asset-edit-form">
                    <label>
                      标题
                      <input value={title} onChange={(event) => setTitle(event.target.value)} />
                    </label>
                    <label>
                      正文
                      <textarea
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        rows={12}
                      />
                    </label>
                    <label>
                      Tag
                      <input value={tags} onChange={(event) => setTags(event.target.value)} />
                    </label>
                    <div className="asset-inline-actions">
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => setIsEditing(false)}
                      >
                        取消
                      </button>
                      <button type="button" className="button button--primary" onClick={handleSave}>
                        保存修改
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="asset-current-version">
                      <span>当前版本 V{currentDraft.currentVersion}</span>
                      <strong>{assetPlatformLabels[selectedPlatform]}成稿</strong>
                    </div>
                    <h3>{currentDraft.title}</h3>
                    <div className="asset-draft-body">{currentDraft.body}</div>
                    <div className="asset-tags">
                      {currentDraft.tags.map((tag) => (
                        <em key={tag}>#{tag}</em>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="asset-empty-platform">
                <strong>暂未生成</strong>
                <p>可以从当前成稿生成一份适合{assetPlatformLabels[selectedPlatform]}的版本。</p>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={onOpenDistribution}
                >
                  去多平台分发
                </button>
              </div>
            )
          ) : null}
          {detailTab === 'split' ? (
            <SplitPromptPanel
              group={group}
              processing={processingSplit}
              onCopy={onCopyPrompt}
              onRegenerate={onRegenerateSplit}
            />
          ) : null}
          {detailTab === 'history' ? (
            currentDraft ? (
              <VersionHistoryPanel
                draft={currentDraft}
                onRestore={(versionId) => onRestoreVersion(selectedPlatform, versionId)}
              />
            ) : (
              <div className="asset-empty-platform">该平台暂未生成版本历史。</div>
            )
          ) : null}
        </div>
        <div className="asset-drawer__footer">
          <div className="asset-drawer__tabs">
            <button
              type="button"
              className={detailTab === 'content' ? 'is-active' : ''}
              onClick={() => setDetailTab('content')}
            >
              成稿内容
            </button>
            {group.mode === 'image-text' ? (
              <button
                type="button"
                className={detailTab === 'split' ? 'is-active' : ''}
                onClick={() => setDetailTab('split')}
              >
                分屏提示词
              </button>
            ) : null}
            <button
              type="button"
              className={detailTab === 'history' ? 'is-active' : ''}
              onClick={() => setDetailTab('history')}
            >
              版本历史
            </button>
          </div>
          <div className="asset-drawer__actions">
            {currentDraft ? (
              <>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setIsEditing(true)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => onCopy(currentDraft)}
                >
                  一键复制
                </button>
              </>
            ) : null}
            <button type="button" className="button button--secondary" onClick={onOpenDistribution}>
              多平台分发
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={onAssociateSchedule}
              disabled={Boolean(group.scheduleId)}
            >
              {group.scheduleId ? '已关联排期' : '关联排期'}
            </button>
            <button type="button" className="button button--primary" onClick={onToggleStatus}>
              {group.status === 'published' ? '改回未发布' : '标记已发布'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function VersionHistoryPanel({
  draft,
  onRestore,
}: {
  draft: PlatformDraft;
  onRestore: (versionId: string) => void;
}) {
  return (
    <div className="asset-history-panel">
      <div className="asset-subsection-heading">
        <div>
          <span className="asset-section-kicker">版本记录</span>
          <h3>{assetPlatformLabels[draft.platform]}版本历史</h3>
        </div>
        <span>当前 V{draft.currentVersion}</span>
      </div>
      {draft.versions
        .slice()
        .reverse()
        .map((item) => (
          <article
            className={`asset-version-row${item.version === draft.currentVersion ? ' is-current' : ''}`}
            key={item.id}
          >
            <div>
              <strong>版本 {item.version}</strong>
              <span>{item.version === draft.currentVersion ? '当前版本' : item.source}</span>
            </div>
            <p>{item.title}</p>
            <button
              type="button"
              className="button button--text"
              disabled={item.version === draft.currentVersion}
              onClick={() => onRestore(item.id)}
            >
              恢复此版本
            </button>
          </article>
        ))}
    </div>
  );
}

function SplitPromptPanel({
  group,
  processing,
  onCopy,
  onRegenerate,
}: {
  group: ContentAssetGroup;
  processing: boolean;
  onCopy: (prompt: string) => void;
  onRegenerate: () => void;
}) {
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  if (processing || group.splitStatus === 'generating') {
    return (
      <AssetProcessing
        label="正在生成分屏提示词"
        detail="AI 正在根据当前成稿整理排版结构和生图提示词"
      />
    );
  }
  return (
    <div className="asset-split-panel">
      {group.splitStale ? (
        <div className="asset-split-warning" role="status">
          <span>正文已更新，分屏提示词可能需要重新生成</span>
          <button type="button" className="button button--secondary" onClick={onRegenerate}>
            重新生成分屏提示词
          </button>
        </div>
      ) : null}
      {group.splitStatus === 'error' ? (
        <div className="asset-split-warning" role="alert">
          <span>分屏提示词生成失败</span>
          <button type="button" className="button button--secondary" onClick={onRegenerate}>
            重新生成
          </button>
        </div>
      ) : null}
      <div className="asset-split-list">
        {group.splitCards.map((card) => (
          <article className="asset-split-card" key={card.id}>
            <div className="asset-split-card__header">
              <strong>{card.screen}</strong>
              <span>已生成</span>
            </div>
            <dl>
              <div>
                <dt>排版建议</dt>
                <dd>{card.layout}</dd>
              </div>
              <div>
                <dt>屏幕文字</dt>
                <dd>{card.copy}</dd>
              </div>
              <div>
                <dt>生图提示词</dt>
                <dd>{card.prompt}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                onCopy(card.prompt);
                setCopiedIds((current) => new Set(current).add(card.id));
              }}
            >
              {copiedIds.has(card.id) ? '已复制' : '复制'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function DistributionDialog({
  group,
  selection,
  processing,
  conflict,
  onSelectionChange,
  onClose,
  onStart,
  onCancelConflict,
  onConfirmConflict,
}: {
  group: ContentAssetGroup;
  selection: AssetPlatform[];
  processing: boolean;
  conflict: AssetPlatform[];
  onSelectionChange: (platform: AssetPlatform) => void;
  onClose: () => void;
  onStart: () => void;
  onCancelConflict: () => void;
  onConfirmConflict: () => void;
}) {
  return (
    <div className="asset-modal-layer" role="presentation">
      <button
        type="button"
        className="asset-modal-backdrop"
        onClick={onClose}
        aria-label="关闭多平台分发"
      />
      <section
        className="asset-distribution-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="distribution-title"
      >
        <div className="asset-dialog__header">
          <div>
            <span className="asset-section-kicker">AI 内容适配</span>
            <h2 id="distribution-title">多平台分发</h2>
            <p>
              来源成稿：{group.title} · {assetPlatformLabels[group.sourcePlatform]}成稿
            </p>
          </div>
          <button
            type="button"
            className="asset-close-button"
            onClick={onClose}
            aria-label="关闭多平台分发"
          >
            ×
          </button>
        </div>
        <div className="asset-dialog__body">
          <span className="asset-field-label">选择要生成的平台</span>
          <div className="asset-distribution-options">
            {assetPlatforms
              .filter((platform) => platform !== group.sourcePlatform)
              .map((platform) => {
                const isGenerated = Boolean(group.platforms[platform]);
                const isSelected = selection.includes(platform);
                return (
                  <label
                    className={`asset-distribution-option${isSelected ? ' is-selected' : ''}`}
                    key={platform}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectionChange(platform)}
                      disabled={processing}
                    />
                    <span>{assetPlatformLabels[platform]}</span>
                    <small>{isGenerated ? '已生成，重新生成' : '未生成'}</small>
                  </label>
                );
              })}
          </div>
          <p className="asset-dialog__hint">
            AI 会根据不同平台的表达习惯自动改写，生成后仍然可以手动编辑。
          </p>
          {conflict.length > 0 ? (
            <div className="asset-distribution-conflict" role="alert">
              <strong>该平台已经存在成稿，重新生成会创建新版本，是否继续？</strong>
              <span>{conflict.map((item) => assetPlatformLabels[item]).join('、')}</span>
              <div>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={onCancelConflict}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={onConfirmConflict}
                >
                  重新生成
                </button>
              </div>
            </div>
          ) : null}
          {processing ? (
            <AssetProcessing label="正在将内容适配到不同平台" detail="正在整理平台表达和内容版本" />
          ) : null}
        </div>
        <div className="asset-dialog__footer">
          <button
            type="button"
            className="button button--secondary"
            onClick={onClose}
            disabled={processing}
          >
            取消
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={onStart}
            disabled={processing || selection.length === 0}
          >
            开始分发
          </button>
        </div>
      </section>
    </div>
  );
}

function SchedulePickerDialog({
  group,
  topics,
  onClose,
  onSelect,
}: {
  group: ContentAssetGroup;
  topics: TopicItem[];
  onClose: () => void;
  onSelect: (topic: TopicItem, schedule: TopicSchedule) => void;
}) {
  const schedules = topics.flatMap((topic) =>
    topic.schedules
      .filter((schedule) => !schedule.contentId || schedule.id === group.scheduleId)
      .filter(() => !group.topicId || topic.id === group.topicId)
      .map((schedule) => ({ topic, schedule })),
  );
  return (
    <div className="asset-modal-layer" role="presentation">
      <button
        type="button"
        className="asset-modal-backdrop"
        onClick={onClose}
        aria-label="关闭关联排期"
      />
      <section
        className="asset-schedule-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-picker-title"
      >
        <div className="asset-dialog__header">
          <div>
            <span className="asset-section-kicker">内容关联</span>
            <h2 id="schedule-picker-title">关联排期</h2>
            <p>
              {group.topicId ? '只展示当前选题下还没有成稿的排期。' : '选择一个还没有成稿的排期。'}
            </p>
          </div>
          <button
            type="button"
            className="asset-close-button"
            onClick={onClose}
            aria-label="关闭关联排期"
          >
            ×
          </button>
        </div>
        <div className="asset-schedule-options">
          {schedules.length > 0 ? (
            schedules.map(({ topic, schedule }) => (
              <button
                type="button"
                className="asset-schedule-option"
                key={schedule.id}
                onClick={() => onSelect(topic, schedule)}
              >
                <span>{formatDate(schedule.date)}</span>
                <strong>{topic.title}</strong>
                <small>
                  {schedule.channel} · {schedule.id === group.scheduleId ? '当前排期' : '可关联'}
                </small>
              </button>
            ))
          ) : (
            <div className="asset-empty-platform">当前没有可关联的排期。</div>
          )}
        </div>
      </section>
    </div>
  );
}

export function ContentAssetsPage() {
  const [groups, setGroups] = useState<ContentAssetGroup[]>(loadContentAssetGroups);
  const [topics, setTopics] = useState<TopicItem[]>(loadTopicItems);
  const [activeTab, setActiveTab] = useState<AssetTab>('unpublished');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<AssetPlatform>('xiaohongshu');
  const [distributionGroupId, setDistributionGroupId] = useState('');
  const [distributionSelection, setDistributionSelection] = useState<AssetPlatform[]>([]);
  const [distributionConflict, setDistributionConflict] = useState<AssetPlatform[]>([]);
  const [distributionProcessing, setDistributionProcessing] = useState(false);
  const [schedulePickerGroupId, setSchedulePickerGroupId] = useState('');
  const [processingSplitGroupId, setProcessingSplitGroupId] = useState('');
  const [toast, setToast] = useState('');
  const timersRef = useRef<number[]>([]);
  const initialGroupAppliedRef = useRef(false);
  const initialGroupId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('groupId') ?? '';
  }, []);
  const initialPlatform = useMemo<AssetPlatform | ''>(() => {
    if (typeof window === 'undefined') return '';
    const value = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('platform');
    return value && assetPlatforms.includes(value as AssetPlatform) ? (value as AssetPlatform) : '';
  }, []);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const distributionGroup = groups.find((group) => group.id === distributionGroupId);
  const schedulePickerGroup = groups.find((group) => group.id === schedulePickerGroupId);
  const visibleGroups = useMemo(
    () => groups.filter((group) => group.status === activeTab),
    [activeTab, groups],
  );

  useEffect(() => {
    return () => timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (initialGroupAppliedRef.current || !initialGroupId) return;
    const group = groups.find((item) => item.id === initialGroupId);
    if (!group) return;
    initialGroupAppliedRef.current = true;
    setSelectedGroupId(group.id);
    setSelectedPlatform(
      initialPlatform && group.platforms[initialPlatform] ? initialPlatform : group.sourcePlatform,
    );
  }, [groups, initialGroupId, initialPlatform]);

  const later = (callback: () => void, delay = 1100) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  };

  const showToast = (message: string) => {
    setToast(message);
    later(() => setToast(''), 2200);
  };

  const updateGroups = (updater: (current: ContentAssetGroup[]) => ContentAssetGroup[]) => {
    setGroups((current) => {
      const next = updater(current);
      saveContentAssetGroups(next);
      return next;
    });
  };

  const openDetails = (group: ContentAssetGroup, platform = group.sourcePlatform) => {
    setSelectedGroupId(group.id);
    setSelectedPlatform(platform);
  };

  const openDistribution = (group: ContentAssetGroup) => {
    setDistributionGroupId(group.id);
    setDistributionSelection([]);
    setDistributionConflict([]);
  };

  const copyDraft = async (draft: PlatformDraft) => {
    try {
      await navigator.clipboard.writeText(`${draft.title}\n\n${draft.body}`);
    } catch {
      // 本地演示环境可能没有剪贴板权限，仍然给出操作反馈。
    }
    showToast('已复制内容');
  };

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // 本地演示环境可能没有剪贴板权限，仍然给出操作反馈。
    }
    showToast('已复制生图提示词');
  };

  const handleSaveDraft = (
    groupId: string,
    platform: AssetPlatform,
    title: string,
    body: string,
    tags: string[],
  ) => {
    updateGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group;
        const draft = group.platforms[platform];
        if (!draft) return group;
        return {
          ...group,
          platforms: {
            ...group.platforms,
            [platform]: addManualVersion(draft, title, body, tags, '手动编辑'),
          },
          splitStale:
            group.mode === 'image-text' && platform === group.sourcePlatform
              ? true
              : group.splitStale,
        };
      }),
    );
    showToast('已保存为新版本');
  };

  const handleRestoreVersion = (groupId: string, platform: AssetPlatform, versionId: string) => {
    updateGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group;
        const draft = group.platforms[platform];
        const version = draft?.versions.find((item) => item.id === versionId);
        if (!draft || !version) return group;
        return {
          ...group,
          platforms: {
            ...group.platforms,
            [platform]: addManualVersion(
              draft,
              version.title,
              version.body,
              version.tags,
              '恢复历史版本',
            ),
          },
          splitStale:
            group.mode === 'image-text' && platform === group.sourcePlatform
              ? true
              : group.splitStale,
        };
      }),
    );
    showToast('已恢复为新版本');
  };

  const runDistribution = () => {
    const group = distributionGroup;
    if (!group || distributionSelection.length === 0) return;
    setDistributionProcessing(true);
    later(() => {
      updateGroups((current) =>
        current.map((item) => {
          if (item.id !== group.id) return item;
          return distributionSelection.reduce(
            (nextGroup, platform) =>
              addOrRegeneratePlatform(nextGroup, {
                platform,
                ...createAdaptedVariant(nextGroup, platform),
              }),
            item,
          );
        }),
      );
      setDistributionProcessing(false);
      setDistributionGroupId('');
      setDistributionSelection([]);
      setDistributionConflict([]);
      showToast('已完成多平台分发');
    }, 1200);
  };

  const handleStartDistribution = () => {
    const existing = distributionSelection.filter((platform) =>
      Boolean(distributionGroup?.platforms[platform]),
    );
    if (existing.length > 0) {
      setDistributionConflict(existing);
      return;
    }
    runDistribution();
  };

  const handleAssociateSchedule = (
    group: ContentAssetGroup,
    topic: TopicItem,
    schedule: TopicSchedule,
  ) => {
    if (group.scheduleId) {
      showToast('已有排期关联，不能直接换绑');
      return;
    }
    if (schedule.contentId) {
      showToast('该排期已经关联其他成稿');
      return;
    }
    updateGroups((current) =>
      current.map((item) =>
        item.id === group.id
          ? {
              ...item,
              topicId: topic.id,
              topicTitle: topic.title,
              scheduleId: schedule.id,
              scheduleDate: schedule.date,
            }
          : item,
      ),
    );
    const nextTopics = topics.map((item) => ({
      ...item,
      contentStatus: item.id === topic.id ? ('completed' as const) : item.contentStatus,
      schedules: item.schedules.map((itemSchedule) =>
        itemSchedule.id === schedule.id
          ? { ...itemSchedule, status: 'completed' as const, contentId: group.id }
          : itemSchedule,
      ),
    }));
    setTopics(nextTopics);
    saveTopicItems(nextTopics);
    setSchedulePickerGroupId('');
    showToast('已关联排期，排期状态已完成');
  };

  const handleToggleStatus = (group: ContentAssetGroup) => {
    const nextStatus = group.status === 'published' ? 'unpublished' : 'published';
    updateGroups((current) =>
      current.map((item) => (item.id === group.id ? { ...item, status: nextStatus } : item)),
    );
    setActiveTab(nextStatus);
    showToast(nextStatus === 'published' ? '已标记为已发布' : '已改回未发布');
  };

  const handleRegenerateSplit = (groupId: string) => {
    setProcessingSplitGroupId(groupId);
    later(() => {
      updateGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? {
                ...group,
                splitStatus: 'generated',
                splitCards: mockSplitCards.map((card) => ({ ...card })),
                splitStale: false,
              }
            : group,
        ),
      );
      setProcessingSplitGroupId('');
      showToast('分屏提示词已重新生成');
    }, 1000);
  };

  return (
    <div className="app-shell app-shell--content-assets">
      <ProductSidebar activeModule="content-assets" />
      <main className="app-main content-assets-main" id="content-assets">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>内容增长</span>
            <span aria-hidden="true">/</span>
            <strong>内容资产库</strong>
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>
        <div className="page-content content-assets-content">
          <section className="asset-stat-strip" aria-label="内容资产统计">
            <div>
              <span>当前成稿数</span>
              <strong>{groups.length}</strong>
            </div>
            <div>
              <span>已发布成稿数</span>
              <strong>{groups.filter((group) => group.status === 'published').length}</strong>
            </div>
          </section>
          <div className="asset-status-tabs" role="tablist" aria-label="发布状态">
            {(['unpublished', 'published'] as AssetTab[]).map((tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={activeTab === tab ? 'is-active' : ''}
                key={tab}
                onClick={() => setActiveTab(tab)}
              >
                {assetStatusLabels[tab]}
                <small>{groups.filter((group) => group.status === tab).length}</small>
              </button>
            ))}
          </div>
          <section className="asset-list" aria-label={`${assetStatusLabels[activeTab]}成稿`}>
            {visibleGroups.length > 0 ? (
              visibleGroups.map((group) => (
                <ContentAssetCard
                  key={group.id}
                  group={group}
                  onOpen={() => openDetails(group)}
                  onDistribute={() => openDistribution(group)}
                  onCopy={() => {
                    const draft = getPrimaryDraft(group);
                    if (draft) void copyDraft(draft);
                  }}
                />
              ))
            ) : (
              <div className="asset-empty-state">
                <strong>现在还没有内容，快去找一条选题开始创作吧</strong>
                <a className="button button--primary" href="#topic-pool?focus=pool">
                  去找选题
                </a>
              </div>
            )}
          </section>
        </div>
      </main>
      {selectedGroup ? (
        <AssetDetailDrawer
          group={selectedGroup}
          selectedPlatform={selectedPlatform}
          processingSplit={processingSplitGroupId === selectedGroup.id}
          onPlatformChange={setSelectedPlatform}
          onClose={() => setSelectedGroupId('')}
          onCopy={(draft) => void copyDraft(draft)}
          onCopyPrompt={(prompt) => void copyPrompt(prompt)}
          onSaveDraft={(platform, title, body, tags) =>
            handleSaveDraft(selectedGroup.id, platform, title, body, tags)
          }
          onRestoreVersion={(platform, versionId) =>
            handleRestoreVersion(selectedGroup.id, platform, versionId)
          }
          onOpenDistribution={() => openDistribution(selectedGroup)}
          onAssociateSchedule={() => setSchedulePickerGroupId(selectedGroup.id)}
          onToggleStatus={() => handleToggleStatus(selectedGroup)}
          onRegenerateSplit={() => handleRegenerateSplit(selectedGroup.id)}
        />
      ) : null}
      {distributionGroup ? (
        <DistributionDialog
          group={distributionGroup}
          selection={distributionSelection}
          processing={distributionProcessing}
          conflict={distributionConflict}
          onSelectionChange={(platform) =>
            setDistributionSelection((current) =>
              current.includes(platform)
                ? current.filter((item) => item !== platform)
                : [...current, platform],
            )
          }
          onClose={() => {
            if (!distributionProcessing) setDistributionGroupId('');
          }}
          onStart={handleStartDistribution}
          onCancelConflict={() => setDistributionConflict([])}
          onConfirmConflict={runDistribution}
        />
      ) : null}
      {schedulePickerGroup ? (
        <SchedulePickerDialog
          group={schedulePickerGroup}
          topics={topics}
          onClose={() => setSchedulePickerGroupId('')}
          onSelect={(topic, schedule) =>
            handleAssociateSchedule(schedulePickerGroup, topic, schedule)
          }
        />
      ) : null}
      {toast ? <AssetToast message={toast} onClose={() => setToast('')} /> : null}
    </div>
  );
}
