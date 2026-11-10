import useApiData from "../../hooks/useApiData";
import { getSlots } from "../../services/availabilityApi";
import { formatDateLong } from "../../utils/dateUtils";
import { ErrorMessage, LoadingMessage } from "../Feedback";

export default function TimeSlotSelection({
  serviceOptionId,
  date,
  selectedSlot,
  onSelect,
  refreshKey,
}) {
  const {
    data: slots,
    loading,
    error,
    reload,
  } = useApiData(() => getSlots({ serviceOptionId, date }), [serviceOptionId, date, refreshKey], {
    enabled: Boolean(date),
  });

  if (!date) {
    return <p className="muted">Choose a date above to see available times.</p>;
  }
  if (loading) return <LoadingMessage>Checking available times…</LoadingMessage>;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  if (!slots || slots.length === 0) {
    return (
      <p className="empty-state">
        No times are available on {formatDateLong(date)}. Please choose another date.
      </p>
    );
  }

  return (
    <>
      <p className="muted small">Start times on {formatDateLong(date)}</p>
      <div className="slot-grid">
        {slots.map((slot) => {
          const selected = selectedSlot?.startTime === slot.startTime;
          return (
            <button
              key={slot.startTime}
              type="button"
              className={`slot-btn ${selected ? "is-selected" : ""}`}
              aria-pressed={selected}
              aria-label={`Start at ${slot.startTime}, finish about ${slot.endTime}`}
              onClick={() => onSelect(slot)}
            >
              {slot.startTime}
            </button>
          );
        })}
      </div>
      {selectedSlot && (
        <p className="slot-note">Estimated finish time: {selectedSlot.endTime}</p>
      )}
    </>
  );
}