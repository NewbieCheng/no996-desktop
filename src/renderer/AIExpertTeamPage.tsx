import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ProductSidebar } from './components/ProductSidebar';
import {
  aiExpertCategories,
  aiExpertStorageKey,
  aiExperts,
  initialUnlockedExpertIds,
} from './aiExpertMockData';
import type { AiExpert, AiExpertCategory } from './aiExpertMockData';

type ExpertScope = 'all' | 'mine';
type ExpertCategoryFilter = 'all' | AiExpertCategory;

function getInitialUnlockedIds() {
  if (typeof window === 'undefined') {
    return new Set(initialUnlockedExpertIds);
  }

  const storedValue = window.localStorage.getItem(aiExpertStorageKey);
  if (!storedValue) {
    return new Set(initialUnlockedExpertIds);
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return new Set(initialUnlockedExpertIds);
    }

    const knownIds = new Set(aiExperts.map((expert) => expert.id));
    return new Set(
      parsedValue.filter((id): id is string => typeof id === 'string' && knownIds.has(id)),
    );
  } catch {
    return new Set(initialUnlockedExpertIds);
  }
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`expert-filter-button${active ? ' expert-filter-button--active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ExpertCard({
  expert,
  isUnlocked,
  onUnlock,
  onUse,
}: {
  expert: AiExpert;
  isUnlocked: boolean;
  onUnlock: (expert: AiExpert) => void;
  onUse: (expert: AiExpert) => void;
}) {
  return (
    <article className={`expert-card${isUnlocked ? '' : ' expert-card--locked'}`}>
      <div className="expert-card__body">
        <div className="expert-card__title-row">
          <h2>{expert.name}</h2>
          {isUnlocked ? (
            <span className="expert-card__status" aria-label="已解锁">
              <span className="expert-unlock-icon" aria-hidden="true" />
              已解锁
            </span>
          ) : (
            <span className="expert-card__status expert-card__status--locked" aria-label="已锁定">
              <span className="expert-lock-icon" aria-hidden="true" />
              已锁定
            </span>
          )}
        </div>
        <p>{expert.description}</p>
      </div>
      <div className="expert-card__actions">
        {isUnlocked ? (
          <button
            type="button"
            className="button expert-card__button expert-card__button--use"
            onClick={() => onUse(expert)}
          >
            使用专家
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary expert-card__button expert-card__button--unlock"
            onClick={() => onUnlock(expert)}
          >
            解锁
          </button>
        )}
      </div>
    </article>
  );
}

function UnlockDialog({
  expert,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  expert: AiExpert;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <div className="expert-modal-layer">
      <button
        type="button"
        className="expert-modal-backdrop"
        aria-label="关闭解锁弹窗"
        onClick={onClose}
      />
      <section
        className="expert-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expert-unlock-title"
      >
        <div className="expert-modal__header">
          <div>
            <span className="expert-modal__kicker">专家解锁</span>
            <h2 id="expert-unlock-title">解锁 AI 专家</h2>
          </div>
          <button
            type="button"
            className="expert-modal__close"
            aria-label="关闭弹窗"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="expert-modal__body">
          <p>是否消耗 100积分聘请这个专家？</p>
          <strong>{expert.name}</strong>
        </div>
        <div className="expert-modal__footer">
          <button type="button" className="button button--secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="button button--primary expert-modal__confirm"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            确定聘请 · 100积分
          </button>
        </div>
      </section>
    </div>
  );
}

export function AIExpertTeamPage() {
  const [scope, setScope] = useState<ExpertScope>('all');
  const [category, setCategory] = useState<ExpertCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [points, setPoints] = useState(1000);
  const [unlockedExpertIds, setUnlockedExpertIds] = useState<Set<string>>(getInitialUnlockedIds);
  const [selectedExpert, setSelectedExpert] = useState<AiExpert | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    window.localStorage.setItem(aiExpertStorageKey, JSON.stringify([...unlockedExpertIds]));
  }, [unlockedExpertIds]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredExperts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchedExperts = aiExperts.filter((expert) => {
      const matchesScope = scope === 'all' || unlockedExpertIds.has(expert.id);
      const matchesCategory = category === 'all' || expert.category === category;
      const matchesSearch =
        !normalizedQuery ||
        expert.name.toLowerCase().includes(normalizedQuery) ||
        expert.description.toLowerCase().includes(normalizedQuery);
      return matchesScope && matchesCategory && matchesSearch;
    });

    return matchedExperts.sort(
      (left, right) =>
        Number(!unlockedExpertIds.has(left.id)) - Number(!unlockedExpertIds.has(right.id)),
    );
  }, [category, scope, searchQuery, unlockedExpertIds]);

  const openUnlockDialog = (expert: AiExpert) => {
    setSelectedExpert(expert);
    setIsUnlocking(false);
  };

  const closeUnlockDialog = () => {
    if (!isUnlocking) {
      setSelectedExpert(null);
    }
  };

  const confirmUnlock = () => {
    if (!selectedExpert || isUnlocking) {
      return;
    }

    setIsUnlocking(true);
    if (points < 100) {
      setToast('积分不足，暂时无法解锁该专家');
      setIsUnlocking(false);
      return;
    }

    setPoints((current) => current - 100);
    setUnlockedExpertIds((current) => {
      const next = new Set(current);
      next.add(selectedExpert.id);
      return next;
    });
    setSelectedExpert(null);
    setIsUnlocking(false);
    setToast(`已成功解锁「${selectedExpert.name}」`);
  };

  const emptyState = searchQuery.trim()
    ? {
        title: '未找到匹配的 AI 专家',
        description: '尝试搜索其他专家名称或定位说明。',
        action: '清除搜索条件',
      }
    : scope === 'mine'
      ? {
          title: '还没有已解锁专家',
          description: '解锁专家后，他们会出现在这里。',
          action: null,
        }
      : {
          title: '当前没有可展示的 AI 专家',
          description: '可以调整业务分类后继续查看。',
          action: null,
        };

  return (
    <div className="app-shell app-shell--experts">
      <ProductSidebar activeModule="ai-experts" />
      <main className="app-main experts-app-main" id="ai-experts">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>AI 专家团</span>
            <span aria-hidden="true">/</span>
            <strong>专家库</strong>
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>

        <div className="page-content experts-page-content">
          <div className="experts-heading-row">
            <div>
              <h1>AI 专家团</h1>
              <p className="page-description">为不同经营任务选择合适的 AI 专家。</p>
            </div>
            <div className="experts-heading-actions">
              <label className="expert-search">
                <span aria-hidden="true">⌕</span>
                <span className="visually-hidden">搜索专家</span>
                <input
                  type="search"
                  aria-label="搜索专家名称或专家定位"
                  placeholder="搜索专家名称或定位"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="experts-results-heading">
            <div className="experts-results-heading__main">
              <h2>{scope === 'mine' ? '我的专家' : '全部专家'}</h2>
              <div className="expert-category-tabs" aria-label="业务分类">
                <FilterButton active={category === 'all'} onClick={() => setCategory('all')}>
                  全部
                </FilterButton>
                {aiExpertCategories.map((item) => (
                  <FilterButton
                    key={item.id}
                    active={category === item.id}
                    onClick={() => setCategory(item.id)}
                  >
                    {item.label}
                  </FilterButton>
                ))}
              </div>
            </div>
            <div className="experts-results-heading__tools">
              <div className="expert-scope-tabs" aria-label="专家范围">
                <FilterButton active={scope === 'all'} onClick={() => setScope('all')}>
                  全部
                </FilterButton>
                <FilterButton active={scope === 'mine'} onClick={() => setScope('mine')}>
                  我的专家
                </FilterButton>
              </div>
              <span>{filteredExperts.length} 位专家</span>
            </div>
          </div>

          {filteredExperts.length > 0 ? (
            <section className="expert-card-grid" aria-label="AI 专家列表">
              {filteredExperts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  isUnlocked={unlockedExpertIds.has(expert.id)}
                  onUnlock={openUnlockDialog}
                  onUse={(selected) => setToast(`已选择「${selected.name}」`)}
                />
              ))}
            </section>
          ) : (
            <section className="experts-empty-state" aria-live="polite">
              <div className="experts-empty-state__mark" aria-hidden="true">
                ⌕
              </div>
              <h2>{emptyState.title}</h2>
              <p>{emptyState.description}</p>
              {emptyState.action ? (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setSearchQuery('')}
                >
                  {emptyState.action}
                </button>
              ) : null}
            </section>
          )}
        </div>
      </main>

      {selectedExpert ? (
        <UnlockDialog
          expert={selectedExpert}
          isSubmitting={isUnlocking}
          onClose={closeUnlockDialog}
          onConfirm={confirmUnlock}
        />
      ) : null}
      {toast ? (
        <div className="expert-toast" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>
          {toast}
        </div>
      ) : null}
    </div>
  );
}
