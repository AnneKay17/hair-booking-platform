import Availability from "../models/Availability.js";
import Booking from "../models/Booking.js";
import { AppError } from "../utils/AppError.js";
import {
  getTodayDateString,
  isPastDate,
  isValidDateString,
  timeToMinutes,
} from "../utils/timeUtils.js";
import { mergePeriods } from "./slotService.js";
import { BLOCKING_STATUSES } from "./bookingConflict.service.js";

const serialize = (a) => ({
  id: a._id.toString(),
  date: a.date,
  startTime: a.startTime,
  endTime: a.endTime,
  status: a.status,
});

const assertAvailableStatus = (status) => {
  if (status !== undefined && status !== "available") {
    throw new AppError(
      'Only "available" periods are supported. To free up time, shorten or remove availability instead.',
      400
    );
  }
};

const isCovered = (ranges, start, end) => ranges.some((r) => r.start <= start && r.end >= end);

const windowsOnDate = (businessId, date) =>
  Availability.find({ businessId, date, status: "available" }).lean();

/**
 * Blocks changes that would push a Pending/Confirmed booking outside her
 * available hours. Only bookings that are covered NOW and would stop being
 * covered count, so unrelated old inconsistencies never block an edit.
 */
const assertNoStrandedBookings = async ({ businessId, date, windowsBefore, windowsAfter }) => {
  const before = mergePeriods(windowsBefore);
  const after = mergePeriods(windowsAfter);

  const bookings = await Booking.find({ businessId, date, status: { $in: BLOCKING_STATUSES } })
    .sort({ startTime: 1 })
    .lean();

  const stranded = bookings.filter((b) => {
    const start = timeToMinutes(b.startTime);
    const end = timeToMinutes(b.endTime);
    return isCovered(before, start, end) && !isCovered(after, start, end);
  });
  if (stranded.length === 0) return;

  const shown = stranded
    .slice(0, 5)
    .map((b) => `${b.bookingReference} (${b.startTime}–${b.endTime}, ${b.customerName}, ${b.status})`)
    .join("; ");
  const more = stranded.length > 5 ? ` and ${stranded.length - 5} more` : "";
  const noun = stranded.length === 1 ? "booking" : "bookings";

  throw new AppError(
    `This change would leave ${stranded.length} active ${noun} outside your available hours on ${date}: ${shown}${more}. ` +
      `Cancel or reject ${stranded.length === 1 ? "it" : "them"} first, or choose different hours.`,
    409
  );
};

const assertNoOverlap = async ({ businessId, date, startTime, endTime, excludeId }) => {
  const sameDay = await Availability.find({
    businessId,
    date,
    status: "available",
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const clash = sameDay.find(
    (w) => start < timeToMinutes(w.endTime) && end > timeToMinutes(w.startTime)
  );

  if (clash) {
    throw new AppError(
      `This overlaps your existing availability on ${date} (${clash.startTime}–${clash.endTime}). Edit that period instead.`,
      409
    );
  }
};

export const findAvailability = async ({ businessId, query }) => {
  const startDate = query.startDate ?? getTodayDateString();
  const { endDate } = query;

  if (!isValidDateString(startDate)) throw new AppError("Invalid startDate", 400);
  if (endDate !== undefined && !isValidDateString(endDate)) throw new AppError("Invalid endDate", 400);

  const periods = await Availability.find({
    businessId,
    status: "available",
    date: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) },
  }).sort({ date: 1, startTime: 1 });

  return periods.map(serialize);
};

export const addAvailability = async ({ businessId, body }) => {
  const { date, startTime, endTime, status } = body;
  assertAvailableStatus(status);

  const doc = new Availability({ businessId, date, startTime, endTime, status: "available" });
  await doc.validate();

  if (isPastDate(date)) throw new AppError("You can't add availability on a past date", 400);
  await assertNoOverlap({ businessId, date, startTime, endTime });

  await doc.save();
  return serialize(doc);
};

export const editAvailability = async ({ businessId, id, body }) => {
  const doc = await Availability.findOne({ _id: id, businessId });
  if (!doc) throw new AppError("Availability period not found", 404);
  if (doc.status !== "available") throw new AppError("Only available periods can be edited", 400);
  assertAvailableStatus(body.status);

  const oldDate = doc.date;
  for (const field of ["date", "startTime", "endTime"]) {
    if (body[field] !== undefined) doc[field] = body[field];
  }
  await doc.validate();

  if (isPastDate(oldDate) || isPastDate(doc.date)) {
    throw new AppError("Past availability can't be edited", 400);
  }
  await assertNoOverlap({
    businessId,
    date: doc.date,
    startTime: doc.startTime,
    endTime: doc.endTime,
    excludeId: doc._id,
  });

  // Hours the OLD date had before, versus what remains after this change.
  const windowsBefore = await windowsOnDate(businessId, oldDate);
  const others = windowsBefore.filter((w) => w._id.toString() !== doc.id);
  const windowsAfter =
    doc.date === oldDate ? [...others, { startTime: doc.startTime, endTime: doc.endTime }] : others;

  await assertNoStrandedBookings({ businessId, date: oldDate, windowsBefore, windowsAfter });

  await doc.save();
  return serialize(doc);
};

export const removeAvailability = async ({ businessId, id }) => {
  const doc = await Availability.findOne({ _id: id, businessId });
  if (!doc) throw new AppError("Availability period not found", 404);

  const windowsBefore = await windowsOnDate(businessId, doc.date);
  const windowsAfter = windowsBefore.filter((w) => w._id.toString() !== doc.id);

  await assertNoStrandedBookings({ businessId, date: doc.date, windowsBefore, windowsAfter });

  await doc.deleteOne();
  return { id: doc.id };
};