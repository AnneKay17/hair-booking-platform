import Booking from "../models/Booking.js";

// Only these statuses occupy a slot. Rejected/Cancelled bookings free it up;
// Completed bookings are historical and refer to a date that has passed.
const BLOCKING_STATUSES = ["Pending", "Confirmed"];

/**
 * @param {{ businessId: string, date: string, session?: import("mongoose").ClientSession }} params
 * @returns {Promise<{startTime:string,endTime:string}[]>}
 */
export const getBookedIntervals = async ({ businessId, date, session }) => {
  const bookings = await Booking.find(
    { businessId, date, status: { $in: BLOCKING_STATUSES } },
    "startTime endTime"
  )
    .session(session || null)
    .lean();

  return bookings.map((b) => ({ startTime: b.startTime, endTime: b.endTime }));
};