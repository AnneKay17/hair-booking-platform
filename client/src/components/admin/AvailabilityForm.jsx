import { useState } from "react";
import { getTodayString } from "../../utils/dateUtils";

export default function AvailabilityForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (changes) => setValues((current) => ({ ...current, ...changes }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!values.date || !values.startTime || !values.endTime) {
      return setError("Please fill in the date, start time and end time.");
    }
    if (values.startTime >= values.endTime) {
      return setError("The end time must be after the start time.");
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="av-date">Date</label>
        <input
          id="av-date"
          type="date"
          min={getTodayString()}
          value={values.date}
          onChange={(e) => set({ date: e.target.value })}
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="av-start">Start</label>
          <input
            id="av-start"
            type="time"
            step="1800"
            value={values.startTime}
            onChange={(e) => set({ startTime: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="av-end">End</label>
          <input
            id="av-end"
            type="time"
            step="1800"
            value={values.endTime}
            onChange={(e) => set({ endTime: e.target.value })}
          />
        </div>
      </div>
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