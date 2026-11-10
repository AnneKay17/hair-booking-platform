import { useMemo, useState } from "react";
import useApiData from "../../hooks/useApiData";
import { getBookableDates } from "../../services/availabilityApi";
import {
  addMonths,
  compareMonths,
  formatDateLong,
  formatMonthYear,
  getMonthGrid,
  getMonthRange,
  getTodayString,
  parseDateString,
} from "../../utils/dateUtils";
import { ErrorMessage, LoadingMessage } from "../Feedback";

const MAX_MONTHS_AHEAD = 3;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DateSelection({ serviceOptionId, selectedDate, onSelect, refreshKey }) {
  const today = getTodayString();
  const { year: todayYear, month: todayMonth } = parseDateString(today);
  const currentMonth = { year: todayYear, month: todayMonth };

  const [visible, setVisible] = useState(() => {
    if (!selectedDate) return currentMonth;
    const { year, month } = parseDateString(selectedDate);
    return { year, month };
  });

  const { startDate, endDate } = getMonthRange(visible.year, visible.month, today);

  const { data, loading, error, reload } = useApiData(
    () => getBookableDates({ serviceOptionId, startDate, endDate }),
    [serviceOptionId, startDate, endDate, refreshKey]
  );

  const availableDates = useMemo(() => new Set(data ?? []), [data]);
  const monthsAhead = compareMonths(visible, currentMonth);
  const canGoPrev = monthsAhead > 0;
  const canGoNext = monthsAhead < MAX_MONTHS_AHEAD;

  const goToMonth = (delta) => setVisible((current) => addMonths(current.year, current.month, delta));

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          onClick={() => goToMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className="calendar-title" aria-live="polite">
          {formatMonthYear(visible.year, visible.month)}
        </h3>
        <button
          type="button"
          className="calendar-nav"
          onClick={() => goToMonth(1)}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {error && <ErrorMessage error={error} onRetry={reload} />}
      {loading && <LoadingMessage>Checking available dates…</LoadingMessage>}

      <div className="calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="calendar-weekday">
            {weekday}
          </span>
        ))}

        {getMonthGrid(visible.year, visible.month).map((dateString, index) => {
          if (!dateString) return <span key={`blank-${index}`} />;

          const isAvailable = !loading && !error && availableDates.has(dateString);
          const isSelected = dateString === selectedDate;

          return (
            <button
              key={dateString}
              type="button"
              className={`calendar-day ${isAvailable ? "is-available" : ""} ${
                isSelected ? "is-selected" : ""
              }`}
              disabled={!isAvailable}
              aria-pressed={isSelected}
              aria-label={`${formatDateLong(dateString)}, ${
                isAvailable ? "available" : "unavailable"
              }`}
              onClick={() => onSelect(dateString)}
            >
              {Number(dateString.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span>
          <i className="legend-dot is-available" /> Available
        </span>
        <span>
          <i className="legend-dot" /> Unavailable
        </span>
      </div>

      {!loading && !error && data && data.length === 0 && (
        <p className="muted small">No available dates this month. Try the next month.</p>
      )}
    </div>
  );
}