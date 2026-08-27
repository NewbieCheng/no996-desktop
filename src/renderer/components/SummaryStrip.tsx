interface SummaryStripProps {
  summary: {
    total: number;
    strong: number;
    writable: number;
    observe: number;
  };
}

export function SummaryStrip({ summary }: SummaryStripProps) {
  const items = [
    { label: '今日全部', value: summary.total },
    { label: '强推荐', value: summary.strong },
    { label: '可写', value: summary.writable },
    { label: '待观察', value: summary.observe },
  ];

  return (
    <section className="summary-strip" aria-label="热点摘要">
      {items.map((item) => (
        <div className="summary-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </section>
  );
}
