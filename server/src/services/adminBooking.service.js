import Booking, { BOOKING_STATUSES } from "../models/Booking.js";
import { AppError } from "../utils/AppError.js";
import {
  getCurrentTimeMinutes,
  getTodayDateString,
  isValidDateString,
  timeToMinutes,
} from "../utils/timeUtils.js";

export const TRANSITIONS = {
  Pending: ["Confirmed", "Rejected", "Cancelled"],
  Confirmed: ["Cancelled", "Completed"],
  Rejected: [],
  Cancelled: [],
  Completed: [],
};

const MAX_LIMIT = 100;
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const hasAppointmentStarted = ({ date, startTime }) => {
  const today = getTodayDateString();
  if (date < today) return true;
  if (date > today) return false;
  return timeToMinutes(startTime) <= getCurrentTimeMinutes();
};

/** Statuses this booking may move to right now ("Completed" only once it has started). */
export const getAllowedStatusChanges = (booking) =>
  TRANSITIONS[booking.status].filter(
    (status) => status !== "Completed" || hasAppointmentStarted(booking)
  );

export const serializeAdminBooking = (booking) => ({
  id: booking._id.toString(),
  bookingReference: booking.bookingReference,
  status: booking.status,
  customerName: booking.customerName,
  customerPhone: booking.customerPhone,
  serviceName: booking.serviceName,
  serviceOptionName: booking.serviceOptionName,
  price: booking.price,
  durationMinutes: booking.durationMinutes,
  date: booking.date,
  startTime: booking.startTime,
  endTime: booking.endTime,
  notes: booking.notes,
  createdAt: booking.createdAt,
  allowedActions: getAllowedStatusChanges(booking),
});

export const findBookings = async ({ businessId, query }) => {
  const { status, date, search } = query;
  const when = query.when ?? "upcoming";
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), MAX_LIMIT);

  const filter = { businessId };
  let sort;

  if (status) {
    if (!BOOKING_STATUSES.includes(status)) throw new AppError("Invalid status filter", 400);
    filter.status = status;
  }

  if (date) {
    if (!isValidDateString(date)) throw new AppError("date must be a valid YYYY-MM-DD date", 400);
    filter.date = date;
    sort = { startTime: 1 };
  } else {
    const today = getTodayDateString();
    if (when === "upcoming") {
      filter.date = { $gte: today };
      sort = { date: 1, startTime: 1 };
    } else if (when === "past") {
      filter.date = { $lt: today };
      sort = { date: -1, startTime: -1 };
    } else if (when === "all") {
      sort = { date: -1, startTime: -1 };
    } else {
      throw new AppError("when must be upcoming, past or all", 400);
    }
  }

  const term = typeof search === "string" ? search.trim().slice(0, 50) : "";
  if (term) {
    const pattern = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ customerName: pattern }, { customerPhone: pattern }, { bookingReference: pattern }];
  }

  const [items, total] = await Promise.all([
    Booking.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);

  return { items: items.map(serializeAdminBooking), total, page, limit };
};

export const findBookingById = async ({ businessId, id }) => {
  const booking = await Booking.findOne({ _id: id, businessId }).lean();
  if (!booking) throw new AppError("Booking not found", 404);
  return serializeAdminBooking(booking);
};

export const changeBookingStatus = async ({ businessId, id, status }) => {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${BOOKING_STATUSES.join(", ")}`, 400);
  }

  const booking = await Booking.findOne({ _id: id, businessId });
  if (!booking) throw new AppError("Booking not found", 404);

  if (!TRANSITIONS[booking.status].includes(status)) {
    throw new AppError(`A ${booking.status} booking cannot be changed to ${status}.`, 409);
  }
  if (status === "Completed" && !hasAppointmentStarted(booking)) {
    throw new AppError("This appointment hasn't started yet, so it can't be marked completed.", 409);
  }

  // Atomic: only updates if the status is still what we just read, so two
  // simultaneous taps cannot both succeed.
  const updated = await Booking.findOneAndUpdate(
    { _id: id, businessId, status: booking.status },
    { status },
    { new: true }
  ).lean();

  if (!updated) {
    throw new AppError("This booking was just changed. Please refresh and try again.", 409);
  }
  return serializeAdminBooking(updated);
};

export const getDashboardData = async ({ businessId }) => {
  const today = getTodayDateString();
  const base = { businessId };
  const upcomingFilter = { ...base, status: "Confirmed", date: { $gt: today } };

  const [todays, pending, pendingCount, upcoming, upcomingCount, recent] = await Promise.all([
    Booking.find({ ...base, date: today, status: { $in: ["Pending", "Confirmed", "Completed"] } })
      .sort({ startTime: 1 })
      .lean(),
    Booking.find({ ...base, status: "Pending" }).sort({ date: 1, startTime: 1 }).limit(50).lean(),
    Booking.countDocuments({ ...base, status: "Pending" }),
    Booking.find(upcomingFilter).sort({ date: 1, startTime: 1 }).limit(10).lean(),
    Booking.countDocuments(upcomingFilter),
    Booking.find(base).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  return {
    today,
    counts: { today: todays.length, pending: pendingCount, upcomingConfirmed: upcomingCount },
    todaysBookings: todays.map(serializeAdminBooking),
    pending: pending.map(serializeAdminBooking),
    upcomingConfirmed: upcoming.map(serializeAdminBooking),
    recent: recent.map(serializeAdminBooking),
  };
};