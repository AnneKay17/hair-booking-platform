import { useState } from "react";
import { createOption, updateOption, updateService } from "../../services/adminApi";
import { formatDuration, formatPrice } from "../../utils/formatters";
import OptionForm from "./OptionForm";
import ServiceForm from "./ServiceForm";

const EMPTY_OPTION = { name: "", price: "", durationMinutes: "" };

export default function ServiceCard({ service, onChanged, confirm }) {
  const [editingService, setEditingService] = useState(false);
  const [addingOption, setAddingOption] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState(null);

  const done = () => {
    setEditingService(false);
    setAddingOption(false);
    setEditingOptionId(null);
    onChanged();
  };

  const toggleService = () =>
    confirm({
      title: service.active ? `Deactivate ${service.name}?` : `Activate ${service.name}?`,
      message: service.active
        ? "Customers will no longer be able to book this style. Existing bookings are not affected."
        : "Customers will be able to book this style again (only its active options are shown).",
      confirmLabel: service.active ? "Deactivate" : "Activate",
      danger: service.active,
      action: async () => {
        await updateService(service.id, { active: !service.active });
        onChanged();
      },
    });

  const toggleOption = (option) =>
    confirm({
      title: option.active ? `Deactivate ${option.name}?` : `Activate ${option.name}?`,
      message: option.active
        ? "Customers will no longer be able to choose this option. Existing bookings are not affected."
        : "Customers will be able to choose this option again.",
      confirmLabel: option.active ? "Deactivate" : "Activate",
      danger: option.active,
      action: async () => {
        await updateOption(option.id, { active: !option.active });
        onChanged();
      },
    });

  return (
    <section className={`card service-card ${service.active ? "" : "is-inactive"}`}>
      {editingService ? (
        <ServiceForm
          initial={{ name: service.name, description: service.description || "" }}
          submitLabel="Save changes"
          onCancel={() => setEditingService(false)}
          onSubmit={async (values) => {
            await updateService(service.id, values);
            done();
          }}
        />
      ) : (
        <>
          <div className="service-head">
            <div>
              <h2 className="service-name">{service.name}</h2>
              {service.description && <p className="muted small">{service.description}</p>}
            </div>
            <span className={`badge ${service.active ? "badge-confirmed" : "badge-cancelled"}`}>
              {service.active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="booking-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditingService(true)}>
              Edit
            </button>
            <button
              type="button"
              className={`btn btn-small ${service.active ? "btn-danger" : "btn-primary"}`}
              onClick={toggleService}
            >
              {service.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </>
      )}

      <h3 className="options-title">Options</h3>
      {service.options.length === 0 && !addingOption && (
        <p className="muted small">No options yet. Customers can't book this style until you add one.</p>
      )}

      <ul className="option-list">
        {service.options.map((option) => (
          <li key={option.id} className={`option-row ${option.active ? "" : "is-inactive"}`}>
            {editingOptionId === option.id ? (
              <OptionForm
                showHistoryNote
                initial={{ name: option.name, price: String(option.price), durationMinutes: String(option.durationMinutes) }}
                submitLabel="Save changes"
                onCancel={() => setEditingOptionId(null)}
                onSubmit={async (values) => {
                  await updateOption(option.id, values);
                  done();
                }}
              />
            ) : (
              <>
                <div>
                  <p className="option-name">
                    {option.name} {!option.active && <span className="muted small">(inactive)</span>}
                  </p>
                  <p className="muted small">
                    {formatPrice(option.price)} · {formatDuration(option.durationMinutes)}
                  </p>
                </div>
                <div className="option-actions">
                  <button type="button" className="btn-link" onClick={() => setEditingOptionId(option.id)}>
                    Edit
                  </button>
                  <button type="button" className="btn-link" onClick={() => toggleOption(option)}>
                    {option.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {addingOption ? (
        <OptionForm
          initial={EMPTY_OPTION}
          submitLabel="Add option"
          onCancel={() => setAddingOption(false)}
          onSubmit={async (values) => {
            await createOption(service.id, values);
            done();
          }}
        />
      ) : (
        <button type="button" className="btn btn-secondary btn-small" onClick={() => setAddingOption(true)}>
          + Add option
        </button>
      )}
    </section>
  );
}