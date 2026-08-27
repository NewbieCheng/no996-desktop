import { useMemo, useState } from 'react';
import { defaultRadarConfig, getWeekDays, hotspotItems, TODAY } from './mockData';
import { HotspotCard } from './components/HotspotCard';
import { ProductSidebar } from './components/ProductSidebar';
import { RadarConfigDrawer } from './components/RadarConfigDrawer';
import { SummaryStrip } from './components/SummaryStrip';
import { WeekDateBar } from './components/WeekDateBar';
import {
  createTopicFromHotspot,
  getLinkedHotspotIds,
  loadTopicItems,
  saveTopicItems,
} from './topicPoolStorage';
import type { HotspotItem, RadarConfig } from './types';

function calculateSummary(items: HotspotItem[]) {
  return {
    total: items.length,
    strong: items.filter((item) => item.level === 'strong').length,
    writable: items.filter((item) => item.level === 'writable').length,
    observe: items.filter((item) => item.level === 'observe').length,
  };
}

export function HotspotRadarPage() {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [weekOffset, setWeekOffset] = useState(0);
  const [items, setItems] = useState(() => {
    const linkedHotspotIds = getLinkedHotspotIds();
    return hotspotItems.map((item) => ({
      ...item,
      addedToTopicPool: item.addedToTopicPool || linkedHotspotIds.has(item.id),
    }));
  });
  const [config, setConfig] = useState<RadarConfig>(defaultRadarConfig);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const displayedWeek = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const selectedItems = useMemo(
    () => items.filter((item) => item.date === selectedDate),
    [items, selectedDate],
  );
  const summary = useMemo(() => calculateSummary(selectedItems), [selectedItems]);

  const handleWeekChange = (nextOffset: number) => {
    setWeekOffset(nextOffset);
    setSelectedDate(getWeekDays(nextOffset)[4].date);
  };

  const handleAddToTopicPool = (id: string) => {
    const hotspot = items.find((item) => item.id === id);
    if (!hotspot) {
      return;
    }

    const storedTopics = loadTopicItems();
    const existingTopic = storedTopics.find((topic) => topic.sourceHotspotId === hotspot.id);
    const topic = existingTopic ?? createTopicFromHotspot(hotspot);
    if (!existingTopic) {
      saveTopicItems([...storedTopics, topic]);
    }

    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, addedToTopicPool: true } : item)),
    );
    window.location.hash = `#topic-pool?focus=pool&topicId=${encodeURIComponent(topic.id)}`;
  };

  return (
    <div className="app-shell">
      <ProductSidebar activeModule="hotspot-radar" />
      <main className="app-main" id="hotspot-radar">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>洞察中心</span>
            <span aria-hidden="true">/</span>
            <strong>热点雷达</strong>
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading-row page-heading-row--actions-only">
            <button
              type="button"
              className="configure-button"
              onClick={() => setIsDrawerOpen(true)}
            >
              <span className="configure-button__icon" aria-hidden="true">
                ◌
              </span>
              配置热点雷达
            </button>
          </div>

          <WeekDateBar
            dates={displayedWeek}
            selectedDate={selectedDate}
            today={TODAY}
            onSelect={setSelectedDate}
            onPreviousWeek={() => handleWeekChange(weekOffset - 1)}
            onNextWeek={() => handleWeekChange(weekOffset + 1)}
          />

          <SummaryStrip summary={summary} />

          {selectedItems.length > 0 ? (
            <div className="hotspot-list">
              {selectedItems.map((item) => (
                <HotspotCard key={item.id} item={item} onAddToTopicPool={handleAddToTopicPool} />
              ))}
            </div>
          ) : (
            <section className="empty-state" aria-live="polite">
              <div className="empty-state__mark" aria-hidden="true">
                －
              </div>
              <h3>这一天暂时没有热点早报</h3>
              <p>换一个日期看看，或稍后再回来查看新的线索。</p>
            </section>
          )}
        </div>
      </main>

      <RadarConfigDrawer
        isOpen={isDrawerOpen}
        config={config}
        onClose={() => setIsDrawerOpen(false)}
        onSave={(nextConfig) => {
          setConfig(nextConfig);
          setIsDrawerOpen(false);
        }}
      />
    </div>
  );
}
