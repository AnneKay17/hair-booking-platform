import { formatDuration, formatPrice } from "../../utils/formatters";

export default function OptionSelection({ service, selectedId, onSelect }) {
  return (
    <>
      <p className="step-intro">
        Choose an option for <strong>{service.name}</strong>.
      </p>
      <ul className="choice-list">
        {service.options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <li key={option.id}>
              <button
                type="button"
                className={`choice-card ${selected ? "is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => onSelect(option)}
              >
                <span className="choice-main">
                  <span className="choice-title">{option.name}</span>
                  <span className="choice-meta">
                    About {formatDuration(option.durationMinutes)}
                  </span>
                </span>
                <span className="choice-side">{formatPrice(option.price)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}