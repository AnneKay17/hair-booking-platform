import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import BookingPage from "./pages/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import BookingLookupPage from "./pages/BookingLookupPage";
import AdminRoot from "./components/admin/AdminRoot";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import AdminAvailabilityPage from "./pages/admin/AdminAvailabilityPage";
import AdminServicesPage from "./pages/admin/AdminServicesPage";

function PublicLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<BookingPage />} />
        <Route path="/confirmation/:reference" element={<BookingConfirmationPage />} />
        <Route path="/find-booking" element={<BookingLookupPage />} />
      </Route>

      {/* The session check only runs inside this branch, so customers never trigger it. */}
      <Route element={<AdminRoot />}>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="availability" element={<AdminAvailabilityPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}