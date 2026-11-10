import { STEP_INDEX } from "../../hooks/bookingFlowReducer";
import { formatDateLong } from "../../utils/dateUtils";
import { formatDuration, formatPrice } from "../../utils/formatters";
import DetailList from "../DetailList";

function Section({ title, onChange, rows }) {
  return (
    <section className="summary-section">
      <div className="summary-section-header">
        <h2 className="section-title">{title}</h2>
        <button type="button" className="btn-link" onClick={onChange}>
          Change
        </button>
      </div>
      <DetailList rows={rows} />
    </section>
  );
}

export default function BookingSummary({ service, option, date, slot, details, onEdit }) {
  return (
    <>
      <Section
        title="Hairstyle"
        onChange={() => onEdit(STEP_INDEX.service)}
        rows={[
          { label: "Style", value: service.name },
          { label: "Option", value: option.name },
          { label: "Price", value: formatPrice(option.price) },
          { label: "Estimated duration", value: formatDuration(option.durationMinutes) },
        ]}
      />
      <Section
        title="Appointment"
        onChange={() => onEdit(STEP_INDEX.datetime)}
        rows={[
          { label: "Date", value: formatDateLong(date) },
          { label: "Start time", value: slot.startTime },
          { label: "Estimated finish", value: slot.endTime },
        ]}
      />
      <Section
        title="Your details"
        onChange={() => onEdit(STEP_INDEX.details)}
        rows={[
          { label: "Name", value: details.name.trim() },
          { label: "Phone", value: details.phone.trim() },
          { label: "Notes", value: details.notes.trim() },
        ]}
      />
    </>
  );
}