interface WeekDateBarProps {
  dates: Array<{ date: string; label: string }>;
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export function WeekDateBar({
  dates,
  selectedDate,
  today,
  onSelect,
  onPreviousWeek,
  onNextWeek,
}: WeekDateBarProps) {
  return (
    <div className="week-timeline">
      <div className="week-timeline__stage">
        <button
          type="button"
          className="week-nav-button"
          aria-label="上一周"
          onClick={onPreviousWeek}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <nav className="week-date-bar" aria-label="热点周时间轴">
          {dates.map((item) => {
            const isSelected = item.date === selectedDate;
            const isToday = item.date === today;
            const [dateLabel, weekdayLabel] = item.label.split(' ');

            return (
              <button
                key={item.date}
                type="button"
                className={`date-item${isSelected ? ' date-item--selected' : ''}${
                  isToday ? ' date-item--today' : ''
                }`}
                aria-current={isSelected ? 'date' : undefined}
                aria-label={item.label}
                aria-pressed={isSelected}
                onClick={() => onSelect(item.date)}
              >
                <span className="date-item__label">
                  <span>{dateLabel}</span>
                  <span>{weekdayLabel}</span>
                </span>
                <span className="date-item__marker" aria-hidden="true" />
              </button>
            );
          })}
        </nav>
        <button type="button" className="week-nav-button" aria-label="下一周" onClick={onNextWeek}>
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
