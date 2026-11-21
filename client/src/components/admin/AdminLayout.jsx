import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const NAV = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/availability", label: "Availability" },
  { to: "/admin/services", label: "Services" },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-topbar">
            <span className="admin-brand">Admin</span>
            <span className="muted small admin-email">{admin?.email}</span>
            <button type="button" className="btn btn-secondary btn-small" onClick={logout}>
              Log out
            </button>
          </div>
          <nav className="admin-nav" aria-label="Admin">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}