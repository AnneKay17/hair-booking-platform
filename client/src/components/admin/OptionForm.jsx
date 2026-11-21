import { useState } from "react";
import { formatDuration } from "../../utils/formatters";

export default function OptionForm({ initial, submitLabel, onSubmit, onCancel, showHistoryNote }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (changes) => setValues((current) => ({ ...current, ...changes }));
  const minutes = Number(values.durationMinutes);
  const minutesValid = values.durationMinutes !== "" && Number.isInteger(minutes) && minutes > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const price = Number(values.price);

    if (!values.name.trim()) return setError("Please enter a name.");
    if (values.price === "" || !Number.isFinite(price) || price < 0) {
      return setError("Please enter a price of 0 or more.");
    }
    if (!minutesValid) return setError("Duration must be a whole number of minutes, above 0.");

    setBusy(true);
    setError(null);
    try {
      await onSubmit({ name: values.name.trim(), price, durationMinutes: minutes });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="opt-name">Option name</label>
        <input
          id="opt-name"
          type="text"
          placeholder="e.g. Short, Medium, Long"
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="opt-price">Price (R)</label>
          <input
            id="opt-price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => set({ price: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="opt-duration">Duration (minutes)</label>
          <input
            id="opt-duration"
            type="number"
            inputMode="numeric"
            min="1"
            step="5"
            value={values.durationMinutes}
            onChange={(e) => set({ durationMinutes: e.target.value })}
          />
          {minutesValid && <p className="field-hint">= {formatDuration(minutes)}</p>}
        </div>
      </div>
      {showHistoryNote && (
        <p className="muted small">Existing bookings keep the price and duration they were made with.</p>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}