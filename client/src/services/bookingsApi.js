import { api } from "./apiClient";

/**
 * Only identifying/customer fields are sent. The backend calculates price,
 * duration, end time, status and booking reference.
 */
export const createBooking = async (payload) => (await api.post("/bookings", payload)).data;

export const getBookingByReference = async (reference) =>
  (await api.get(`/bookings/${encodeURIComponent(reference)}`)).data;