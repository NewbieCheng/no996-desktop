import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ProductSidebar } from './components/ProductSidebar';
import {
  getWeeklyHomeData,
  type HomeRoute,
  type WeeklyBrief,
  type WeeklyExpression,
  type WeeklyOpportunity,
} from './homeMockData';

const WEEK_START = new Date('2026-08-24T00:00:00');

function getWeekRange(offset: number) {
  const start = new Date(WEEK_START);
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const format = (date: Date) =>
    `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  const endFormat = `${end.getMonth() + 1} 月 ${end.getDate()} 日`;
  return `${format(start)}至 ${endFormat}`;
}

function goTo(route: HomeRoute) {
  window.location.hash = route;
}

function WeeklyButton({
  children,
  variant = 'secondary',
  loading = false,
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'dark' | 'text';
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`weekly-button weekly-button--${variant}`}
      onClick={onClick}
      disabled={loading || disabled}
      aria-busy={loading}
    >
      {loading ? <span className="weekly-button__spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function WeeklySectionHeading({ id, title }: { id: string; title: string }) {
  return (
    <div className="weekly-section-heading">
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function BriefSignals({ brief }: { brief: WeeklyBrief }) {
  return (
    <aside className="weekly-report__signals" aria-label="本周简报要点">
      <div className="weekly-signal">
        <span>本周内容方向</span>
        <strong>{brief.direction}</strong>
      </div>
      <div className="weekly-signal">
        <span>推荐表达方式</span>
        <strong>{brief.expression}</strong>
      </div>
      <div className="weekly-signal weekly-signal--basis">
        <span>关联依据</span>
        <div className="weekly-signal__links">
          {brief.basis.map((item) => (
            <button type="button" key={item.label} onClick={() => goTo(item.route)}>
              {item.label}
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function BriefModal({
  brief,
  onClose,
  onOpenBasis,
}: {
  brief: WeeklyBrief;
  onClose: () => void;
  onOpenBasis: (route: HomeRoute) => void;
}) {
  return (
    <div className="weekly-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="weekly-modal weekly-modal--brief"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-brief-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="weekly-modal__header">
          <div>
            <span className="weekly-modal__kicker">本周经营简报</span>
            <h2 id="weekly-brief-modal-title">{brief.title}</h2>
          </div>
          <button
            type="button"
            className="weekly-close-button"
            aria-label="关闭简报"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="weekly-modal__content">
          <article>
            <h3>本周观察</h3>
            <ul>
              {brief.observations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>AI 判断</h3>
            <ul>
              {brief.judgments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>经营建议</h3>
            <ul>
              {brief.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className="weekly-modal__footer">
          <div>
            <span>相关依据</span>
            <div className="weekly-modal__basis">
              {brief.basis.map((item) => (
                <button type="button" key={item.label} onClick={() => onOpenBasis(item.route)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <WeeklyButton variant="secondary" onClick={onClose}>
            返回周刊
          </WeeklyButton>
        </div>
      </section>
    </div>
  );
}

function OpportunityModal({
  opportunity,
  isJoined,
  onClose,
  onJoin,
  onOpenSource,
}: {
  opportunity: WeeklyOpportunity;
  isJoined: boolean;
  onClose: () => void;
  onJoin: () => void;
  onOpenSource: () => void;
}) {
  return (
    <div className="weekly-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="weekly-modal weekly-modal--opportunity"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-opportunity-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="weekly-modal__header">
          <div>
            <span className="weekly-modal__kicker">{opportunity.source}</span>
            <h2 id="weekly-opportunity-modal-title">{opportunity.title}</h2>
          </div>
          <button
            type="button"
            className="weekly-close-button"
            aria-label="关闭详情"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="weekly-opportunity-detail">
          <div>
            <span>借势方向</span>
            <strong>{opportunity.direction}</strong>
          </div>
          <div>
            <span>适合切入</span>
            <strong>{opportunity.angle}</strong>
          </div>
          <p>{opportunity.detail}</p>
        </div>
        <div className="weekly-modal__footer">
          <WeeklyButton variant="text" onClick={onOpenSource}>
            打开来源模块
          </WeeklyButton>
          {opportunity.action === '加入选题池' ? (
            <WeeklyButton variant="primary" disabled={isJoined} onClick={onJoin}>
              {isJoined ? '已加入选题池' : '加入选题池'}
            </WeeklyButton>
          ) : (
            <WeeklyButton variant="primary" onClick={onOpenSource}>
              查看来源
            </WeeklyButton>
          )}
        </div>
      </section>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  isJoined,
  onOpen,
  onJoin,
  onOpenSource,
}: {
  opportunity: WeeklyOpportunity;
  isJoined: boolean;
  onOpen: () => void;
  onJoin: () => void;
  onOpenSource: () => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      className="weekly-opportunity-card"
      role="button"
      tabIndex={0}
      aria-label={`查看${opportunity.direction}借势详情`}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) return;
        onOpen();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="weekly-opportunity-card__topline">
        <span>{opportunity.direction}</span>
        <button type="button" onClick={onOpenSource}>
          {opportunity.source} <span aria-hidden="true">↗</span>
        </button>
      </div>
      <h3>{opportunity.title}</h3>
      <div className="weekly-opportunity-card__angle">
        <span>适合切入</span>
        <strong>{opportunity.angle}</strong>
      </div>
      <div className="weekly-opportunity-card__footer">
        <span className="weekly-opportunity-card__hint">点击卡片查看完整方向</span>
        {opportunity.action === '加入选题池' ? (
          <WeeklyButton variant="secondary" disabled={isJoined} onClick={onJoin}>
            {isJoined ? '已加入选题池' : '加入选题池'}
          </WeeklyButton>
        ) : (
          <WeeklyButton variant="secondary" onClick={onOpen}>
            查看详情
          </WeeklyButton>
        )}
      </div>
    </article>
  );
}

function getExpressionRoute(expression: WeeklyExpression): HomeRoute {
  if (expression.status === '待排期') return '#topic-pool?focus=calendar';
  if (expression.status === '待创作') return '#content-creation';
  return '#content-assets';
}

function getExpressionAction(expression: WeeklyExpression) {
  if (expression.status === '待排期') return '去排期';
  if (expression.status === '待创作') return '去创作';
  return expression.action;
}

function ExpressionList({
  expressions,
  onNavigate,
}: {
  expressions: WeeklyExpression[];
  onNavigate: (route: HomeRoute, label: string) => void;
}) {
  if (expressions.length === 0) {
    return (
      <div className="weekly-empty-state">
        <div>
          <span className="weekly-empty-state__label">正在表达</span>
          <h3>本周还没有进入表达阶段的内容</h3>
          <p>从选题池挑选一个具体方向，开始建立本周的内容表达。</p>
        </div>
        <WeeklyButton
          variant="primary"
          onClick={() => onNavigate('#topic-pool?focus=pool', '选题池')}
        >
          从选题池选择一个选题
        </WeeklyButton>
      </div>
    );
  }

  return (
    <div className="weekly-expression-list" role="table" aria-label="本周正在表达的内容">
      <div className="weekly-expression-list__header" role="row">
        <span role="columnheader">日期</span>
        <span role="columnheader">内容主题</span>
        <span role="columnheader">内容类型</span>
        <span role="columnheader">当前状态</span>
        <span role="columnheader">下一步操作</span>
      </div>
      {expressions.map((expression) => (
        <div className="weekly-expression-row" role="row" key={expression.id}>
          <span role="cell" className="weekly-expression-row__day">
            {expression.day}
          </span>
          <strong role="cell" className="weekly-expression-row__topic">
            {expression.topic}
          </strong>
          <span role="cell">{expression.type}</span>
          <span
            role="cell"
            className={`weekly-expression-status weekly-expression-status--${expression.status}`}
          >
            {expression.status}
          </span>
          <button
            type="button"
            className="weekly-expression-row__action"
            onClick={() => onNavigate(getExpressionRoute(expression), expression.topic)}
          >
            {getExpressionAction(expression)}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [toast, setToast] = useState('');
  const [joinedOpportunityIds, setJoinedOpportunityIds] = useState<string[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<WeeklyOpportunity | null>(null);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const refreshTimer = useRef<number | null>(null);

  const data = useMemo(() => getWeeklyHomeData(weekOffset), [weekOffset]);
  const refreshedParagraph =
    refreshVersion > 0 && weekOffset === 0
      ? '补充判断：优先从午后疲惫与睡前 30 分钟两个场景展开，再把完成内容延伸到朋友圈经营。'
      : null;

  useEffect(() => {
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isBriefOpen && !selectedOpportunity) return undefined;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsBriefOpen(false);
        setSelectedOpportunity(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBriefOpen, selectedOpportunity]);

  const showToast = (message: string) => setToast(message);

  const navigate = (route: HomeRoute, label: string) => {
    goTo(route);
    showToast(`已打开${label}`);
  };

  const refreshBrief = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    refreshTimer.current = window.setTimeout(() => {
      setRefreshVersion((version) => version + 1);
      setIsRefreshing(false);
      showToast('AI 经营简报已刷新');
      refreshTimer.current = null;
    }, 850);
  };

  const joinOpportunity = (opportunity: WeeklyOpportunity) => {
    if (joinedOpportunityIds.includes(opportunity.id)) return;
    setJoinedOpportunityIds((ids) => [...ids, opportunity.id]);
    showToast(`“${opportunity.direction}”已加入选题池`);
  };

  const openOpportunitySource = (opportunity: WeeklyOpportunity) => {
    setSelectedOpportunity(null);
    navigate(opportunity.sourceRoute, opportunity.source);
  };

  const handleWeekChange = (offset: number) => {
    setWeekOffset(offset);
    setSelectedOpportunity(null);
    setIsBriefOpen(false);
  };

  return (
    <div className="app-shell weekly-home-shell">
      <ProductSidebar activeModule="home" brandName="森野轻养品牌" />
      <main className="app-main weekly-main" id="overview">
        <header className="topbar weekly-topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>森野轻养品牌</span>
          </div>
          <div className="weekly-topbar__actions">
            <span className="weekly-topbar__range">{getWeekRange(weekOffset)}</span>
            <button
              type="button"
              className="weekly-week-button"
              onClick={() => handleWeekChange(weekOffset - 1)}
            >
              <span aria-hidden="true">‹</span> 上一周
            </button>
            <button
              type="button"
              className="weekly-week-button"
              onClick={() => handleWeekChange(weekOffset + 1)}
            >
              下一周 <span aria-hidden="true">›</span>
            </button>
            <WeeklyButton variant="text" loading={isRefreshing} onClick={refreshBrief}>
              {isRefreshing ? 'AI 处理中' : '刷新简报'}
            </WeeklyButton>
            <div className="topbar-account">
              <span className="account-avatar" aria-hidden="true">
                森
              </span>
              <span>森野轻养品牌</span>
            </div>
          </div>
        </header>

        <div className="weekly-page-content">
          <div className="weekly-heading-row">
            <div>
              <h1>本周品牌正在发生什么</h1>
              <p>{getWeekRange(weekOffset)} · AI 经营简报</p>
            </div>
            <span className="weekly-heading-row__note">森野轻养品牌</span>
          </div>

          <section className="weekly-report" aria-labelledby="weekly-report-title">
            <div className="weekly-report__main">
              <div className="weekly-report__label">本周经营简报</div>
              <h2 id="weekly-report-title">{data.weeklyBrief.title}</h2>
              <div className="weekly-report__copy">
                {data.weeklyBrief.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {refreshedParagraph ? (
                  <p className="weekly-report__updated">{refreshedParagraph}</p>
                ) : null}
              </div>
              <div className="weekly-report__actions">
                <WeeklyButton variant="primary" onClick={() => setIsBriefOpen(true)}>
                  查看完整简报
                </WeeklyButton>
                <WeeklyButton variant="dark" onClick={() => navigate('#hotspot-radar', '热点雷达')}>
                  进入热点雷达
                </WeeklyButton>
              </div>
            </div>
            <BriefSignals brief={data.weeklyBrief} />
          </section>

          <section
            className="weekly-section weekly-opportunities"
            aria-labelledby="weekly-opportunities-title"
          >
            <WeeklySectionHeading id="weekly-opportunities-title" title="本周值得借势" />
            <div className="weekly-opportunity-grid">
              {data.weeklyOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  isJoined={joinedOpportunityIds.includes(opportunity.id)}
                  onOpen={() => setSelectedOpportunity(opportunity)}
                  onJoin={() => joinOpportunity(opportunity)}
                  onOpenSource={() => openOpportunitySource(opportunity)}
                />
              ))}
            </div>
          </section>

          <section
            className="weekly-section weekly-expressions"
            aria-labelledby="weekly-expressions-title"
          >
            <WeeklySectionHeading id="weekly-expressions-title" title="本周正在表达" />
            <ExpressionList expressions={data.weeklyExpressions} onNavigate={navigate} />
          </section>
        </div>
      </main>

      {toast ? (
        <div className="weekly-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}

      {isBriefOpen ? (
        <BriefModal
          brief={data.weeklyBrief}
          onClose={() => setIsBriefOpen(false)}
          onOpenBasis={(route) => {
            setIsBriefOpen(false);
            navigate(route, '相关依据');
          }}
        />
      ) : null}

      {selectedOpportunity ? (
        <OpportunityModal
          opportunity={selectedOpportunity}
          isJoined={joinedOpportunityIds.includes(selectedOpportunity.id)}
          onClose={() => setSelectedOpportunity(null)}
          onJoin={() => joinOpportunity(selectedOpportunity)}
          onOpenSource={() => openOpportunitySource(selectedOpportunity)}
        />
      ) : null}
    </div>
  );
}
