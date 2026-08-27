import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductSidebar } from './components/ProductSidebar';
import { createTopicId, loadTopicItems, saveTopicItems } from './topicPoolStorage';
import type { TopicItem } from './topicPoolTypes';
import {
  viralAnalysisExtractedText,
  viralAnalysisMockRecords,
  viralAnalysisReport,
  type ViralAnalysisPlatform,
  type ViralAnalysisRecord,
  type ViralAnalysisStatus,
} from './viralAnalysisMockData';

type ActiveTab = 'script' | 'report';
type ProcessingStage = 'extracting' | 'analyzing';

interface ProcessingState {
  stage: ProcessingStage;
  step: number;
  recordId: string;
  failExtraction: boolean;
  failReport: boolean;
}

const DEMO_TODAY = '2026-08-25';
const extractionSteps = ['正在识别内容链接……', '正在提取原始内容……', '正在转换为文字版……'];
const analysisSteps = [
  '正在拆解内容结构……',
  '正在识别爆款开头……',
  '正在分析表达节奏……',
  '正在生成拆解报告……',
];

function isValidContentLink(value: string) {
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(value.trim());
}

function getPlatformFromUrl(value: string): ViralAnalysisPlatform {
  const normalized = value.toLowerCase();
  if (normalized.includes('xiaohongshu') || normalized.includes('xhslink')) {
    return '小红书';
  }
  if (normalized.includes('douyin') || normalized.includes('iesdouyin')) {
    return '抖音';
  }
  if (normalized.includes('channels')) {
    return '视频号';
  }
  return '公众号';
}

function getDraftTitle(platform: ViralAnalysisPlatform) {
  if (platform === '小红书') return '春季轻养护内容怎么做才容易被收藏';
  if (platform === '抖音') return '久坐人群健康管理爆款视频';
  if (platform === '视频号') return '晚餐后的轻松调整，为什么更容易坚持';
  return '忙碌生活里的轻养护提醒';
}

function getStatusLabel(status: ViralAnalysisStatus) {
  if (status === 'completed') return '已完成';
  if (status === 'extracting' || status === 'analyzing') return '分析中';
  if (status === 'extractionFailed') return '提取失败';
  if (status === 'reportFailed') return '报告生成失败';
  return '未开始';
}

function getStatusClass(status: ViralAnalysisStatus) {
  if (status === 'completed') return 'is-completed';
  if (status === 'extractionFailed' || status === 'reportFailed') return 'is-failed';
  if (status === 'extracting' || status === 'analyzing') return 'is-processing';
  return '';
}

function shouldFailExtraction(sourceUrl: string) {
  return /blocked|cannot-read|unavailable/i.test(sourceUrl);
}

function shouldFailReport(sourceUrl: string) {
  return /report-fail|report-failed/i.test(sourceUrl);
}

function updateRecord(
  records: ViralAnalysisRecord[],
  recordId: string,
  updater: (record: ViralAnalysisRecord) => ViralAnalysisRecord,
) {
  return records.map((record) => (record.id === recordId ? updater(record) : record));
}

function createDraftRecord(id: string, sourceUrl: string): ViralAnalysisRecord {
  const sourcePlatform = getPlatformFromUrl(sourceUrl);
  return {
    id,
    sourceUrl,
    sourcePlatform,
    title: getDraftTitle(sourcePlatform),
    analyzedAt: DEMO_TODAY,
    status: 'extracting',
    extractedText: '',
    analysisReport: null,
    recommendedTopic: '春季身体状态变化的 3 个常见信号',
    recommendedAngle: '从真实生活场景切入，减少泛泛的专业表达',
    suggestedFormat: '图文内容 / 视频脚本',
    usedForReplication: false,
  };
}

function formatRecordDate(date: string) {
  return date;
}

function ProcessingPanel({ processing }: { processing: ProcessingState }) {
  const steps = processing.stage === 'extracting' ? extractionSteps : analysisSteps;
  const currentLabel = steps[processing.step] ?? steps[0];
  const progress = `${Math.round(((processing.step + 1) / steps.length) * 100)}%`;
  const progressRatio = (processing.step + 1) / steps.length;

  return (
    <section className="viral-processing" role="status" aria-live="polite">
      <div className="viral-processing__heading">
        <div>
          <span className="viral-processing__label">
            {processing.stage === 'extracting' ? '阶段一 · 提取文字版' : '阶段二 · 生成拆解报告'}
          </span>
          <h2>{processing.stage === 'extracting' ? '正在提取内容' : '正在生成分析报告'}</h2>
        </div>
        <strong>{progress}</strong>
      </div>
      <div className="viral-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progressRatio})` }} />
      </div>
      {processing.stage === 'analyzing' ? (
        <div className="viral-processing__complete-note">文字版内容已完成</div>
      ) : null}
      <div className="viral-processing__current">{currentLabel}</div>
      <div className="viral-processing__steps">
        {steps.map((step, index) => (
          <div className={index <= processing.step ? 'is-active' : ''} key={step}>
            <span aria-hidden="true">{index < processing.step ? '✓' : index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FailurePanel({
  record,
  onRetryExtraction,
  onRetryReport,
}: {
  record: ViralAnalysisRecord;
  onRetryExtraction: () => void;
  onRetryReport: () => void;
}) {
  if (record.status === 'extractionFailed') {
    return (
      <section className="viral-failure-panel" role="alert">
        <div className="viral-failure-panel__mark" aria-hidden="true">
          !
        </div>
        <div>
          <h2>暂时无法提取这条内容</h2>
          <p>可能原因：</p>
          <ul>
            <li>链接无法访问</li>
            <li>内容平台限制读取</li>
            <li>链接格式不正确</li>
          </ul>
          <button type="button" className="button button--primary" onClick={onRetryExtraction}>
            重新尝试
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="viral-failure-panel" role="alert">
      <div className="viral-failure-panel__mark" aria-hidden="true">
        !
      </div>
      <div>
        <h2>文字版内容已经提取完成，但拆解报告生成失败。</h2>
        <p>文字版脚本已经保留，可以重新生成拆解报告。</p>
        <button type="button" className="button button--primary" onClick={onRetryReport}>
          重新生成拆解报告
        </button>
      </div>
    </section>
  );
}

export function ViralAnalysisPage() {
  const [records, setRecords] = useState<ViralAnalysisRecord[]>(() =>
    viralAnalysisMockRecords.map((record) => ({ ...record })),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('report');
  const [sourceUrl, setSourceUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const timersRef = useRef<number[]>([]);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? null,
    [records, selectedId],
  );

  useEffect(() => {
    return () => timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!processing) return undefined;
    const steps = processing.stage === 'extracting' ? extractionSteps : analysisSteps;
    const timer = window.setTimeout(() => {
      if (processing.step < steps.length - 1) {
        setProcessing((current) => (current ? { ...current, step: current.step + 1 } : current));
        return;
      }

      if (processing.stage === 'extracting') {
        setRecords((current) =>
          updateRecord(current, processing.recordId, (record) => ({
            ...record,
            status: processing.failExtraction ? 'extractionFailed' : 'analyzing',
            extractedText: processing.failExtraction ? '' : viralAnalysisExtractedText,
          })),
        );
        if (processing.failExtraction) {
          setProcessing(null);
          setActiveTab('script');
          return;
        }
        setProcessing({ ...processing, stage: 'analyzing', step: 0 });
        return;
      }

      setRecords((current) =>
        updateRecord(current, processing.recordId, (record) => ({
          ...record,
          status: processing.failReport ? 'reportFailed' : 'completed',
          analysisReport: processing.failReport ? null : viralAnalysisReport,
          extractedText: record.extractedText || viralAnalysisExtractedText,
        })),
      );
      setProcessing(null);
      setActiveTab(processing.failReport ? 'script' : 'report');
    }, 640);
    timersRef.current.push(timer);
    return () => window.clearTimeout(timer);
  }, [processing]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 1900);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function startAnalysis(url = sourceUrl, existingId?: string) {
    if (processing) return;
    const normalizedUrl = url.trim();
    if (!isValidContentLink(normalizedUrl)) {
      setLinkError('请输入有效的爆款内容链接');
      return;
    }

    const recordId = existingId ?? `viral-analysis-${Date.now()}`;
    const failExtraction = shouldFailExtraction(normalizedUrl);
    const failReport = shouldFailReport(normalizedUrl);
    setSourceUrl(normalizedUrl);
    setLinkError('');
    setSelectedId(recordId);
    setActiveTab('script');
    setRecords((current) => {
      const existing = current.find((record) => record.id === recordId);
      if (existing) {
        return updateRecord(current, recordId, (record) => ({
          ...record,
          sourceUrl: normalizedUrl,
          sourcePlatform: getPlatformFromUrl(normalizedUrl),
          status: 'extracting',
        }));
      }
      return [createDraftRecord(recordId, normalizedUrl), ...current];
    });
    setProcessing({
      stage: 'extracting',
      step: 0,
      recordId,
      failExtraction,
      failReport,
    });
  }

  function handleSelectRecord(record: ViralAnalysisRecord) {
    if (processing) return;
    setSelectedId(record.id);
    setSourceUrl(record.sourceUrl);
    setLinkError('');
    setCopied(false);
    setActiveTab(record.analysisReport ? 'report' : 'script');
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setToast('复制失败，请手动选择文字。');
    }
  }

  function handleAddToTopicPool(record: ViralAnalysisRecord) {
    if (!record.analysisReport) return;
    if (record.topicId) {
      setToast('该爆款已经加入选题池');
      return;
    }

    const currentTopics = loadTopicItems();
    const existingTopic = currentTopics.find(
      (topic) =>
        topic.type === 'viral' &&
        topic.title === record.recommendedTopic &&
        topic.reference.includes(record.sourceUrl),
    );
    const topic: TopicItem = existingTopic ?? {
      id: createTopicId(),
      title: record.recommendedTopic,
      type: 'viral',
      detail: '来自爆款拆解报告的推荐复刻方向。',
      reference: `爆款分析：${record.sourceUrl}`,
      status: 'active',
      schedules: [],
      contentStatus: 'not-started',
    };
    if (!existingTopic) {
      saveTopicItems([...currentTopics, topic]);
    }
    setRecords((current) =>
      updateRecord(current, record.id, (currentRecord) => ({
        ...currentRecord,
        topicId: topic.id,
      })),
    );
    setToast('已加入选题池');
  }

  function handleViewTopic(record: ViralAnalysisRecord) {
    if (!record.topicId) return;
    window.location.hash = `#topic-pool?focus=pool&topicId=${encodeURIComponent(record.topicId)}`;
  }

  function handleReplicate(record: ViralAnalysisRecord) {
    if (!record.analysisReport) return;
    setRecords((current) =>
      updateRecord(current, record.id, (currentRecord) => ({
        ...currentRecord,
        usedForReplication: true,
      })),
    );
    const params = new URLSearchParams({
      mode: 'replicate',
      analysisId: record.id,
      sourceUrl: record.sourceUrl,
      title: record.title,
      detail: record.recommendedAngle,
      reference: `爆款分析：${record.title}`,
      type: 'viral',
    });
    window.location.hash = `#content-creation?${params.toString()}`;
  }

  function handleRetryReport(record: ViralAnalysisRecord) {
    if (!record.extractedText || processing) return;
    setSelectedId(record.id);
    setActiveTab('script');
    setProcessing({
      stage: 'analyzing',
      step: 0,
      recordId: record.id,
      failExtraction: false,
      failReport: shouldFailReport(record.sourceUrl),
    });
    setRecords((current) =>
      updateRecord(current, record.id, (currentRecord) => ({
        ...currentRecord,
        status: 'analyzing',
      })),
    );
  }

  function renderReport(record: ViralAnalysisRecord) {
    if (!record.analysisReport) {
      return (
        <FailurePanel
          record={record}
          onRetryExtraction={() => startAnalysis(record.sourceUrl, record.id)}
          onRetryReport={() => handleRetryReport(record)}
        />
      );
    }

    return (
      <div className="viral-report-scroll">
        {record.analysisReport.map((section) => (
          <article className="viral-report-section" key={section.id}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
        <section className="viral-recommendation-card" aria-labelledby="viral-recommendation-title">
          <div className="viral-recommendation-card__header">
            <div>
              <span>推荐复刻方向</span>
              <h2 id="viral-recommendation-title">把结构换成自己的内容</h2>
            </div>
            <span className="viral-recommendation-card__mark" aria-hidden="true">
              ↗
            </span>
          </div>
          <dl>
            <div>
              <dt>推荐复刻选题</dt>
              <dd>{record.recommendedTopic}</dd>
            </div>
            <div>
              <dt>推荐切入角度</dt>
              <dd>{record.recommendedAngle}</dd>
            </div>
            <div>
              <dt>建议内容形式</dt>
              <dd>{record.suggestedFormat}</dd>
            </div>
          </dl>
        </section>
      </div>
    );
  }

  function renderScript(record: ViralAnalysisRecord) {
    if (record.status === 'extractionFailed') {
      return (
        <FailurePanel
          record={record}
          onRetryExtraction={() => startAnalysis(record.sourceUrl, record.id)}
          onRetryReport={() => handleRetryReport(record)}
        />
      );
    }

    return (
      <div className="viral-script-scroll">
        {record.status === 'reportFailed' ? (
          <div className="viral-report-failed-note">
            <strong>文字版内容已经提取完成</strong>
            <span>拆解报告生成失败，但文字版脚本已保留。</span>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => handleRetryReport(record)}
            >
              重新生成拆解报告
            </button>
          </div>
        ) : null}
        <div className="viral-script-meta">
          <div>
            <span>标题</span>
            <strong>{record.title}</strong>
          </div>
          <div>
            <span>来源平台</span>
            <strong>{record.sourcePlatform}</strong>
          </div>
          <div>
            <span>原始链接</span>
            <a href={record.sourceUrl} target="_blank" rel="noreferrer">
              {record.sourceUrl}
            </a>
          </div>
        </div>
        <div className="viral-script-content">
          <h2>文字版内容</h2>
          <div>{record.extractedText}</div>
        </div>
      </div>
    );
  }

  function renderEmptyState() {
    return (
      <section className="viral-empty-detail" aria-labelledby="viral-empty-title">
        <div className="viral-empty-detail__intro">
          <span className="viral-empty-detail__mark" aria-hidden="true">
            ↗
          </span>
          <div>
            <h1 id="viral-empty-title">爆款分析</h1>
            <p>把一个爆款内容拆解清楚，找到可以复刻的内容方向。</p>
          </div>
        </div>
        <form
          className="viral-start-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            startAnalysis();
          }}
        >
          <label htmlFor="viral-source-url">粘贴爆款内容链接</label>
          <div className="viral-start-form__input-row">
            <input
              id="viral-source-url"
              type="url"
              value={sourceUrl}
              onChange={(event) => {
                setSourceUrl(event.target.value);
                setLinkError('');
              }}
              placeholder="https://"
              aria-invalid={Boolean(linkError)}
            />
            <button type="submit" className="button button--primary" disabled={Boolean(processing)}>
              开始分析
            </button>
          </div>
          {linkError ? <span className="viral-inline-error">{linkError}</span> : null}
          <p>支持抖音、小红书、视频号、公众号等内容链接</p>
        </form>
      </section>
    );
  }

  function renderDetail() {
    if (processing) {
      return <ProcessingPanel processing={processing} />;
    }
    if (!selectedRecord) {
      return renderEmptyState();
    }

    return (
      <section className="viral-detail-view" aria-labelledby="viral-detail-title">
        <header className="viral-detail-header">
          <div className="viral-detail-header__copy">
            <span className="viral-detail-platform">{selectedRecord.sourcePlatform}</span>
            <h1 id="viral-detail-title">{selectedRecord.title}</h1>
            <p>
              {selectedRecord.sourcePlatform} · 分析于 {formatRecordDate(selectedRecord.analyzedAt)}
            </p>
            <a href={selectedRecord.sourceUrl} target="_blank" rel="noreferrer">
              {selectedRecord.sourceUrl}
            </a>
          </div>
          <div className="viral-detail-actions">
            {selectedRecord.topicId ? (
              <>
                <button type="button" className="button button--secondary" disabled>
                  已加入选题池
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => handleViewTopic(selectedRecord)}
                >
                  查看选题
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button button--primary"
                disabled={!selectedRecord.analysisReport}
                onClick={() => handleAddToTopicPool(selectedRecord)}
              >
                加入选题池
              </button>
            )}
            <button
              type="button"
              className="button button--secondary"
              disabled={!selectedRecord.analysisReport}
              onClick={() => handleReplicate(selectedRecord)}
            >
              去做爆款复刻
            </button>
          </div>
        </header>
        <div className="viral-detail-tabs" role="tablist" aria-label="分析详情类型">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'script'}
            className={activeTab === 'script' ? 'is-active' : ''}
            onClick={() => setActiveTab('script')}
          >
            文字版脚本
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'report'}
            className={activeTab === 'report' ? 'is-active' : ''}
            onClick={() => setActiveTab('report')}
            disabled={!selectedRecord.analysisReport && selectedRecord.status !== 'reportFailed'}
          >
            拆解报告
          </button>
          <span>当前显示：{activeTab === 'script' ? '文字版脚本' : '拆解报告'}</span>
          {activeTab === 'script' ? (
            <button
              type="button"
              className="button button--secondary viral-copy-button"
              onClick={() => handleCopy(selectedRecord.extractedText)}
              disabled={!selectedRecord.extractedText}
            >
              {copied ? '已复制' : '复制文字'}
            </button>
          ) : null}
        </div>
        <div className="viral-detail-body">
          {activeTab === 'script' ? renderScript(selectedRecord) : renderReport(selectedRecord)}
        </div>
      </section>
    );
  }

  return (
    <div className="app-shell app-shell--viral-analysis">
      <ProductSidebar activeModule="viral-analysis" />
      <main className="app-main viral-analysis-main" id="viral-analysis">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>洞察中心</span>
            <span aria-hidden="true">/</span>
            <strong>爆款分析</strong>
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>
        <div className="viral-analysis-workspace">
          <aside className="viral-records-panel" aria-labelledby="viral-records-title">
            <div className="viral-records-panel__header">
              <div>
                <h2 id="viral-records-title">分析记录</h2>
                <p>最近分析</p>
              </div>
            </div>
            <div className="viral-records-list">
              {records.map((record) => (
                <button
                  type="button"
                  className={`viral-record-card${selectedId === record.id ? ' is-selected' : ''}`}
                  key={record.id}
                  onClick={() => handleSelectRecord(record)}
                  disabled={Boolean(processing)}
                  aria-pressed={selectedId === record.id}
                >
                  <strong>{record.title}</strong>
                  <span>{record.sourcePlatform}</span>
                  <span>{formatRecordDate(record.analyzedAt)}</span>
                  <div className="viral-record-card__status">
                    <span className={`viral-status ${getStatusClass(record.status)}`}>
                      {getStatusLabel(record.status)}
                    </span>
                    {record.topicId ? <span>已加入选题池</span> : null}
                    {record.usedForReplication ? <span>已用于爆款复刻</span> : null}
                  </div>
                </button>
              ))}
            </div>
          </aside>
          <section className="viral-detail-panel">{renderDetail()}</section>
        </div>
        {toast ? (
          <div className="viral-toast" role="status">
            {toast}
          </div>
        ) : null}
      </main>
    </div>
  );
}
