import { useEffect, useState } from "react";
import { getHealth } from "./services/apiClient";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    fontFamily: "system-ui, sans-serif",
  },
  card: { maxWidth: "26rem", width: "100%" },
  label: { fontSize: "0.875rem", color: "#666", margin: "0.25rem 0" },
};

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getHealth().then(setHealth).catch((err) => setError(err.message));
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1>Hair Booking Platform</h1>
        <p style={styles.label}>Phase 1 — foundation</p>

        {error && <p style={{ color: "#b00020" }}>API unreachable: {error}</p>}

        {health && (
          <>
            <p style={styles.label}>API status: {health.status}</p>
            <p style={styles.label}>Database: {health.database}</p>
            <p style={styles.label}>Environment: {health.environment}</p>
          </>
        )}

        {!health && !error && <p style={styles.label}>Checking API…</p>}
      </div>
    </main>
  );
}