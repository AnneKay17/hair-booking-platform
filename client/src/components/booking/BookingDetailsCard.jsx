import { formatDateLong } from "../../utils/dateUtils";
import { formatDuration, formatPrice } from "../../utils/formatters";
import DetailList from "../DetailList";

const NEXT_STEPS = {
  Pending:
    "Your request has been received and is waiting to be reviewed. This time is held for you, but it is not confirmed yet. Keep your booking reference. You can use it on this site to check your booking status at any time.",
  Confirmed: "Your booking is confirmed. We look forward to seeing you.",
  Rejected:
    "Unfortunately this request couldn't be accepted. You're welcome to book a different time.",
  Cancelled: "This booking has been cancelled. You're welcome to book a new time.",
  Completed: "This appointment has been completed. Thank you!",
};

export default function BookingDetailsCard({ booking }) {
  const rows = [
    { label: "Booking reference", value: booking.bookingReference },
    { label: "Style", value: booking.service },
    { label: "Option", value: booking.option },
    { label: "Price", value: formatPrice(booking.price) },
    { label: "Date", value: formatDateLong(booking.date) },
    { label: "Time", value: `${booking.startTime} – ${booking.endTime}` },
    { label: "Duration", value: formatDuration(booking.durationMinutes) },
    { label: "Name", value: booking.customerName },
  ];

  return (
    <div>
      <p>
        <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
      </p>
      <DetailList rows={rows} />
      {NEXT_STEPS[booking.status] && <p className="next-steps">{NEXT_STEPS[booking.status]}</p>}
    </div>
  );
}