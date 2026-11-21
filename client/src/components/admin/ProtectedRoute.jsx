import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AdminLayout from "./AdminLayout";

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <p className="status-message admin-center">Loading…</p>;
  if (status === "anonymous") {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <AdminLayout />;
}