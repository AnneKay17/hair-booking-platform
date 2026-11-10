export default function StepActions({
  onBack,
  backLabel = "Back",
  onNext,
  nextLabel = "Continue",
  nextType = "button",
  nextDisabled = false,
  loading = false,
}) {
  const showNext = nextType === "submit" || Boolean(onNext);

  return (
    <div className="step-actions">
      {onBack && (
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={loading}>
          {backLabel}
        </button>
      )}
      {showNext && (
        <button
          type={nextType}
          className="btn btn-primary"
          onClick={nextType === "button" ? onNext : undefined}
          disabled={nextDisabled || loading}
        >
          {loading ? "Please wait…" : nextLabel}
        </button>
      )}
    </div>
  );
}