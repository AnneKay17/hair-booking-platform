import { ErrorMessage, LoadingMessage } from "../../components/Feedback";
import BookingList from "../../components/admin/BookingList";
import useApiData from "../../hooks/useApiData";
import { getDashboard } from "../../services/adminApi";
import { formatDateLong } from "../../utils/dateUtils";

function Section({ title, count, children }) {
  return (
    <section className="admin-section">
      <h2 className="section-title">
        {title} {count !== undefined && <span className="muted">({count})</span>}
      </h2>
      {children}
    </section>
  );
}

export default function AdminDashboardPage() {
  const { data, loading, error, reload } = useApiData(getDashboard, []);

  if (loading && !data) return <LoadingMessage>Loading dashboard…</LoadingMessage>;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  return (
    <>
      <h1 className="page-title">{formatDateLong(data.today)}</h1>

      <div className="tiles">
        <div className="tile">
          <span className="tile-number">{data.counts.today}</span>
          <span className="tile-label">Today</span>
        </div>
        <div className={`tile ${data.counts.pending > 0 ? "tile-attention" : ""}`}>
          <span className="tile-number">{data.counts.pending}</span>
          <span className="tile-label">Need a reply</span>
        </div>
        <div className="tile">
          <span className="tile-number">{data.counts.upcomingConfirmed}</span>
          <span className="tile-label">Upcoming</span>
        </div>
      </div>

      <Section title="Needs your attention" count={data.counts.pending}>
        <BookingList
          bookings={data.pending}
          onChanged={reload}
          emptyText="Nothing waiting. You're all caught up."
        />
      </Section>

      <Section title="Today's bookings" count={data.counts.today}>
        <BookingList bookings={data.todaysBookings} onChanged={reload} emptyText="No bookings today." />
      </Section>

      <Section title="Upcoming confirmed">
        <BookingList
          bookings={data.upcomingConfirmed}
          onChanged={reload}
          emptyText="No confirmed bookings coming up."
        />
      </Section>

      <Section title="Recent requests">
        <BookingList bookings={data.recent} onChanged={reload} emptyText="No bookings yet." />
      </Section>
    </>
  );
}