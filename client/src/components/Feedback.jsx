export function LoadingMessage({ children = "Loading…" }) {
  return (
    <p className="status-message" role="status">
      {children}
    </p>
  );
}

export function ErrorMessage({ error, message, onRetry }) {
  const text = message || error?.message || "Something went wrong. Please try again.";

  return (
    <div className="alert alert-error" role="alert">
      <p>{text}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-small" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}