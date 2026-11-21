import { formatDateShort } from "../../utils/dateUtils";
import { formatDuration, formatPrice } from "../../utils/formatters";

const ACTIONS = {
  Confirmed: { label: "Confirm", className: "btn-primary" },
  Rejected: { label: "Reject", className: "btn-danger" },
  Cancelled: { label: "Cancel", className: "btn-danger" },
  Completed: { label: "Mark completed", className: "btn-primary" },
};

export default function BookingCard({ booking, onAction }) {
  return (
    <article className="booking-card">
      <div className="booking-card-head">
        <div>
          <p className="booking-when">
            {formatDateShort(booking.date)} · {booking.startTime}–{booking.endTime}
          </p>
          <p className="booking-who">{booking.customerName}</p>
        </div>
        <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
      </div>

      <p className="booking-line">
        {booking.serviceName} · {booking.serviceOptionName}
      </p>
      <p className="booking-line muted">
        {formatPrice(booking.price)} · {formatDuration(booking.durationMinutes)}
      </p>
      <p className="booking-line">
        <a href={`tel:${booking.customerPhone.replace(/\s+/g, "")}`}>{booking.customerPhone}</a>
      </p>
      {booking.notes && <p className="booking-notes">“{booking.notes}”</p>}
      <p className="booking-ref muted small">Ref {booking.bookingReference}</p>

      {booking.allowedActions.length > 0 && (
        <div className="booking-actions">
          {booking.allowedActions.map((status) => (
            <button
              key={status}
              type="button"
              className={`btn btn-small ${ACTIONS[status].className}`}
              onClick={() => onAction(booking, status)}
            >
              {ACTIONS[status].label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}