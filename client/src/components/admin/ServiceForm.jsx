import { useState } from "react";

export default function ServiceForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!values.name.trim()) return setError("Please enter a name.");

    setBusy(true);
    setError(null);
    try {
      await onSubmit({ name: values.name.trim(), description: values.description.trim() });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="svc-name">Name</label>
        <input
          id="svc-name"
          type="text"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="svc-desc">
          Description <span className="muted">(optional)</span>
        </label>
        <textarea
          id="svc-desc"
          rows={2}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
        />
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