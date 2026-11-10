import { STEPS } from "../../hooks/bookingFlowReducer";

export default function ProgressSteps({ currentStep }) {
  return (
    <nav aria-label="Booking progress" className="progress">
      <ol className="progress-steps">
        {STEPS.map((step, index) => {
          const status =
            index < currentStep ? "done" : index === currentStep ? "current" : "upcoming";
          return (
            <li
              key={step.id}
              className={`progress-step is-${status}`}
              aria-current={status === "current" ? "step" : undefined}
            >
              <span className="progress-dot">{status === "done" ? "✓" : index + 1}</span>
            </li>
          );
        })}
      </ol>
      <p className="progress-label">
        Step {currentStep + 1} of {STEPS.length} · {STEPS[currentStep].label}
      </p>
    </nav>
  );
}