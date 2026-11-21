import { Outlet } from "react-router-dom";
import "../../admin.css";
import { AuthProvider } from "../../context/AuthContext";

export default function AdminRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}