import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import useApiData from "../hooks/useApiData";
import useBookingFlow from "../hooks/useBookingFlow";
import { STEP_INDEX } from "../hooks/bookingFlowReducer";
import { getServices } from "../services/servicesApi";
import { createBooking } from "../services/bookingsApi";
import { validateCustomerDetails } from "../utils/validation";

import { ErrorMessage, LoadingMessage } from "../components/Feedback";
import ProgressSteps from "../components/booking/ProgressSteps";
import ServiceSelection from "../components/booking/ServiceSelection";
import OptionSelection from "../components/booking/OptionSelection";
import DateSelection from "../components/booking/DateSelection";
import TimeSlotSelection from "../components/booking/TimeSlotSelection";
import CustomerDetails from "../components/booking/CustomerDetails";
import BookingSummary from "../components/booking/BookingSummary";
import StepActions from "../components/booking/StepActions";

const STEP_TITLES = [
  "Choose your style",
  "Choose an option",
  "Pick a date and time",
  "Your details",
  "Review your booking",
];

export default function BookingPage() {
  const navigate = useNavigate();
  const [state, actions] = useBookingFlow();
  const [detailErrors, setDetailErrors] = useState({});
  const submitLock = useRef(false); // blocks double-submits even before a re-render

  const { data: services, loading, error, reload } = useApiData(getServices, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.step]);

  const handleDetailsChange = (changes) => {
    actions.setDetails(changes);
    setDetailErrors((previous) => {
      const next = { ...previous };
      Object.keys(changes).forEach((key) => delete next[key]);
      return next;
    });
  };

  const handleDetailsSubmit = (event) => {
    event.preventDefault();
    const errors = validateCustomerDetails(state.details);
    setDetailErrors(errors);
    if (Object.keys(errors).length === 0) actions.goToStep(STEP_INDEX.review);
  };

  const handleSubmit = async () => {
    if (submitLock.current) return;
    submitLock.current = true;
    actions.submitStart();

    try {
      // Price, duration, end time, status and reference are NOT sent:
      // the backend calculates and validates all of them.
      const booking = await createBooking({
        serviceId: state.service.id,
        serviceOptionId: state.option.id,
        date: state.date,
        startTime: state.slot.startTime,
        customerName: state.details.name.trim(),
        customerPhone: state.details.phone.trim(),
        notes: state.details.notes.trim(),
      });

      navigate(`/confirmation/${booking.bookingReference}`, {
        replace: true,
        state: { booking },
      });
    } catch (err) {
      if (err.status === 409) actions.submitConflict();
      else actions.submitFailed(err.message);
    } finally {
      submitLock.current = false;
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case STEP_INDEX.service:
        if (loading) return <LoadingMessage>Loading services…</LoadingMessage>;
        if (error) return <ErrorMessage error={error} onRetry={reload} />;
        return (
          <ServiceSelection
            services={services}
            selectedId={state.service?.id}
            onSelect={actions.selectService}
          />
        );

      case STEP_INDEX.option:
        return (
          <>
            <OptionSelection
              service={state.service}
              selectedId={state.option?.id}
              onSelect={actions.selectOption}
            />
            <StepActions onBack={() => actions.goToStep(STEP_INDEX.service)} />
          </>
        );

      case STEP_INDEX.datetime:
        return (
          <>
            {state.conflict && (
              <div className="alert alert-error" role="alert">
                Sorry, that time was just taken by another booking. Please choose a different
                time.
              </div>
            )}
            <h2 className="section-title">Date</h2>
            <DateSelection
              serviceOptionId={state.option.id}
              selectedDate={state.date}
              onSelect={actions.selectDate}
              refreshKey={state.refreshKey}
            />
            <h2 className="section-title">Time</h2>
            <TimeSlotSelection
              serviceOptionId={state.option.id}
              date={state.date}
              selectedSlot={state.slot}
              onSelect={actions.selectSlot}
              refreshKey={state.refreshKey}
            />
            <StepActions
              onBack={() => actions.goToStep(STEP_INDEX.option)}
              onNext={() => actions.goToStep(STEP_INDEX.details)}
              nextDisabled={!state.date || !state.slot}
            />
          </>
        );

      case STEP_INDEX.details:
        return (
          <form onSubmit={handleDetailsSubmit} noValidate>
            <CustomerDetails
              details={state.details}
              errors={detailErrors}
              onChange={handleDetailsChange}
            />
            <StepActions
              onBack={() => actions.goToStep(STEP_INDEX.datetime)}
              nextType="submit"
              nextLabel="Review booking"
            />
          </form>
        );

      case STEP_INDEX.review:
        return (
          <>
            <BookingSummary
              service={state.service}
              option={state.option}
              date={state.date}
              slot={state.slot}
              details={state.details}
              onEdit={actions.goToStep}
            />
            <p className="muted small">
              Your request is checked against the latest availability when you submit. The final
              price and finish time are confirmed by our system.
            </p>
            {state.submitError && (
              <div className="alert alert-error" role="alert">
                {state.submitError}
              </div>
            )}
            <StepActions
              onBack={() => actions.goToStep(STEP_INDEX.details)}
              onNext={handleSubmit}
              nextLabel="Request booking"
              loading={state.submitting}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <section className="card">
      <ProgressSteps currentStep={state.step} />
      <h1 className="page-title">{STEP_TITLES[state.step]}</h1>
      {renderStep()}
    </section>
  );
}