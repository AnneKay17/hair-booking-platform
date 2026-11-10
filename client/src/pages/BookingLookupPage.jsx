import { useState } from "react";
import { Link } from "react-router-dom";
import { getBookingByReference } from "../services/bookingsApi";
import {
  isPlausibleBookingReference,
  normalizeBookingReference,
} from "../utils/validation";
import BookingDetailsCard from "../components/booking/BookingDetailsCard";
import { ErrorMessage } from "../components/Feedback";

export default function BookingLookupPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState({ status: "idle", booking: null, error: null });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (result.status === "loading") return;

    const reference = normalizeBookingReference(input);
    if (!isPlausibleBookingReference(reference)) {
      setResult({
        status: "error",
        booking: null,
        error: "Please enter your booking reference, for example HB-4K9X2R.",
      });
      return;
    }

    setResult({ status: "loading", booking: null, error: null });

    try {
      const booking = await getBookingByReference(reference);
      setResult({ status: "found", booking, error: null });
    } catch (err) {
      setResult({
        status: "error",
        booking: null,
        error:
          err.status === 404
            ? "We couldn't find a booking with that reference. Please check it and try again."
            : err.message,
      });
    }
  };

  return (
    <section className="card">
      <h1 className="page-title">Find my booking</h1>
      <p className="step-intro">Enter the booking reference you received when you booked.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="bookingReference">Booking reference</label>
          <input
            id="bookingReference"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="HB-4K9X2R"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={result.status === "loading" || !input.trim()}
        >
          {result.status === "loading" ? "Looking…" : "Find booking"}
        </button>
      </form>

      {result.status === "error" && <ErrorMessage message={result.error} />}

      {result.status === "found" && (
        <div className="lookup-result">
          <BookingDetailsCard booking={result.booking} />
        </div>
      )}

      <p className="muted small">
        <Link to="/">Book an appointment</Link>
      </p>
    </section>
  );
}