import { Link } from "react-router-dom";

const BUSINESS_NAME = import.meta.env.VITE_BUSINESS_NAME || "Hair Studio";

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          {BUSINESS_NAME}
        </Link>
        <Link to="/find-booking" className="header-link">
          Find my booking
        </Link>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}