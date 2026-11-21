
import { useEffect, useState } from "react";
import { ErrorMessage, LoadingMessage } from "../../components/Feedback";
import BookingList from "../../components/admin/BookingList";
import { listBookings } from "../../services/adminApi";

const PAGE_SIZE = 25;

const STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
  "Rejected",
];

export default function AdminBookingsPage() {
  const [query, setQuery] = useState({
    when: "upcoming",
    status: "",
    date: "",
    search: "",
    page: 1,
  });

  const [searchInput, setSearchInput] = useState("");

  const [result, setResult] = useState({
    items: [],
    total: 0,
    error: null,
    key: null,
  });

  const [reloadKey, setReloadKey] = useState(0);

  // Identify the currently requested data.
  const requestKey = JSON.stringify({ query, reloadKey });

  // Derive loading and error states.
  const loading = result.key !== requestKey;
  const error = result.key === requestKey ? result.error : null;

  // Debounce search input.
  useEffect(() => {
    const timer = setTimeout(() => {
      const search = searchInput.trim();

      setQuery((q) =>
        q.search === search
          ? q
          : { ...q, search, page: 1 }
      );
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch bookings whenever the query changes.
  useEffect(() => {
    let cancelled = false;

    const currentKey = JSON.stringify({ query, reloadKey });

    listBookings({ ...query, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;

        setResult((r) => ({
          items:
            query.page === 1
              ? data.items
              : [...r.items, ...data.items],
          total: data.total,
          error: null,
          key: currentKey,
        }));
      })
      .catch((error) => {
        if (cancelled) return;

        setResult((r) => ({
          ...r,
          error,
          key: currentKey,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [query, reloadKey]);

  // Update filters and reset pagination.
  const updateFilter = (changes) => {
    setQuery((q) => ({
      ...q,
      ...changes,
      page: 1,
    }));
  };

  // Reload bookings.
  const reload = () => {
    setQuery((q) => ({ ...q, page: 1 }));
    setReloadKey((k) => k + 1);
  };

  // Load the next page.
  const loadMore = () => {
    setQuery((q) => ({
      ...q,
      page: q.page + 1,
    }));
  };

  return (
    <>
      <h1 className="page-title">Bookings</h1>

      <div className="filters">
        <div className="field">
          <label htmlFor="f-search">Search</label>

          <input
            id="f-search"
            type="search"
            placeholder="Name, phone or reference"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="f-status">Status</label>

            <select
              id="f-status"
              value={query.status}
              onChange={(e) =>
                updateFilter({ status: e.target.value })
              }
            >
              <option value="">All</option>

              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="f-when">When</label>

            <select
              id="f-when"
              value={query.when}
              disabled={Boolean(query.date)}
              onChange={(e) =>
                updateFilter({ when: e.target.value })
              }
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="all">All dates</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="f-date">Specific day</label>

          <div className="inline-clear">
            <input
              id="f-date"
              type="date"
              value={query.date}
              onChange={(e) =>
                updateFilter({ date: e.target.value })
              }
            />

            {query.date && (
              <button
                type="button"
                className="btn-link"
                onClick={() => updateFilter({ date: "" })}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <ErrorMessage error={error} onRetry={reload} />
      )}

      {/* Initial loading state */}
      {loading && result.items.length === 0 && !error && (
        <LoadingMessage>
          Loading bookings…
        </LoadingMessage>
      )}

      {/* Booking results */}
      {!error && (!loading || result.items.length > 0) && (
        <>
          <p className="muted small">
            Showing {result.items.length} of {result.total}
          </p>

          <BookingList
            bookings={result.items}
            onChanged={reload}
            emptyText="No bookings match these filters."
          />

          {/* Load more */}
          {result.items.length < result.total && (
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </>
  );
}
