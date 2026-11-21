import useConfirmDialog from "../../hooks/useConfirmDialog";
import { changeBookingStatus } from "../../services/adminApi";
import { formatDateShort } from "../../utils/dateUtils";
import BookingCard from "./BookingCard";

const COPY = {
  Confirmed: {
    title: "Confirm this booking?",
    confirmLabel: "Confirm booking",
    danger: false,
    extra: "The time stays reserved for the customer.",
  },
  Rejected: {
    title: "Reject this request?",
    confirmLabel: "Reject request",
    danger: true,
    extra: "The time becomes available to other customers again.",
  },
  Cancelled: {
    title: "Cancel this booking?",
    confirmLabel: "Cancel booking",
    danger: true,
    extra: "The time becomes available to other customers again.",
  },
  Completed: {
    title: "Mark as completed?",
    confirmLabel: "Mark completed",
    danger: false,
    extra: "The booking stays in your history.",
  },
};

const NOTE = "Customers aren't notified automatically yet, so contact them yourself.";

export default function BookingList({ bookings, onChanged, emptyText }) {
  const { confirm, dialog } = useConfirmDialog();

  const handleAction = (booking, status) => {
    const copy = COPY[status];
    confirm({
      title: copy.title,
      confirmLabel: copy.confirmLabel,
      danger: copy.danger,
      message: `${booking.customerName} · ${booking.serviceName} (${booking.serviceOptionName}) · ${formatDateShort(
        booking.date
      )} ${booking.startTime}. ${copy.extra}`,
      note: status === "Completed" ? undefined : NOTE,
      action: async () => {
        try {
          await changeBookingStatus(booking.id, status);
        } catch (err) {
          if (err.status === 409) onChanged(); // stale view: refresh behind the dialog
          throw err;
        }
        onChanged();
      },
    });
  };

  return (
    <>
      {bookings.length === 0 ? (
        <p className="empty-state">{emptyText}</p>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onAction={handleAction} />
          ))}
        </div>
      )}
      {dialog}
    </>
  );
}