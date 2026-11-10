import { formatPrice } from "../../utils/formatters";

export default function ServiceSelection({ services, selectedId, onSelect }) {
  if (services.length === 0) {
    return (
      <p className="empty-state">
        There are no services available to book right now. Please check back soon.
      </p>
    );
  }

  return (
    <ul className="choice-list">
      {services.map((service) => {
        const bookable = service.options.length > 0;
        const startingPrice = bookable ? Math.min(...service.options.map((o) => o.price)) : null;
        const selected = service.id === selectedId;

        return (
          <li key={service.id}>
            <button
              type="button"
              className={`choice-card ${selected ? "is-selected" : ""}`}
              aria-pressed={selected}
              disabled={!bookable}
              onClick={() => onSelect(service)}
            >
              <span className="choice-main">
                <span className="choice-title">{service.name}</span>
                {service.description && <span className="choice-meta">{service.description}</span>}
              </span>
              <span className="choice-side">
                {bookable ? `from ${formatPrice(startingPrice)}` : "Unavailable"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}