import { useState } from "react";
import { ErrorMessage, LoadingMessage } from "../../components/Feedback";
import ServiceCard from "../../components/admin/ServiceCard";
import ServiceForm from "../../components/admin/ServiceForm";
import useApiData from "../../hooks/useApiData";
import useConfirmDialog from "../../hooks/useConfirmDialog";
import { createService, listServices } from "../../services/adminApi";

export default function AdminServicesPage() {
  const { data, loading, error, reload } = useApiData(listServices, []);
  const [adding, setAdding] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <h1 className="page-title">Services</h1>
      <p className="step-intro">
        Services are never deleted, only deactivated, so past bookings always keep their details.
      </p>

      {adding ? (
        <section className="card">
          <h2 className="section-title">Add a service</h2>
          <ServiceForm
            initial={{ name: "", description: "" }}
            submitLabel="Add service"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              await createService(values);
              setAdding(false);
              reload();
            }}
          />
        </section>
      ) : (
        <button type="button" className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
          + Add service
        </button>
      )}

      {error && <ErrorMessage error={error} onRetry={reload} />}
      {loading && !data && <LoadingMessage>Loading services…</LoadingMessage>}
      {data && data.length === 0 && <p className="empty-state">No services yet. Add your first one above.</p>}

      <div className="service-list">
        {(data ?? []).map((service) => (
          <ServiceCard key={service.id} service={service} onChanged={reload} confirm={confirm} />
        ))}
      </div>
      {dialog}
    </>
  );
}