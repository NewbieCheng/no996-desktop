import type { HotspotItem } from '../types';

const levelMeta = {
  strong: { icon: '🔥', label: '强推荐', className: 'badge--strong' },
  writable: { icon: '👍', label: '可写', className: 'badge--writable' },
  observe: { icon: '👀', label: '待观察', className: 'badge--observe' },
} as const;

interface HotspotCardProps {
  item: HotspotItem;
  onAddToTopicPool: (id: string) => void;
}

export function HotspotCard({ item, onAddToTopicPool }: HotspotCardProps) {
  const meta = levelMeta[item.level];

  return (
    <article className="hotspot-card">
      <div className="hotspot-card__body">
        <div className="hotspot-card__topline">
          <span className={`recommendation-badge ${meta.className}`}>
            <span aria-hidden="true">{meta.icon}</span>
            {meta.label} · {item.score}
          </span>
        </div>
        <h3>{item.title}</h3>
        <div className="hotspot-card__copy">
          <p>
            <span className="copy-label">热点摘要</span>
            {item.summary}
          </p>
          <p>
            <span className="copy-label">选题切入</span>
            {item.angle}
          </p>
        </div>
        <div className="hotspot-source">
          <span className="copy-label">热点来源</span>
          <span>{item.platform}</span>
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.url}
          </a>
          <span className="credibility">可信度 {item.credibility}</span>
        </div>
      </div>
      <button
        type="button"
        className={`topic-pool-button${item.addedToTopicPool ? ' topic-pool-button--done' : ''}`}
        aria-pressed={item.addedToTopicPool}
        onClick={() => onAddToTopicPool(item.id)}
      >
        {item.addedToTopicPool ? '已加入选题池' : '加入选题池'}
      </button>
    </article>
  );
}
