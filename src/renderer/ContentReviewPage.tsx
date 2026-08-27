import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductSidebar } from './components/ProductSidebar';
import {
  analysisScopeLabels,
  displayMetric,
  getPlatformMetricDefinitions,
  hasEnteredMetrics,
  platformMetricDefinitions,
  reviewCoreMetricKeys,
  reviewPlatformLabels,
  reviewPlatformOrder,
  reviewRecordStatusLabels,
  type AnalysisLog,
  type AnalysisReport,
  type AnalysisScope,
  type ContentDataRecord,
  type ContentDataSnapshot,
  type MetricKey,
  type ReviewRecordStatus,
} from './contentReviewTypes';
import {
  deleteContentReviewRecord,
  loadAnalysisLogs,
  loadContentReviewRecords,
  saveAnalysisLogs,
  saveContentReviewRecords,
  syncPublishedAssetGroups,
} from './contentReviewStorage';
import type { AssetPlatform } from './contentAssetTypes';

type TimeFilter = 'all' | '7' | '30';
type AnalysisPhase = 'idle' | 'processing' | 'success' | 'failed';

interface AnalysisConfig {
  scope: AnalysisScope;
  selectedIds: string[];
  dateFrom: string;
  dateTo: string;
}

function formatDate(date: string) {
  if (!date) return '-';
  const [, month, day] = date.split('-');
  return month && day ? `${month}-${day}` : date;
}

function formatLongDate(date: string) {
  if (!date) return '未填写';
  return date.replaceAll('-', ' / ');
}

function getReviewScopeLabel(scope: AnalysisScope) {
  if (scope === 'single') return '当前选中 1 条';
  if (scope === 'multiple') return '当前选中多条';
  return analysisScopeLabels[scope];
}

function getTimeFilteredRecords(records: ContentDataRecord[], filter: TimeFilter) {
  if (filter === 'all') return records;
  const base = new Date('2026-08-24T23:59:59+08:00').getTime();
  const days = filter === '7' ? 7 : 30;
  return records.filter((record) => {
    const date = new Date(`${record.publishedAt}T23:59:59+08:00`).getTime();
    return Number.isFinite(date) && base - date <= days * 24 * 60 * 60 * 1000;
  });
}

function getMetricValue(record: ContentDataRecord, key: MetricKey) {
  return displayMetric(record.metrics[key]);
}

function createReport(
  platform: AssetPlatform,
  records: ContentDataRecord[],
  scope: AnalysisScope,
): AnalysisReport {
  const enteredCount = records.filter(hasEnteredMetrics).length;
  const platformLabel = reviewPlatformLabels[platform];
  const titles = records.map((record) => record.titleSnapshot).filter(Boolean);
  const firstTitle = titles[0] ?? '当前选中的内容';
  return {
    overview: `${platformLabel}本次分析覆盖 ${records.length} 条数据，其中 ${enteredCount} 条已录入指标。${
      scope === 'date-range' ? '分析按发布时间范围筛选，未填写发布时间的数据未纳入本次范围。' : ''
    } 当前样本更适合用来判断内容结构和场景表达的方向。`,
    strengths: [
      `${firstTitle}的主题表达比较具体，便于用户快速判断是否与自己的生活场景相关。`,
      enteredCount > 0
        ? '已录入指标的内容具备可继续观察的触达和互动信号。'
        : '当前内容虽然还没有指标，但标题和发布时间已经足够用于建立第一轮观察记录。',
    ],
    factors: [
      '内容表现可能同时受到发布时间、开头信息密度和用户当下需求的影响。',
      records.some((record) => !hasEnteredMetrics(record))
        ? '部分数据尚未录入，数值结论需要在补齐指标后再次确认。'
        : '当前样本量有限，暂时不建议把单条内容表现直接视为稳定规律。',
    ],
    suggestions: [
      '继续保留具体生活场景，减少泛化的功效式表达。',
      '为下一轮内容补充统一的观察时间点，方便比较不同主题的表现。',
      '补齐待录入数据后，再围绕标题、开头和行动建议做二次分析。',
    ],
  };
}

function createAnalysisLog(
  platform: AssetPlatform,
  config: AnalysisConfig,
  targetRecords: ContentDataRecord[],
): AnalysisLog {
  const snapshots: ContentDataSnapshot[] = targetRecords.map((record) => ({
    recordId: record.id,
    platform: record.platform,
    titleSnapshot: record.titleSnapshot,
    publishedAt: record.publishedAt,
    metrics: { ...record.metrics },
  }));
  return {
    id: `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    platform,
    scope: config.scope,
    dateFrom: config.scope === 'date-range' ? config.dateFrom : undefined,
    dateTo: config.scope === 'date-range' ? config.dateTo : undefined,
    recordIds: targetRecords.map((record) => record.id),
    dataCount: targetRecords.length,
    snapshots,
    report: createReport(platform, targetRecords, config.scope),
    createdAt: new Date().toISOString(),
    status: 'success',
  };
}

function toMarkdown(log: AnalysisLog) {
  const lines = [
    `# ${reviewPlatformLabels[log.platform]} AI 数据复盘`,
    '',
    `- 分析平台：${reviewPlatformLabels[log.platform]}`,
    `- 分析范围：${analysisScopeLabels[log.scope]}`,
    `- 数据条数：${log.dataCount}`,
    `- 分析时间：${new Date(log.createdAt).toLocaleString('zh-CN')}`,
    '',
    '## 内容表现概览',
    log.report.overview,
    '',
    '## 表现较好的内容特征',
    ...log.report.strengths.map((item) => `- ${item}`),
    '',
    '## 可能影响表现的因素',
    ...log.report.factors.map((item) => `- ${item}`),
    '',
    '## 下一步优化建议',
    ...log.report.suggestions.map((item) => `- ${item}`),
    '',
    '## 数据快照',
    ...log.snapshots.map(
      (snapshot) =>
        `- ${snapshot.titleSnapshot} · ${formatLongDate(snapshot.publishedAt)} · ${
          Object.keys(snapshot.metrics).length > 0 ? '已录入指标' : '待录入'
        }`,
    ),
  ];
  return lines.join('\n');
}

function downloadMarkdown(log: AnalysisLog) {
  const blob = new Blob([toMarkdown(log)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${reviewPlatformLabels[log.platform]}-数据复盘-${log.createdAt.slice(0, 10)}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="review-toast" role="status">
      <span className="review-toast__mark" aria-hidden="true">
        ✓
      </span>
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="关闭提示">
        ×
      </button>
    </div>
  );
}

function DataStatus({ status }: { status: ReviewRecordStatus }) {
  return (
    <span className={`review-status review-status--${status}`}>
      {reviewRecordStatusLabels[status]}
    </span>
  );
}

function DataTable({
  platform,
  records,
  selectedIds,
  onToggle,
  onOpen,
  onAnalyze,
}: {
  platform: AssetPlatform;
  records: ContentDataRecord[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onOpen: (record: ContentDataRecord) => void;
  onAnalyze: (record: ContentDataRecord) => void;
}) {
  const metrics = reviewCoreMetricKeys[platform];
  const definitions = getPlatformMetricDefinitions(platform);
  const labels = new Map(definitions.map((definition) => [definition.key, definition.label]));
  if (platform === 'xiaohongshu') {
    labels.set('views', '小眼睛数');
  }
  return (
    <div className="review-table-wrap">
      <table className="review-data-table">
        <thead>
          <tr>
            <th scope="col" className="review-table-check" />
            <th scope="col">内容标题</th>
            <th scope="col">发布时间</th>
            {metrics.map((key) => (
              <th scope="col" key={key}>
                {labels.get(key)}
              </th>
            ))}
            <th scope="col">数据状态</th>
            <th scope="col">分析操作</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? (
            records.map((record) => (
              <tr
                key={record.id}
                className="review-data-row"
                onClick={() => onOpen(record)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onOpen(record);
                }}
                tabIndex={0}
              >
                <td className="review-table-check" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`选择${record.titleSnapshot}`}
                    checked={selectedIds.includes(record.id)}
                    onChange={() => onToggle(record.id)}
                  />
                </td>
                <td>
                  <strong className="review-title-cell">{record.titleSnapshot}</strong>
                </td>
                <td>{formatDate(record.publishedAt)}</td>
                {metrics.map((key) => (
                  <td key={key} className="review-metric-cell">
                    {getMetricValue(record, key)}
                  </td>
                ))}
                <td>
                  <DataStatus status={record.status} />
                </td>
                <td onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="button button--text review-row-action"
                    onClick={() => onAnalyze(record)}
                  >
                    分析
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={metrics.length + 5}>
                <div className="review-table-empty">
                  <strong>当前暂无数据</strong>
                  <span>
                    成稿组标记为已发布后，{reviewPlatformLabels[platform]}数据会出现在这里
                  </span>
                  <a className="button button--secondary" href="#content-assets">
                    去内容资产库
                  </a>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DataDetailDrawer({
  record,
  platform,
  onClose,
  onSave,
  onAnalyze,
  onDelete,
}: {
  record: ContentDataRecord;
  platform: AssetPlatform;
  onClose: () => void;
  onSave: (
    recordId: string,
    publishedAt: string,
    metrics: Partial<Record<MetricKey, string>>,
  ) => void;
  onAnalyze: (record: ContentDataRecord) => void;
  onDelete: () => void;
}) {
  const [publishedAt, setPublishedAt] = useState(record.publishedAt);
  const [metrics, setMetrics] = useState<Partial<Record<MetricKey, string>>>({ ...record.metrics });
  const definitions = platformMetricDefinitions[platform];
  const midpoint = Math.ceil(definitions.length / 2);

  useEffect(() => {
    setPublishedAt(record.publishedAt);
    setMetrics({ ...record.metrics });
  }, [record]);

  const updateMetric = (key: MetricKey, value: string) => {
    setMetrics((current) => ({ ...current, [key]: value }));
  };

  const renderMetric = (definition: (typeof definitions)[number]) => (
    <label className="review-field" key={definition.key}>
      <span>
        {definition.label}
        {definition.unit ? <small>（{definition.unit}）</small> : null}
      </span>
      <input
        aria-label={definition.label}
        inputMode="decimal"
        value={metrics[definition.key] ?? ''}
        onChange={(event) => updateMetric(definition.key, event.target.value)}
      />
    </label>
  );

  return (
    <>
      <div className="review-drawer-backdrop" onClick={onClose} />
      <aside className="review-detail-drawer" aria-labelledby="review-detail-title">
        <div className="review-drawer-header">
          <div>
            <span className="review-section-kicker">数据详情</span>
            <h2 id="review-detail-title">{reviewPlatformLabels[platform]}平台数据</h2>
          </div>
          <button
            type="button"
            className="review-close-button"
            onClick={onClose}
            aria-label="关闭数据详情"
          >
            ×
          </button>
        </div>
        <div className="review-detail-meta">
          <span>平台：{reviewPlatformLabels[platform]}</span>
          <DataStatus status={record.status} />
          {record.platformDraftId && record.assetGroupId ? (
            <a
              className="review-linked-draft"
              href={`#content-assets?groupId=${encodeURIComponent(record.assetGroupId)}&platform=${platform}`}
            >
              查看关联平台成稿
            </a>
          ) : (
            <span>待关联平台成稿</span>
          )}
        </div>
        <div className="review-drawer-body">
          <section className="review-detail-section">
            <div className="review-detail-section-heading">
              <h3>发布信息</h3>
            </div>
            <label className="review-field">
              <span>标题</span>
              <input value={record.titleSnapshot} readOnly aria-label="标题" />
            </label>
            <label className="review-field">
              <span>发布时间</span>
              <input
                type="date"
                value={publishedAt}
                aria-label="发布时间"
                onChange={(event) => setPublishedAt(event.target.value)}
              />
            </label>
          </section>
          <section className="review-detail-section">
            <div className="review-detail-section-heading">
              <h3>平台完整数据</h3>
            </div>
            <div className="review-metric-columns">
              <div>{definitions.slice(0, midpoint).map(renderMetric)}</div>
              <div>{definitions.slice(midpoint).map(renderMetric)}</div>
            </div>
          </section>
        </div>
        <div className="review-drawer-footer">
          <div className="review-drawer-actions">
            <button type="button" className="button button--danger" onClick={onDelete}>
              删除数据
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => onAnalyze(record)}
            >
              发起 AI 分析
            </button>
          </div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => onSave(record.id, publishedAt, metrics)}
          >
            保存数据
          </button>
        </div>
      </aside>
    </>
  );
}

function AnalysisDrawer({
  platform,
  config,
  phase,
  error,
  targetRecords,
  result,
  onClose,
  onConfigChange,
  onStart,
  onRetry,
  onOpenHistory,
  onDownload,
}: {
  platform: AssetPlatform;
  config: AnalysisConfig;
  phase: AnalysisPhase;
  error: string;
  targetRecords: ContentDataRecord[];
  result: AnalysisLog | null;
  onClose: () => void;
  onConfigChange: (next: Partial<AnalysisConfig>) => void;
  onStart: () => void;
  onRetry: () => void;
  onOpenHistory: () => void;
  onDownload: () => void;
}) {
  const isProcessing = phase === 'processing';
  const scopeOptions: AnalysisScope[] = ['single', 'multiple', 'date-range', 'all'];
  const dateError =
    config.scope === 'date-range' &&
    config.dateFrom &&
    config.dateTo &&
    config.dateFrom > config.dateTo;

  return (
    <>
      <div className="review-drawer-backdrop" onClick={isProcessing ? undefined : onClose} />
      <aside className="review-analysis-drawer" aria-labelledby="review-analysis-title">
        <div className="review-drawer-header">
          <div>
            <span className="review-section-kicker">AI 数据复盘</span>
            <h2 id="review-analysis-title">分析当前平台数据</h2>
            <p>当前平台：{reviewPlatformLabels[platform]} · AI 只读取本平台数据</p>
          </div>
          <button
            type="button"
            className="review-close-button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="关闭 AI 分析"
          >
            ×
          </button>
        </div>
        <div className="review-analysis-body">
          {phase === 'idle' || phase === 'failed' ? (
            <>
              <section className="review-analysis-section">
                <div className="review-detail-section-heading">
                  <h3>分析范围</h3>
                  <span>一次只分析当前平台</span>
                </div>
                <div className="review-scope-options">
                  {scopeOptions.map((scope) => (
                    <label className="review-scope-option" key={scope}>
                      <input
                        type="radio"
                        name="analysis-scope"
                        checked={config.scope === scope}
                        onChange={() => onConfigChange({ scope })}
                      />
                      <span>{getReviewScopeLabel(scope)}</span>
                    </label>
                  ))}
                </div>
                {config.scope === 'date-range' ? (
                  <div className="review-date-range-fields">
                    <label className="review-field">
                      <span>开始日期</span>
                      <input
                        type="date"
                        value={config.dateFrom}
                        onChange={(event) => onConfigChange({ dateFrom: event.target.value })}
                      />
                    </label>
                    <label className="review-field">
                      <span>结束日期</span>
                      <input
                        type="date"
                        value={config.dateTo}
                        onChange={(event) => onConfigChange({ dateTo: event.target.value })}
                      />
                    </label>
                  </div>
                ) : null}
                {dateError ? (
                  <p className="review-inline-error">结束日期不能早于开始日期。</p>
                ) : null}
              </section>
              <section className="review-analysis-section">
                <div className="review-detail-section-heading">
                  <h3>分析对象</h3>
                  <span>{targetRecords.length} 条数据</span>
                </div>
                <div className="review-analysis-targets">
                  {targetRecords.length > 0 ? (
                    targetRecords.map((record) => (
                      <div key={record.id}>
                        <strong>{record.titleSnapshot}</strong>
                        <span>
                          {formatLongDate(record.publishedAt)} ·{' '}
                          {hasEnteredMetrics(record) ? '已录入指标' : '待录入'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>当前范围没有可分析的数据。</p>
                  )}
                </div>
              </section>
              {phase === 'failed' ? (
                <div className="review-analysis-error" role="alert">
                  <strong>分析暂时没有完成</strong>
                  <span>{error || '请稍后重新尝试，当前选择范围会保留。'}</span>
                  <button type="button" className="button button--secondary" onClick={onRetry}>
                    重新分析
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
          {phase === 'processing' ? (
            <div className="review-processing-state" role="status">
              <div className="review-processing-heading">
                <span className="review-skeleton-line review-skeleton-line--wide" />
                <strong>AI 正在分析当前平台数据</strong>
              </div>
              <div className="review-progress-track">
                <span />
              </div>
              <div className="review-processing-steps">
                <span>正在读取数据快照……</span>
                <span>正在识别内容表现……</span>
                <span>正在整理优化建议……</span>
              </div>
            </div>
          ) : null}
          {phase === 'success' && result ? (
            <div className="review-analysis-result">
              <div className="review-result-banner">
                <span className="review-result-check">✓</span>
                <div>
                  <strong>分析已完成</strong>
                  <span>
                    {reviewPlatformLabels[result.platform]} · {analysisScopeLabels[result.scope]} ·{' '}
                    {result.dataCount} 条数据
                  </span>
                </div>
              </div>
              <ReportContent report={result.report} />
              <div className="review-report-meta">
                <span>分析平台：{reviewPlatformLabels[result.platform]}</span>
                <span>分析范围：{analysisScopeLabels[result.scope]}</span>
                <span>分析时间：{new Date(result.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <div className="review-analysis-result-actions">
                <button type="button" className="button button--secondary" onClick={onDownload}>
                  下载 Markdown
                </button>
                <button type="button" className="button button--text" onClick={onOpenHistory}>
                  查看分析记录
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {phase !== 'success' ? (
          <div className="review-drawer-footer">
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
              disabled={isProcessing}
            >
              取消
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={onStart}
              disabled={isProcessing || targetRecords.length === 0 || Boolean(dateError)}
            >
              {isProcessing ? '分析中…' : phase === 'failed' ? '重新分析' : '开始分析'}
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}

function ReportContent({ report }: { report: AnalysisReport }) {
  return (
    <div className="review-report-content">
      <section>
        <h3>内容表现概览</h3>
        <p>{report.overview}</p>
      </section>
      <section>
        <h3>表现较好的内容特征</h3>
        <ul>
          {report.strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>可能影响表现的因素</h3>
        <ul>
          {report.factors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>下一步优化建议</h3>
        <ul>
          {report.suggestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AnalysisHistoryDialog({
  logs,
  platform,
  onClose,
  onDownload,
  onView,
}: {
  logs: AnalysisLog[];
  platform: AssetPlatform;
  onClose: () => void;
  onDownload: (log: AnalysisLog) => void;
  onView: (log: AnalysisLog) => void;
}) {
  return (
    <div className="review-modal-layer">
      <div className="review-modal-backdrop" onClick={onClose} />
      <section
        className="review-history-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-history-title"
      >
        <div className="review-modal-header">
          <div>
            <span className="review-section-kicker">分析记录</span>
            <h2 id="review-history-title">{reviewPlatformLabels[platform]}分析记录</h2>
            <p>记录保存了每次分析使用的数据快照，不受原始数据删除影响。</p>
          </div>
          <button
            type="button"
            className="review-close-button"
            onClick={onClose}
            aria-label="关闭分析记录"
          >
            ×
          </button>
        </div>
        <div className="review-history-list">
          {logs.length > 0 ? (
            logs.map((log) => (
              <article className="review-history-row" key={log.id}>
                <div>
                  <strong>{new Date(log.createdAt).toLocaleString('zh-CN')}</strong>
                  <span>
                    {analysisScopeLabels[log.scope]} · {log.dataCount} 条数据 ·{' '}
                    {reviewPlatformLabels[log.platform]}
                  </span>
                </div>
                <div className="review-history-actions">
                  <button type="button" className="button button--text" onClick={() => onView(log)}>
                    查看
                  </button>
                  <button
                    type="button"
                    className="button button--text"
                    onClick={() => onDownload(log)}
                  >
                    下载 Markdown
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="review-history-empty">当前平台还没有分析记录。</div>
          )}
        </div>
      </section>
    </div>
  );
}

function ReportViewDialog({
  log,
  onClose,
  onDownload,
}: {
  log: AnalysisLog;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="review-modal-layer">
      <div className="review-modal-backdrop" onClick={onClose} />
      <section
        className="review-report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-report-title"
      >
        <div className="review-modal-header">
          <div>
            <span className="review-section-kicker">分析记录快照</span>
            <h2 id="review-report-title">{reviewPlatformLabels[log.platform]}数据复盘</h2>
            <p>
              {analysisScopeLabels[log.scope]} · {log.dataCount} 条数据 ·{' '}
              {new Date(log.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
          <button
            type="button"
            className="review-close-button"
            onClick={onClose}
            aria-label="关闭分析报告"
          >
            ×
          </button>
        </div>
        <div className="review-report-dialog-body">
          <ReportContent report={log.report} />
          <div className="review-snapshot-list">
            <strong>本次使用的数据快照</strong>
            {log.snapshots.map((snapshot) => (
              <span key={snapshot.recordId}>
                {snapshot.titleSnapshot} · {formatLongDate(snapshot.publishedAt)}
              </span>
            ))}
          </div>
        </div>
        <div className="review-modal-footer">
          <button type="button" className="button button--secondary" onClick={onClose}>
            关闭
          </button>
          <button type="button" className="button button--primary" onClick={onDownload}>
            下载 Markdown
          </button>
        </div>
      </section>
    </div>
  );
}

function DeleteConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="review-modal-layer">
      <div className="review-modal-backdrop" onClick={onCancel} />
      <section
        className="review-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-delete-title"
      >
        <div className="review-modal-header">
          <div>
            <span className="review-section-kicker">删除平台数据</span>
            <h2 id="review-delete-title">数据删除后不可恢复，是否删除？</h2>
            <p>只会移除当前平台这条数据记录，分析记录仍会保留。</p>
          </div>
          <button
            type="button"
            className="review-close-button"
            onClick={onCancel}
            aria-label="关闭删除确认"
          >
            ×
          </button>
        </div>
        <div className="review-modal-footer">
          <button type="button" className="button button--secondary" onClick={onCancel}>
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

export function ContentReviewPage() {
  const [records, setRecords] = useState<ContentDataRecord[]>(() =>
    syncPublishedAssetGroups(loadContentReviewRecords()),
  );
  const [logs, setLogs] = useState<AnalysisLog[]>(loadAnalysisLogs);
  const [platform, setPlatform] = useState<AssetPlatform>('xiaohongshu');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState('');
  const [deleteId, setDeleteId] = useState('');
  const [toast, setToast] = useState('');
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('idle');
  const [analysisError, setAnalysisError] = useState('');
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    scope: 'single',
    selectedIds: [],
    dateFrom: '2026-08-01',
    dateTo: '2026-08-31',
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisLog | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewedLog, setViewedLog] = useState<AnalysisLog | null>(null);
  const timersRef = useRef<number[]>([]);

  const detailRecord = records.find((record) => record.id === detailId);
  const deleteRecord = records.find((record) => record.id === deleteId);
  const platformRecords = useMemo(
    () => records.filter((record) => record.platform === platform),
    [records, platform],
  );
  const visibleRecords = useMemo(
    () => getTimeFilteredRecords(platformRecords, timeFilter),
    [platformRecords, timeFilter],
  );
  const platformLogs = useMemo(
    () => logs.filter((log) => log.platform === platform),
    [logs, platform],
  );
  const analysisTargets = useMemo(() => {
    if (!analysisOpen) return [];
    if (analysisConfig.scope === 'all') return platformRecords;
    if (analysisConfig.scope === 'date-range') {
      return platformRecords.filter((record) => {
        if (!record.publishedAt) return false;
        if (analysisConfig.dateFrom && record.publishedAt < analysisConfig.dateFrom) return false;
        if (analysisConfig.dateTo && record.publishedAt > analysisConfig.dateTo) return false;
        return true;
      });
    }
    return platformRecords.filter((record) => analysisConfig.selectedIds.includes(record.id));
  }, [analysisConfig, analysisOpen, platformRecords]);

  const later = (callback: () => void, delay = 1200) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  };

  useEffect(() => () => timersRef.current.forEach((timer) => window.clearTimeout(timer)), []);

  const showToast = (message: string) => {
    setToast(message);
    later(() => setToast(''), 2200);
  };

  const setAndSaveRecords = (updater: (current: ContentDataRecord[]) => ContentDataRecord[]) => {
    setRecords((current) => {
      const next = updater(current);
      saveContentReviewRecords(next);
      return next;
    });
  };

  const openAnalysis = (scope: AnalysisScope, ids: string[] = selectedIds) => {
    if (platformRecords.length === 0) return;
    const nextIds = ids.length > 0 ? ids : platformRecords.slice(0, 1).map((record) => record.id);
    setAnalysisConfig({
      scope,
      selectedIds: nextIds,
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
    });
    setAnalysisResult(null);
    setAnalysisError('');
    setAnalysisPhase('idle');
    setAnalysisOpen(true);
  };

  const runAnalysis = () => {
    if (analysisTargets.length === 0 || analysisPhase === 'processing') return;
    if (
      analysisConfig.scope === 'date-range' &&
      analysisConfig.dateFrom &&
      analysisConfig.dateTo &&
      analysisConfig.dateFrom > analysisConfig.dateTo
    ) {
      return;
    }
    setAnalysisPhase('processing');
    setAnalysisError('');
    later(() => {
      const query = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
      if (query.get('demoError') === 'analysis') {
        setAnalysisPhase('failed');
        setAnalysisError('AI 暂时无法完成本次分析，请重新尝试。');
        return;
      }
      const log = createAnalysisLog(platform, analysisConfig, analysisTargets);
      setAnalysisResult(log);
      setAnalysisPhase('success');
      setAndSaveRecords((current) =>
        current.map((record) =>
          analysisTargets.some((target) => target.id === record.id)
            ? { ...record, status: 'analyzed' }
            : record,
        ),
      );
      setLogs((current) => {
        const next = [log, ...current];
        saveAnalysisLogs(next);
        return next;
      });
    });
  };

  const handleSaveRecord = (
    recordId: string,
    publishedAt: string,
    metrics: Partial<Record<MetricKey, string>>,
  ) => {
    const nextStatus: ReviewRecordStatus = Object.values(metrics).some(
      (value) => value !== undefined && value !== '' && value !== '-',
    )
      ? 'entered'
      : 'pending';
    setAndSaveRecords((current) =>
      current.map((record) =>
        record.id === recordId ? { ...record, publishedAt, metrics, status: nextStatus } : record,
      ),
    );
    setDetailId('');
    showToast('平台数据已保存');
  };

  const confirmDelete = () => {
    if (!deleteRecord) return;
    const nextRecords = deleteContentReviewRecord(deleteRecord.id, records);
    setRecords(nextRecords);
    setDeleteId('');
    setDetailId('');
    setSelectedIds((current) => current.filter((id) => id !== deleteRecord.id));
    showToast('平台数据已删除，分析记录仍然保留');
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    const ids = visibleRecords.map((record) => record.id);
    setSelectedIds((current) =>
      ids.length > 0 && ids.every((id) => current.includes(id)) ? [] : ids,
    );
  };

  const handlePlatformChange = (nextPlatform: AssetPlatform) => {
    setPlatform(nextPlatform);
    setSelectedIds([]);
    setDetailId('');
    setAnalysisOpen(false);
  };

  const updateAnalysisConfig = (next: Partial<AnalysisConfig>) => {
    setAnalysisConfig((current) => ({ ...current, ...next }));
    if (next.scope === 'single' && analysisConfig.selectedIds.length === 0 && platformRecords[0]) {
      setAnalysisConfig((current) => ({ ...current, selectedIds: [platformRecords[0].id] }));
    }
  };

  const downloadCurrentResult = () => {
    if (!analysisResult) return;
    downloadMarkdown(analysisResult);
    showToast('分析报告已下载为 Markdown');
  };

  const openHistory = () => {
    setHistoryOpen(true);
  };

  return (
    <div className="app-shell app-shell--content-review">
      <ProductSidebar activeModule="content-review" />
      <main className="app-main content-review-main" id="content-review">
        <header className="topbar">
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>
        <div className="page-content content-review-content">
          <div className="review-platform-tabs" role="tablist" aria-label="数据平台">
            {reviewPlatformOrder.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={platform === item}
                className={platform === item ? 'is-active' : ''}
                key={item}
                onClick={() => handlePlatformChange(item)}
              >
                {reviewPlatformLabels[item]}
              </button>
            ))}
          </div>
          <section className="review-stat-strip" aria-label="平台数据统计">
            <div>
              <span>已发布数据</span>
              <strong>{platformRecords.length}</strong>
            </div>
            <div>
              <span>待录入数据</span>
              <strong>
                {platformRecords.filter((record) => record.status === 'pending').length}
              </strong>
            </div>
            <div>
              <span>分析记录</span>
              <strong>{platformLogs.length}</strong>
            </div>
          </section>
          <section className="review-workbench-panel">
            <div className="review-workbench-toolbar">
              <div className="review-toolbar-selection">
                <label>
                  <input
                    type="checkbox"
                    aria-label="选择当前列表全部数据"
                    checked={
                      visibleRecords.length > 0 &&
                      visibleRecords.every((record) => selectedIds.includes(record.id))
                    }
                    onChange={toggleAll}
                  />
                  <span>选择数据</span>
                </label>
                {selectedIds.length > 0 ? (
                  <span className="review-selected-count">已选 {selectedIds.length} 条</span>
                ) : null}
              </div>
              <div className="review-toolbar-actions">
                <label className="review-time-filter review-time-filter--inline">
                  <span>时间范围</span>
                  <select
                    value={timeFilter}
                    onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
                  >
                    <option value="all">全部时间</option>
                    <option value="7">近 7 天</option>
                    <option value="30">近 30 天</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="button button--secondary"
                  disabled={selectedIds.length === 0 || platformRecords.length === 0}
                  onClick={() => openAnalysis(selectedIds.length === 1 ? 'single' : 'multiple')}
                >
                  分析所选
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  disabled={platformRecords.length === 0}
                  onClick={() =>
                    openAnalysis(
                      'all',
                      platformRecords.map((record) => record.id),
                    )
                  }
                >
                  平台全部分析
                </button>
                <button
                  type="button"
                  className="button button--text review-history-trigger"
                  onClick={openHistory}
                  disabled={platformLogs.length === 0}
                >
                  分析记录 <small>{platformLogs.length}</small>
                </button>
              </div>
            </div>
            <div className="review-list-heading">
              <h2>{reviewPlatformLabels[platform]}数据</h2>
              <span>{visibleRecords.length} 条记录</span>
            </div>
            <DataTable
              platform={platform}
              records={visibleRecords}
              selectedIds={selectedIds}
              onToggle={toggleSelected}
              onOpen={(record) => setDetailId(record.id)}
              onAnalyze={(record) => openAnalysis('single', [record.id])}
            />
          </section>
        </div>
      </main>
      {detailRecord ? (
        <DataDetailDrawer
          record={detailRecord}
          platform={platform}
          onClose={() => setDetailId('')}
          onSave={handleSaveRecord}
          onAnalyze={(record) => {
            setDetailId('');
            openAnalysis('single', [record.id]);
          }}
          onDelete={() => setDeleteId(detailRecord.id)}
        />
      ) : null}
      {analysisOpen ? (
        <AnalysisDrawer
          platform={platform}
          config={analysisConfig}
          phase={analysisPhase}
          error={analysisError}
          targetRecords={analysisTargets}
          result={analysisResult}
          onClose={() => setAnalysisOpen(false)}
          onConfigChange={updateAnalysisConfig}
          onStart={runAnalysis}
          onRetry={() => {
            setAnalysisPhase('idle');
            setAnalysisError('');
          }}
          onOpenHistory={openHistory}
          onDownload={downloadCurrentResult}
        />
      ) : null}
      {historyOpen ? (
        <AnalysisHistoryDialog
          logs={platformLogs}
          platform={platform}
          onClose={() => setHistoryOpen(false)}
          onDownload={(log) => {
            downloadMarkdown(log);
            showToast('分析报告已下载为 Markdown');
          }}
          onView={(log) => setViewedLog(log)}
        />
      ) : null}
      {viewedLog ? (
        <ReportViewDialog
          log={viewedLog}
          onClose={() => setViewedLog(null)}
          onDownload={() => {
            downloadMarkdown(viewedLog);
            showToast('分析报告已下载为 Markdown');
          }}
        />
      ) : null}
      {deleteRecord ? (
        <DeleteConfirmDialog onCancel={() => setDeleteId('')} onConfirm={confirmDelete} />
      ) : null}
      {toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}
    </div>
  );
}
