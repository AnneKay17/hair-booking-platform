import { useMemo, useState } from "react";
import { ErrorMessage, LoadingMessage } from "../../components/Feedback";
import AvailabilityForm from "../../components/admin/AvailabilityForm";
import useApiData from "../../hooks/useApiData";
import useConfirmDialog from "../../hooks/useConfirmDialog";
import {
  createAvailability,
  deleteAvailability,
  listAvailability,
  updateAvailability,
} from "../../services/adminApi";
import { formatDateLong, getTodayString } from "../../utils/dateUtils";

export default function AdminAvailabilityPage() {
  const { data, loading, error, reload } = useApiData(() => listAvailability({}), []);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { confirm, dialog } = useConfirmDialog();

  const byDate = useMemo(() => {
    const groups = new Map();
    (data ?? []).forEach((period) => {
      if (!groups.has(period.date)) groups.set(period.date, []);
      groups.get(period.date).push(period);
    });
    return [...groups.entries()];
  }, [data]);

  const handleRemove = (period) =>
    confirm({
      title: "Remove availability?",
      message: `${formatDateLong(period.date)}, ${period.startTime}–${period.endTime}. Customers will no longer be able to book this time.`,
      confirmLabel: "Remove",
      danger: true,
      action: async () => {
        await deleteAvailability(period.id);
        reload();
      },
    });

  return (
    <>
      <h1 className="page-title">Availability</h1>
      <p className="step-intro">Add the days and hours you can take appointments. Customers can only book inside these times.</p>

      {adding ? (
        <section className="card">
          <h2 className="section-title">Add availability</h2>
          <AvailabilityForm
            initial={{ date: getTodayString(), startTime: "09:00", endTime: "17:00" }}
            submitLabel="Add"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              await createAvailability(values);
              setAdding(false);
              reload();
            }}
          />
        </section>
      ) : (
        <button type="button" className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
          + Add availability
        </button>
      )}

      {error && <ErrorMessage error={error} onRetry={reload} />}
      {loading && !data && <LoadingMessage>Loading availability…</LoadingMessage>}

      {data && byDate.length === 0 && (
        <p className="empty-state">No upcoming availability. Customers can't book until you add some.</p>
      )}

      <div className="availability-list">
        {byDate.map(([date, periods]) => (
          <section key={date} className="card availability-day">
            <h2 className="section-title">{formatDateLong(date)}</h2>
            {periods.map((period) =>
              editingId === period.id ? (
                <AvailabilityForm
                  key={period.id}
                  initial={{ date: period.date, startTime: period.startTime, endTime: period.endTime }}
                  submitLabel="Save changes"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (values) => {
                    await updateAvailability(period.id, values);
                    setEditingId(null);
                    reload();
                  }}
                />
              ) : (
                <div key={period.id} className="availability-row">
                  <span className="availability-time">
                    {period.startTime} – {period.endTime}
                  </span>
                  <span className="option-actions">
                    <button type="button" className="btn-link" onClick={() => setEditingId(period.id)}>
                      Edit
                    </button>
                    <button type="button" className="btn-link" onClick={() => handleRemove(period)}>
                      Remove
                    </button>
                  </span>
                </div>
              )
            )}
          </section>
        ))}
      </div>
      {dialog}
    </>
  );
}