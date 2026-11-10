import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import BookingPage from "./pages/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import BookingLookupPage from "./pages/BookingLookupPage";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/confirmation/:reference" element={<BookingConfirmationPage />} />
        <Route path="/find-booking" element={<BookingLookupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}