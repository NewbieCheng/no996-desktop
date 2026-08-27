import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { initialBrainDocuments } from './enterpriseBrainMockData';
import { ProductSidebar } from './components/ProductSidebar';
import {
  emptyProductBaseInfo,
  productLibraryMockRecords,
  productOptionalFieldDefinitions,
} from './productLibraryMockData';
import type {
  ProductAnalysisResult,
  ProductBaseInfo,
  ProductDetailTab,
  ProductRecord,
  ProductStatus,
} from './productLibraryTypes';

type ProductView = 'list' | 'entry-choice' | 'manual' | 'ai' | 'confirm' | 'processing' | 'detail';
type ProductProcessingKind = 'intake' | 'analysis';

interface ProductDraft {
  id: string;
  base: ProductBaseInfo;
  sourceDocumentIds: string[];
}

interface ProductProcessing {
  kind: ProductProcessingKind;
  step: number;
  recordId: string;
  draft: ProductDraft;
}

const TODAY = '2026-08-25';
const intakeSteps = [
  '正在读取你提供的产品资料……',
  '正在识别产品名称和类型……',
  '正在整理规格、价格、产地和工艺……',
];
const analysisSteps = [
  '已整理产品基础信息',
  '已读取相关产品资料',
  '正在补全产品理解',
  '正在分析受众与使用场景',
  '正在提炼产品卖点',
  '正在整理适用边界',
];

const requiredBaseFields: Array<{ key: keyof ProductBaseInfo; label: string }> = [
  { key: 'name', label: '产品名称' },
  { key: 'type', label: '产品类型' },
  { key: 'specPrice', label: '规格 / 价格' },
  { key: 'origin', label: '产地' },
  { key: 'craft', label: '工艺' },
];

const baseInfoFields: Array<{ key: keyof ProductBaseInfo; label: string }> = [
  ...requiredBaseFields,
  ...productOptionalFieldDefinitions.map(({ key, label }) => ({ key, label })),
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function cloneBase(base: ProductBaseInfo): ProductBaseInfo {
  return { ...base };
}

function createEmptyDraft(): ProductDraft {
  return { id: '', base: cloneBase(emptyProductBaseInfo), sourceDocumentIds: [] };
}

function createDraftFromProduct(product: ProductRecord): ProductDraft {
  return {
    id: product.id,
    base: cloneBase(product.base),
    sourceDocumentIds: [...product.sourceDocumentIds],
  };
}

function statusLabel(status: ProductStatus) {
  if (status === 'pending-entry') return '待录入';
  if (status === 'pending-confirmation') return '待人工确认';
  if (status === 'analyzing') return '分析中';
  if (status === 'failed') return '分析失败';
  return '已完成分析';
}

function statusClass(status: ProductStatus) {
  if (status === 'completed') return 'is-completed';
  if (status === 'failed') return 'is-failed';
  if (status === 'analyzing') return 'is-processing';
  if (status === 'pending-confirmation') return 'is-confirm';
  return '';
}

function displayValue(value: string) {
  return value.trim() || '当前未提供';
}

function buildAnalysisResult(base: ProductBaseInfo): ProductAnalysisResult {
  const name = base.name.trim() || '这款产品';
  return {
    understanding: `围绕${name}的现有资料，先把产品事实、使用场景和用户开始使用的门槛整理清楚，再形成可复用的产品理解。`,
    audienceSummary: '久坐、作息不规律、希望从低门槛方式开始调整的人群。',
    coreSellingPoint: '从日常状态切入，降低用户开始行动的门槛。',
    audience: {
      userStates: ['久坐办公', '作息不规律', '想调整状态但不想一次改变太多'],
      concerns: ['是否容易开始', '使用方式是否清晰', '是否适合自己的日常节奏'],
      scenes: ['日常办公', '季节性状态调整', '从小幅度习惯改变开始的阶段'],
      selectionConcerns: ['担心方案太复杂', '希望先看懂再决定', '在意是否能放进已有生活节奏'],
      boundaries: [
        '不适用于需要专业诊断或治疗的场景。',
        '不承诺即时效果，不将有限资料扩大解释为普遍效果。',
      ],
    },
    sellingPoints: [
      {
        title: '从日常状态切入，降低用户开始行动的门槛',
        basedOn: '产品资料围绕具体日常使用场景进行整理。',
        whyItWorks: '用户不需要一次改变全部生活方式，可以先从较容易执行的调整开始。',
        userHelp: '降低理解和开始使用的心理成本，让第一步更具体。',
        buyingReason: '对于希望开始调整、但不想面对复杂方案的用户，更容易形成选择依据。',
        boundary: '不能将“容易开始”扩大解释为适合所有人，也不能承诺具体效果。',
      },
      {
        title: '把产品使用放回已有生活节奏',
        basedOn: '已确认的资料包含使用方式和用户日常场景。',
        whyItWorks: '将产品选择和已有的早餐、办公、休息动作连接起来，减少额外记忆负担。',
        userHelp: '帮助用户判断什么时候用、怎么开始，而不是只看到抽象功能。',
        buyingReason: '使用方式清晰时，用户更容易评估这组产品是否适合自己。',
        boundary: '具体使用仍需以当前确认的产品说明为准，不替代个体化健康建议。',
      },
      {
        title: '用克制的资料表达建立理解基础',
        basedOn: '产品基础事实与关联企业资料共同构成当前分析依据。',
        whyItWorks: '先讲清事实和场景，再讨论价值，减少过度承诺带来的理解偏差。',
        userHelp: '让用户更容易区分产品事实、使用建议和自己的实际需求。',
        buyingReason: '信息边界清楚时，用户可以基于更具体的判断做选择。',
        boundary: '演示资料不构成医疗、诊断或治疗建议。',
      },
    ],
  };
}

function createProductRecord(
  draft: ProductDraft,
  status: ProductStatus,
  analysis: ProductAnalysisResult | null = null,
): ProductRecord {
  return {
    id: draft.id,
    base: cloneBase(draft.base),
    status,
    updatedAt: TODAY,
    sourceDocumentIds: [...draft.sourceDocumentIds],
    analysis,
  };
}

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={`product-status-badge ${statusClass(status)}`}>{statusLabel(status)}</span>
  );
}

function ProductProcessingPanel({ processing }: { processing: ProductProcessing }) {
  const steps = processing.kind === 'intake' ? intakeSteps : analysisSteps;
  const progress = `${Math.round(((processing.step + 1) / steps.length) * 100)}%`;

  return (
    <section className="product-processing-panel" role="status" aria-live="polite">
      <div className="product-processing-panel__header">
        <div>
          <span className="product-section-kicker">
            {processing.kind === 'intake' ? '资料整理' : '产品分析'}
          </span>
          <h1>{processing.kind === 'intake' ? '正在整理产品基础信息' : '正在建立产品资料'}</h1>
          <p>
            {processing.kind === 'intake'
              ? '先把你提供的资料整理成可以确认的基础信息。'
              : '基于已确认的产品资料，整理产品理解、受众和卖点。'}
          </p>
        </div>
        <strong>{progress}</strong>
      </div>
      <div className="product-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${(processing.step + 1) / steps.length})` }} />
      </div>
      <div className="product-processing-steps">
        {steps.map((step, index) => (
          <div className={index <= processing.step ? 'is-active' : ''} key={step}>
            <span aria-hidden="true">{index < processing.step ? '✓' : '○'}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SourceDocumentChips({ documentIds }: { documentIds: string[] }) {
  const documents = documentIds
    .map((id) => initialBrainDocuments.find((document) => document.id === id))
    .filter((document): document is (typeof initialBrainDocuments)[number] => Boolean(document));

  if (!documents.length) {
    return <span className="product-muted-text">暂未关联企业资料</span>;
  }

  return (
    <div className="product-source-chips">
      {documents.map((document) => (
        <span className="product-source-chip" key={document.id}>
          M · {document.fileName}
        </span>
      ))}
    </div>
  );
}

export function ProductLibraryPage() {
  const [products, setProducts] = useState<ProductRecord[]>(() =>
    productLibraryMockRecords.map((product) => ({
      ...product,
      base: cloneBase(product.base),
      sourceDocumentIds: [...product.sourceDocumentIds],
      analysis: product.analysis
        ? {
            ...product.analysis,
            audience: {
              ...product.analysis.audience,
              userStates: [...product.analysis.audience.userStates],
              concerns: [...product.analysis.audience.concerns],
              scenes: [...product.analysis.audience.scenes],
              selectionConcerns: [...product.analysis.audience.selectionConcerns],
              boundaries: [...product.analysis.audience.boundaries],
            },
            sellingPoints: product.analysis.sellingPoints.map((point) => ({ ...point })),
          }
        : null,
    })),
  );
  const [view, setView] = useState<ProductView>('list');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<ProductDetailTab>('overview');
  const [draft, setDraft] = useState<ProductDraft>(createEmptyDraft);
  const [manualMoreOpen, setManualMoreOpen] = useState(false);
  const [aiSource, setAiSource] = useState('');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [formError, setFormError] = useState('');
  const [processing, setProcessing] = useState<ProductProcessing | null>(null);
  const timersRef = useRef<number[]>([]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.base.name.toLocaleLowerCase().includes(term) ||
        product.base.type.toLocaleLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);

  const availableDocuments = useMemo(
    () => initialBrainDocuments.filter((document) => document.kind === 'markdown'),
    [],
  );

  useEffect(() => {
    return () => timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!processing) return undefined;
    const steps = processing.kind === 'intake' ? intakeSteps : analysisSteps;
    const timer = window.setTimeout(() => {
      if (processing.step < steps.length - 1) {
        setProcessing((current) => (current ? { ...current, step: current.step + 1 } : current));
        return;
      }

      if (processing.kind === 'intake') {
        setProducts((current) => {
          const next = createProductRecord(processing.draft, 'pending-confirmation');
          return current.some((product) => product.id === next.id)
            ? current.map((product) => (product.id === next.id ? next : product))
            : [next, ...current];
        });
        setDraft(processing.draft);
        setProcessing(null);
        setFormError('');
        setView('confirm');
        return;
      }

      const analysis = buildAnalysisResult(processing.draft.base);
      setProducts((current) =>
        current.map((product) =>
          product.id === processing.recordId
            ? { ...createProductRecord(processing.draft, 'completed', analysis) }
            : product,
        ),
      );
      setProcessing(null);
      setDetailTab('overview');
      setView('detail');
    }, 650);
    timersRef.current.push(timer);
    return () => window.clearTimeout(timer);
  }, [processing]);

  function updateDraftField(key: keyof ProductBaseInfo, value: string) {
    setDraft((current) => ({ ...current, base: { ...current.base, [key]: value } }));
  }

  function replaceProduct(next: ProductRecord) {
    setProducts((current) =>
      current.some((product) => product.id === next.id)
        ? current.map((product) => (product.id === next.id ? next : product))
        : [next, ...current],
    );
  }

  function resetForNewProduct() {
    setSelectedProductId(null);
    setDraft(createEmptyDraft());
    setManualMoreOpen(false);
    setAiSource('');
    setSelectedDocumentIds([]);
    setFormError('');
    setView('entry-choice');
  }

  function openProduct(product: ProductRecord) {
    if (processing) return;
    setSelectedProductId(product.id);
    setFormError('');
    if (product.status === 'pending-confirmation') {
      setDraft(createDraftFromProduct(product));
      setView('confirm');
      return;
    }
    setDetailTab('overview');
    setView('detail');
  }

  function startManualEntry() {
    setDraft(createEmptyDraft());
    setFormError('');
    setManualMoreOpen(false);
    setView('manual');
  }

  function startAiEntry() {
    setAiSource('');
    setSelectedDocumentIds([]);
    setFormError('');
    setView('ai');
  }

  function handleSaveManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.base.name.trim() || !draft.base.type.trim()) {
      setFormError('请先填写产品名称和产品类型。');
      return;
    }
    const next = createProductRecord(
      { ...draft, id: draft.id || createId('product') },
      'pending-confirmation',
    );
    setDraft(createDraftFromProduct(next));
    replaceProduct(next);
    setSelectedProductId(next.id);
    setFormError('');
    setView('confirm');
  }

  function handleStartAiIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!aiSource.trim() && selectedDocumentIds.length === 0) {
      setFormError('请粘贴一些产品资料，或至少选择一篇企业大脑文档。');
      return;
    }

    const nextDraft: ProductDraft = {
      id: createId('product'),
      sourceDocumentIds: [...selectedDocumentIds],
      base: {
        ...emptyProductBaseInfo,
        name: '春季轻养护组合',
        type: '健康管理方案',
        specPrice: '当前未提供',
        otherMaterials: aiSource.trim() || '已关联企业大脑资料，等待人工确认。',
      },
    };
    setDraft(nextDraft);
    setSelectedProductId(nextDraft.id);
    replaceProduct(createProductRecord(nextDraft, 'analyzing'));
    setProcessing({ kind: 'intake', step: 0, recordId: nextDraft.id, draft: nextDraft });
    setFormError('');
    setView('processing');
  }

  function handleConfirmAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.base.name.trim() || !draft.base.type.trim()) {
      setFormError('请至少确认产品名称和产品类型。');
      return;
    }
    const confirmedDraft = {
      ...draft,
      base: cloneBase(draft.base),
    };
    replaceProduct(createProductRecord(confirmedDraft, 'analyzing'));
    setSelectedProductId(confirmedDraft.id);
    setProcessing({
      kind: 'analysis',
      step: 0,
      recordId: confirmedDraft.id,
      draft: confirmedDraft,
    });
    setFormError('');
    setView('processing');
  }

  function handleEditProduct() {
    if (!selectedProduct || processing) return;
    setDraft(createDraftFromProduct(selectedProduct));
    setManualMoreOpen(true);
    setFormError('');
    setView('manual');
  }

  function handleReanalyze() {
    if (!selectedProduct || processing) return;
    const nextDraft = createDraftFromProduct(selectedProduct);
    replaceProduct(createProductRecord(nextDraft, 'analyzing'));
    setProcessing({
      kind: 'analysis',
      step: 0,
      recordId: selectedProduct.id,
      draft: nextDraft,
    });
    setView('processing');
  }

  function goToList() {
    if (processing) return;
    setSelectedProductId(null);
    setFormError('');
    setView('list');
  }

  function renderList() {
    const completedCount = products.filter((product) => product.status === 'completed').length;
    const confirmationCount = products.filter(
      (product) => product.status === 'pending-confirmation',
    ).length;
    const analyzingCount = products.filter((product) => product.status === 'analyzing').length;

    return (
      <div className="product-library-list-view">
        <div className="product-library-toolbar">
          <label className="product-search-field">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="搜索产品名称或类型"
              value={searchTerm}
              placeholder="搜索产品名称或类型"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <label className="product-filter-field">
            <span>状态筛选</span>
            <select
              aria-label="状态筛选"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProductStatus | 'all')}
            >
              <option value="all">全部状态</option>
              <option value="pending-entry">待录入</option>
              <option value="pending-confirmation">待人工确认</option>
              <option value="analyzing">分析中</option>
              <option value="completed">已完成分析</option>
              <option value="failed">分析失败</option>
            </select>
          </label>
          <button
            type="button"
            className="button button--primary product-library-toolbar__action"
            onClick={resetForNewProduct}
          >
            新建产品
          </button>
        </div>

        <div className="product-stat-strip" aria-label="产品库概览">
          <div>
            <span>产品总数</span>
            <strong>{products.length}</strong>
          </div>
          <div>
            <span>待确认</span>
            <strong>{confirmationCount}</strong>
          </div>
          <div>
            <span>已完成分析</span>
            <strong>{completedCount}</strong>
          </div>
          <div>
            <span>分析中</span>
            <strong>{analyzingCount}</strong>
          </div>
        </div>

        <section className="product-record-list" aria-label="产品列表">
          {filteredProducts.length ? (
            filteredProducts.map((product) => {
              const actionLabel =
                product.status === 'pending-confirmation' || product.status === 'pending-entry'
                  ? '继续录入'
                  : product.status === 'analyzing'
                    ? '处理中'
                    : '查看产品';
              return (
                <article className="product-record-card" key={product.id}>
                  <div className="product-record-card__main">
                    <div className="product-record-card__title-row">
                      <div>
                        <h2>{displayValue(product.base.name)}</h2>
                        <span>{displayValue(product.base.type)}</span>
                      </div>
                      <ProductStatusBadge status={product.status} />
                    </div>
                    <div className="product-record-card__details">
                      <span>
                        <strong>规格 / 价格</strong>
                        {displayValue(product.base.specPrice)}
                      </span>
                      <span>
                        <strong>最近更新</strong>
                        {product.updatedAt}
                      </span>
                    </div>
                    {product.failureMessage ? (
                      <p className="product-record-card__failure">{product.failureMessage}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={product.status === 'analyzing'}
                    onClick={() => openProduct(product)}
                  >
                    {actionLabel}
                  </button>
                </article>
              );
            })
          ) : (
            <div className="product-empty-state">
              <strong>没有找到匹配的产品</strong>
              <span>可以换一个名称或类型搜索。</span>
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderEntryChoice() {
    return (
      <div className="product-flow-view product-entry-choice">
        <button type="button" className="product-back-link" onClick={goToList}>
          ‹ 返回产品库
        </button>
        <div className="product-flow-heading">
          <span className="product-section-kicker">产品库</span>
          <h1>新建产品</h1>
          <p>选择一种产品资料录入方式，之后都会经过人工确认。</p>
        </div>
        <div className="product-entry-options">
          <article className="product-entry-option">
            <div>
              <span className="product-entry-option__mark">手动</span>
              <h2>手动录入</h2>
              <p>自己填写产品基础信息，适合已经掌握清晰资料的产品。</p>
            </div>
            <button type="button" className="button button--primary" onClick={startManualEntry}>
              开始手动录入
            </button>
          </article>
          <article className="product-entry-option product-entry-option--ai">
            <div>
              <span className="product-entry-option__mark">整理</span>
              <h2>AI 帮我录入</h2>
              <p>粘贴资料或口述信息，也可以关联企业大脑文档。</p>
            </div>
            <button type="button" className="button button--primary" onClick={startAiEntry}>
              让 AI 帮我录入
            </button>
          </article>
        </div>
      </div>
    );
  }

  function renderManualEntry() {
    return (
      <div className="product-flow-view product-manual-view">
        <button type="button" className="product-back-link" onClick={goToList}>
          ‹ 返回产品库
        </button>
        <div className="product-flow-heading">
          <span className="product-section-kicker">{draft.id ? '编辑资料' : '手动录入'}</span>
          <h1>手动录入产品基础信息</h1>
          <p>先处理产品事实，暂时没有的信息可以保留为“当前未提供”。</p>
        </div>
        <form className="product-form-card" onSubmit={handleSaveManual}>
          <div className="product-form-card__header">
            <div>
              <h2>必填基础信息</h2>
              <p>产品名称和产品类型需要先确认，其余字段可以后续补充。</p>
            </div>
          </div>
          <div className="product-field-list">
            {requiredBaseFields.map(({ key, label }) => (
              <label className="product-field" key={key}>
                <span>{label}</span>
                <input
                  value={draft.base[key]}
                  placeholder="当前未提供"
                  onChange={(event) => updateDraftField(key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="product-more-toggle"
            aria-expanded={manualMoreOpen}
            onClick={() => setManualMoreOpen((current) => !current)}
          >
            <span>更多产品资料</span>
            <span>
              {manualMoreOpen ? '收起' : '展开更多资料'} {manualMoreOpen ? '⌃' : '⌄'}
            </span>
          </button>
          {manualMoreOpen ? (
            <div className="product-optional-fields">
              {productOptionalFieldDefinitions.map(({ key, label, multiline }) => (
                <label className="product-field" key={key}>
                  <span>{label}</span>
                  {multiline ? (
                    <textarea
                      value={draft.base[key]}
                      placeholder="当前未提供"
                      rows={3}
                      onChange={(event) => updateDraftField(key, event.target.value)}
                    />
                  ) : (
                    <input
                      value={draft.base[key]}
                      placeholder="当前未提供"
                      onChange={(event) => updateDraftField(key, event.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          ) : null}
          {formError ? (
            <p className="product-form-error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="product-form-actions">
            <button type="button" className="button button--secondary" onClick={goToList}>
              取消
            </button>
            <button type="submit" className="button button--primary">
              保存并进入人工确认
            </button>
          </div>
        </form>
      </div>
    );
  }

  function renderAiEntry() {
    return (
      <div className="product-flow-view product-ai-view">
        <button type="button" className="product-back-link" onClick={goToList}>
          ‹ 返回产品库
        </button>
        <div className="product-flow-heading">
          <span className="product-section-kicker">AI 整理</span>
          <h1>AI 帮我录入产品</h1>
          <p>把你知道的产品资料告诉我，也可以直接关联已有企业资料。</p>
        </div>
        <form className="product-form-card" onSubmit={handleStartAiIntake}>
          <label className="product-material-input">
            <span>手动粘贴或口述产品资料</span>
            <textarea
              value={aiSource}
              rows={7}
              placeholder="例如：这是一个春季轻养护组合，主要面向久坐办公人群，规格是……"
              onChange={(event) => setAiSource(event.target.value)}
            />
          </label>
          <div className="product-document-picker">
            <div className="product-document-picker__heading">
              <div>
                <h2>关联已有企业资料</h2>
                <p>选择企业大脑中的 Markdown 文档作为产品事实依据。</p>
              </div>
              <span>{selectedDocumentIds.length} 篇已选</span>
            </div>
            <div className="product-document-options">
              {availableDocuments.map((document) => {
                const isSelected = selectedDocumentIds.includes(document.id);
                return (
                  <label
                    className={`product-document-option${isSelected ? ' is-selected' : ''}`}
                    key={document.id}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedDocumentIds((current) =>
                          isSelected
                            ? current.filter((id) => id !== document.id)
                            : [...current, document.id],
                        )
                      }
                    />
                    <span className="product-document-option__icon">M</span>
                    <span>
                      <strong>{document.fileName}</strong>
                      <small>{document.updatedAt} · 企业大脑</small>
                    </span>
                    <span className="product-document-option__check">
                      {isSelected ? '已选' : '选择'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          {selectedDocumentIds.length ? (
            <div className="product-selected-materials">
              <span>已选择：</span>
              <SourceDocumentChips documentIds={selectedDocumentIds} />
            </div>
          ) : null}
          {formError ? (
            <p className="product-form-error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="product-form-actions">
            <button type="button" className="button button--secondary" onClick={goToList}>
              取消
            </button>
            <button type="submit" className="button button--primary">
              开始整理产品信息
            </button>
          </div>
        </form>
      </div>
    );
  }

  function renderConfirmation() {
    return (
      <div className="product-flow-view product-confirm-view">
        <button type="button" className="product-back-link" onClick={() => setView('manual')}>
          ‹ 返回补充资料
        </button>
        <div className="product-flow-heading">
          <span className="product-section-kicker">人工确认</span>
          <h1>请确认产品基础信息</h1>
          <p>
            AI
            已经根据现有资料整理出以下信息，请确认是否需要补充。没有需要补充的信息，也可以直接开始分析。
          </p>
        </div>
        <form className="product-confirm-card" onSubmit={handleConfirmAnalysis}>
          <div className="product-confirm-card__notice">
            <strong>先确认产品事实，再生成产品理解。</strong>
            <span>没有资料的字段会保留为“当前未提供”，不会自动补写客户专属事实。</span>
          </div>
          <div className="product-confirm-fields">
            {requiredBaseFields.map(({ key, label }) => (
              <label className="product-confirm-field" key={key}>
                <span>{label}</span>
                <input
                  value={draft.base[key]}
                  placeholder="当前未提供"
                  onChange={(event) => updateDraftField(key, event.target.value)}
                />
                <small>
                  {draft.base[key].trim() ? '已整理，可直接编辑' : '当前未提供，可稍后补充'}
                </small>
              </label>
            ))}
          </div>
          <div className="product-confirm-divider" />
          <label className="product-material-input">
            <span>需要补充的产品资料</span>
            <textarea
              value={draft.base.otherMaterials}
              rows={5}
              placeholder="可以补充用户反馈、真实案例、使用方式、产品资料等"
              onChange={(event) => updateDraftField('otherMaterials', event.target.value)}
            />
          </label>
          <div className="product-confirm-sources">
            <span>本次关联的企业资料</span>
            <SourceDocumentChips documentIds={draft.sourceDocumentIds} />
          </div>
          {formError ? (
            <p className="product-form-error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="product-form-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setView('manual')}
            >
              继续补充
            </button>
            <button type="submit" className="button button--primary">
              确认并开始分析
            </button>
          </div>
        </form>
      </div>
    );
  }

  function renderOverview(product: ProductRecord) {
    if (!product.analysis) {
      return (
        <section className="product-analysis-failure" role="alert">
          <div>
            <strong>这次产品分析没有完成</strong>
            <p>{product.failureMessage ?? '当前资料不足，请补充后重新分析。'}</p>
          </div>
          <button type="button" className="button button--primary" onClick={handleReanalyze}>
            重新分析
          </button>
        </section>
      );
    }

    return (
      <div className="product-overview-content">
        <section className="product-overview-hero">
          <span className="product-section-kicker">产品总览</span>
          <h2>产品理解</h2>
          <p>{product.analysis.understanding}</p>
        </section>
        <div className="product-overview-stack">
          <article className="product-overview-card">
            <span>适合关注的人群</span>
            <strong>{product.analysis.audienceSummary}</strong>
          </article>
          <article className="product-overview-card">
            <span>核心卖点</span>
            <strong>{product.analysis.coreSellingPoint}</strong>
          </article>
          <article className="product-overview-card">
            <span>当前资料来源</span>
            <SourceDocumentChips documentIds={product.sourceDocumentIds} />
          </article>
        </div>
        <section className="product-boundary-card">
          <div>
            <span className="product-section-kicker">适用边界</span>
            <h2>哪些内容需要保持克制</h2>
          </div>
          <ul>
            {product.analysis.audience.boundaries.map((boundary) => (
              <li key={boundary}>{boundary}</li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  function renderBaseInfo(product: ProductRecord) {
    const sections = [
      { title: '基础资料', fields: baseInfoFields.slice(0, requiredBaseFields.length) },
      { title: '产品属性', fields: baseInfoFields.slice(requiredBaseFields.length, 10) },
      { title: '业务资料', fields: baseInfoFields.slice(10) },
    ];

    return (
      <section className="product-detail-section">
        <div className="product-detail-section__heading">
          <div>
            <span className="product-section-kicker">产品基础信息</span>
            <h2>已确认的产品事实</h2>
          </div>
          <span className="product-detail-section__hint">未确认字段保留为当前未提供</span>
        </div>
        <div className="product-spec-sheet">
          {sections.map((section) => (
            <section className="product-spec-group" key={section.title}>
              <h3>{section.title}</h3>
              <dl className="product-spec-list">
                {section.fields.map(({ key, label }) => (
                  <div className="product-spec-row" key={key}>
                    <dt>{label}</dt>
                    <dd className={product.base[key].trim() ? '' : 'is-muted'}>
                      {displayValue(product.base[key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <div className="product-detail-source-row">
          <span>原始资料来源</span>
          <SourceDocumentChips documentIds={product.sourceDocumentIds} />
        </div>
      </section>
    );
  }

  function renderAudience(product: ProductRecord) {
    if (!product.analysis) return renderOverview(product);
    const audience = product.analysis.audience;
    const groups = [
      { title: '典型用户状态', items: audience.userStates },
      { title: '用户在意什么', items: audience.concerns },
      { title: '适用场景', items: audience.scenes },
      { title: '选择顾虑', items: audience.selectionConcerns },
    ];

    return (
      <section className="product-audience-section">
        <div className="product-detail-section__heading">
          <div>
            <span className="product-section-kicker">受众与场景</span>
            <h2>从用户状态到选择顾虑</h2>
          </div>
          <span className="product-detail-section__hint">不只看年龄、性别和职业</span>
        </div>
        <div className="product-audience-stack">
          {groups.map((group) => (
            <article className="product-audience-card" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
          <article className="product-audience-card product-audience-card--boundary">
            <h3>适用边界</h3>
            <ul>
              {audience.boundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    );
  }

  function renderSellingPoints(product: ProductRecord) {
    if (!product.analysis) return renderOverview(product);
    return (
      <section className="product-selling-section">
        <div className="product-detail-section__heading">
          <div>
            <span className="product-section-kicker">卖点分析</span>
            <h2>把产品事实翻译成选择依据</h2>
          </div>
          <span className="product-detail-section__hint">每条卖点都保留成立条件和边界</span>
        </div>
        <div className="product-selling-list">
          {product.analysis.sellingPoints.map((point, index) => (
            <article className="product-selling-card" key={point.title}>
              <div className="product-selling-card__heading">
                <span>卖点 {index + 1}</span>
                <h3>{point.title}</h3>
              </div>
              <dl>
                <div>
                  <dt>基于什么</dt>
                  <dd>{point.basedOn}</dd>
                </div>
                <div>
                  <dt>为什么形成这个价值</dt>
                  <dd>{point.whyItWorks}</dd>
                </div>
                <div>
                  <dt>对用户有什么帮助</dt>
                  <dd>{point.userHelp}</dd>
                </div>
                <div>
                  <dt>购买时为什么值得关注</dt>
                  <dd>{point.buyingReason}</dd>
                </div>
                <div>
                  <dt>成立条件和边界</dt>
                  <dd>{point.boundary}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderDetail() {
    if (!selectedProduct) return renderList();
    const tabItems: Array<{ id: ProductDetailTab; label: string }> = [
      { id: 'overview', label: '产品总览' },
      { id: 'base', label: '基础信息' },
      { id: 'audience', label: '受众与场景' },
      { id: 'selling-points', label: '卖点分析' },
    ];

    return (
      <div className="product-detail-view">
        <button type="button" className="product-back-link" onClick={goToList}>
          ‹ 返回产品库
        </button>
        <header className="product-detail-header">
          <div>
            <span className="product-section-kicker">产品库 / 产品详情</span>
            <h1>{displayValue(selectedProduct.base.name)}</h1>
            <p>
              {displayValue(selectedProduct.base.type)} ·{' '}
              <ProductStatusBadge status={selectedProduct.status} /> · 最近更新{' '}
              {selectedProduct.updatedAt}
            </p>
          </div>
          <div className="product-detail-actions">
            <button type="button" className="button button--secondary" onClick={handleEditProduct}>
              编辑资料
            </button>
            <button
              type="button"
              className="button button--primary"
              disabled={selectedProduct.status === 'analyzing'}
              onClick={handleReanalyze}
            >
              {selectedProduct.status === 'analyzing' ? '分析中' : '重新分析'}
            </button>
          </div>
        </header>
        <div className="product-detail-tabs" role="tablist" aria-label="产品详情类型">
          {tabItems.map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === item.id}
              className={detailTab === item.id ? 'is-active' : ''}
              key={item.id}
              onClick={() => setDetailTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="product-detail-body">
          {detailTab === 'overview'
            ? renderOverview(selectedProduct)
            : detailTab === 'base'
              ? renderBaseInfo(selectedProduct)
              : detailTab === 'audience'
                ? renderAudience(selectedProduct)
                : renderSellingPoints(selectedProduct)}
        </div>
      </div>
    );
  }

  function renderCurrentView() {
    if (view === 'list') return renderList();
    if (view === 'entry-choice') return renderEntryChoice();
    if (view === 'manual') return renderManualEntry();
    if (view === 'ai') return renderAiEntry();
    if (view === 'confirm') return renderConfirmation();
    if (view === 'processing' && processing) {
      return (
        <div className="product-flow-view">
          <ProductProcessingPanel processing={processing} />
        </div>
      );
    }
    return renderDetail();
  }

  return (
    <div className="app-shell app-shell--product-library">
      <ProductSidebar activeModule="product-library" />
      <main className="app-main product-library-main" id="product-library">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>产品库</span>
            {selectedProduct && view === 'detail' ? (
              <>
                <span aria-hidden="true">/</span>
                <strong>{displayValue(selectedProduct.base.name)}</strong>
              </>
            ) : null}
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>
        <div className="product-library-content">{renderCurrentView()}</div>
      </main>
    </div>
  );
}
