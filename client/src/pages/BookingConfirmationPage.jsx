import { Link, useLocation, useParams } from "react-router-dom";
import useApiData from "../hooks/useApiData";
import { getBookingByReference } from "../services/bookingsApi";
import BookingDetailsCard from "../components/booking/BookingDetailsCard";
import { ErrorMessage, LoadingMessage } from "../components/Feedback";

export default function BookingConfirmationPage() {
  const { reference } = useParams();
  const { state } = useLocation();

  const stateBooking = state?.booking?.bookingReference === reference ? state.booking : null;

  const { data, loading, error } = useApiData(() => getBookingByReference(reference), [reference], {
    enabled: !stateBooking,
  });

  const booking = stateBooking ?? data;

  if (loading) {
    return (
      <section className="card">
        <LoadingMessage>Loading your booking…</LoadingMessage>
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="card">
        <h1 className="page-title">Booking not found</h1>
        <ErrorMessage
          message={
            error?.status === 404
              ? "We couldn't find a booking with that reference."
              : error?.message
          }
        />
        <Link to="/" className="btn btn-primary">
          Make a booking
        </Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h1 className="page-title">
        {booking.status === "Pending" ? "Booking request received" : "Your booking"}
      </h1>
      <BookingDetailsCard booking={booking} />
      <Link to="/" className="btn btn-secondary">
        Book another appointment
      </Link>
    </section>
  );
}