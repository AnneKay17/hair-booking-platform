import { NAME_MAX, NOTES_MAX, PHONE_MAX } from "../../utils/validation";

export default function CustomerDetails({ details, errors, onChange }) {
  return (
    <div className="fields">
      <div className="field">
        <label htmlFor="customerName">Your name</label>
        <input
          id="customerName"
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX}
          value={details.name}
          onChange={(event) => onChange({ name: event.target.value })}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "customerName-error" : undefined}
        />
        {errors.name && (
          <p id="customerName-error" className="field-error">
            {errors.name}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="customerPhone">Phone number</label>
        <input
          id="customerPhone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={PHONE_MAX}
          value={details.phone}
          onChange={(event) => onChange({ phone: event.target.value })}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "customerPhone-error" : "customerPhone-hint"}
        />
        {errors.phone ? (
          <p id="customerPhone-error" className="field-error">
            {errors.phone}
          </p>
        ) : (
          <p id="customerPhone-hint" className="field-hint">
            So we can contact you about your booking.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="customerNotes">
          Notes <span className="muted">(optional)</span>
        </label>
        <textarea
          id="customerNotes"
          rows={3}
          maxLength={NOTES_MAX}
          value={details.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          aria-invalid={Boolean(errors.notes)}
        />
        <p className="field-hint">
          {details.notes.length}/{NOTES_MAX}
        </p>
        {errors.notes && <p className="field-error">{errors.notes}</p>}
      </div>
    </div>
  );
}