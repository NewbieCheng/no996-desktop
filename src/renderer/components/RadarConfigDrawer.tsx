import { useEffect, useState } from 'react';
import type { RadarConfig, SourcePlatform } from '../types';

interface RadarConfigDrawerProps {
  isOpen: boolean;
  config: RadarConfig;
  onClose: () => void;
  onSave: (config: RadarConfig) => void;
}

export function RadarConfigDrawer({ isOpen, config, onClose, onSave }: RadarConfigDrawerProps) {
  const [draft, setDraft] = useState<RadarConfig>(config);
  const [dailyCountInput, setDailyCountInput] = useState(String(config.dailyCount));
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft({ ...config, sources: [...config.sources] });
    setDailyCountInput(String(config.dailyCount));
    setIsAddingSource(false);
    setSourceName('');
    setSourceUrl('');
  }, [config, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
  }, [isOpen, onClose]);

  const updateDraft = <K extends keyof RadarConfig>(key: K, value: RadarConfig[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleDailyCountChange = (value: string) => {
    const normalized = value.replace(/\D/g, '');
    setDailyCountInput(normalized);
    if (normalized) {
      updateDraft('dailyCount', Number.parseInt(normalized, 10));
    }
  };

  const handleAddSource = () => {
    const name = sourceName.trim();
    const url = sourceUrl.trim();
    if (!name || !url) {
      return;
    }

    const source: SourcePlatform = {
      id: `source-${Date.now()}`,
      name,
      url,
    };
    updateDraft('sources', [...draft.sources, source]);
    setIsAddingSource(false);
    setSourceName('');
    setSourceUrl('');
  };

  const handleDeleteSource = (sourceId: string) => {
    updateDraft(
      'sources',
      draft.sources.filter((source) => source.id !== sourceId),
    );
  };

  const handleSave = () => {
    const dailyCount = Number.parseInt(dailyCountInput, 10);
    if (!Number.isInteger(dailyCount) || dailyCount < 1) {
      return;
    }

    onSave({ ...draft, dailyCount });
  };

  return (
    <div className={`drawer-layer${isOpen ? ' drawer-layer--open' : ''}`} aria-hidden={!isOpen}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside
        className="config-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="radar-drawer-title"
      >
        <div className="config-drawer__header">
          <div>
            <span className="drawer-kicker">热点雷达</span>
            <h2 id="radar-drawer-title">配置热点雷达</h2>
          </div>
          <button
            type="button"
            className="drawer-close"
            aria-label="关闭配置热点雷达"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="config-drawer__content">
          <section className="config-section">
            <div className="config-section__heading">
              <span className="section-index">01</span>
              <h3>企业基础配置</h3>
            </div>
            <span className="field-label">当前配置</span>
            <button
              type="button"
              className="source-add-button knowledge-base-button"
              disabled
              aria-label="添加知识库关联"
            >
              <span aria-hidden="true">+</span>
              添加知识库关联
            </button>
          </section>

          <section className="config-section">
            <div className="config-section__heading">
              <span className="section-index">02</span>
              <h3>热点来源</h3>
            </div>
            <label className="field-label" htmlFor="radar-region">
              关注地域
            </label>
            <select
              id="radar-region"
              value={draft.region}
              onChange={(event) => updateDraft('region', event.target.value)}
            >
              <option>中国大陆</option>
              <option>海外热点</option>
              <option>全部</option>
            </select>
          </section>

          <section className="config-section">
            <div className="config-section__heading">
              <span className="section-index">03</span>
              <h3>来源平台</h3>
            </div>
            {!isAddingSource ? (
              <button
                type="button"
                className="source-add-button"
                onClick={() => setIsAddingSource(true)}
              >
                <span aria-hidden="true">+</span>
                添加重点探测平台
              </button>
            ) : (
              <div className="source-editor">
                <div className="source-editor__title">添加重点探测平台</div>
                <label className="field-label" htmlFor="source-name">
                  网址名
                </label>
                <input
                  id="source-name"
                  value={sourceName}
                  placeholder="请输入平台名称"
                  onChange={(event) => setSourceName(event.target.value)}
                />
                <label className="field-label" htmlFor="source-url">
                  网址
                </label>
                <input
                  id="source-url"
                  value={sourceUrl}
                  placeholder="请输入平台网址"
                  onChange={(event) => setSourceUrl(event.target.value)}
                />
                <div className="source-editor__actions">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      setIsAddingSource(false);
                      setSourceName('');
                      setSourceUrl('');
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={!sourceName.trim() || !sourceUrl.trim()}
                    onClick={handleAddSource}
                  >
                    保存
                  </button>
                </div>
              </div>
            )}

            <div className="source-list">
              <div className="source-list__label">已添加来源</div>
              {draft.sources.map((source) => (
                <div className="source-row" key={source.id}>
                  <div>
                    <strong>{source.name}</strong>
                    <span>{source.url}</span>
                  </div>
                  <button
                    type="button"
                    className="source-delete"
                    aria-label={`删除来源 ${source.name}`}
                    onClick={() => handleDeleteSource(source.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="config-section config-section--last">
            <div className="config-section__heading">
              <span className="section-index">04</span>
              <h3>输出数量</h3>
            </div>
            <label className="field-label" htmlFor="daily-count">
              每日生成热点数量
            </label>
            <input
              id="daily-count"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={dailyCountInput}
              onChange={(event) => handleDailyCountChange(event.target.value)}
            />
          </section>
        </div>

        <div className="config-drawer__footer">
          <button type="button" className="button button--secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="button button--primary button--wide"
            disabled={!dailyCountInput || Number.parseInt(dailyCountInput, 10) < 1}
            onClick={handleSave}
          >
            保存配置
          </button>
        </div>
      </aside>
    </div>
  );
}
