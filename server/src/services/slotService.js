//The scheduling engine: a pure, unit-testable calculation function plus a DB-facing orchestrator. This is the only place slot logic lives.
import ServiceOption from "../models/ServiceOption.js";
import Service from "../models/Service.js";
import Availability from "../models/Availability.js";
import { AppError } from "../utils/AppError.js";
import {
  timeToMinutes,
  minutesToTime,
  isValidDateString,
  isPastDate,
} from "../utils/timeUtils.js";
import { getBookedIntervals } from "./bookingConflict.service.js";

const SLOT_INTERVAL_MINUTES = 30;

const mergePeriods = (periods) => {
  const sorted = periods
    .map((p) => ({ start: timeToMinutes(p.startTime), end: timeToMinutes(p.endTime) }))
    .filter((p) => p.end > p.start)
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const period of sorted) {
    const last = merged[merged.length - 1];
    if (last && period.start <= last.end) {
      last.end = Math.max(last.end, period.end);
    } else {
      merged.push({ ...period });
    }
  }
  return merged;
};

/**
 * Pure, DB-free slot calculation. Unchanged from Phase 3.
 */
export const computeAvailableSlots = ({
  availabilityPeriods,
  durationMinutes,
  bookedIntervals = [],
}) => {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new AppError("durationMinutes must be a positive integer", 400);
  }

  const booked = bookedIntervals.map((interval) => ({
    start: timeToMinutes(interval.startTime),
    end: timeToMinutes(interval.endTime),
  }));

  const overlapsBooking = (start, end) =>
    booked.some((b) => start < b.end && end > b.start);

  const mergedPeriods = mergePeriods(availabilityPeriods);
  const slots = [];

  for (const period of mergedPeriods) {
    const firstCandidate =
      Math.ceil(period.start / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;

    for (
      let candidateStart = firstCandidate;
      candidateStart + durationMinutes <= period.end;
      candidateStart += SLOT_INTERVAL_MINUTES
    ) {
      const candidateEnd = candidateStart + durationMinutes;
      if (overlapsBooking(candidateStart, candidateEnd)) continue;

      slots.push({
        startTime: minutesToTime(candidateStart),
        endTime: minutesToTime(candidateEnd),
      });
    }
  }

  return slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
};

/**
 * DB-facing orchestrator. `session`, if provided, is used for every query so
 * this can run inside a MongoDB transaction during booking creation — that's
 * what makes `POST /bookings`'s final check consistent with `GET /slots`.
 *
 * @param {{ businessId: string, date: string, serviceOptionId: string, session?: import("mongoose").ClientSession }} params
 * @returns {Promise<{startTime:string,endTime:string}[]>}
 */
export const getAvailableSlots = async ({ businessId, date, serviceOptionId, session }) => {
  if (!businessId) throw new AppError("businessId is required", 400);
  if (!serviceOptionId) throw new AppError("serviceOptionId is required", 400);
  if (!isValidDateString(date)) {
    throw new AppError("date must be a valid date in YYYY-MM-DD format", 400);
  }
  if (isPastDate(date)) {
    throw new AppError("date must not be in the past", 400);
  }

  const serviceOption = await ServiceOption.findById(serviceOptionId).session(session || null);
  if (!serviceOption) throw new AppError("Service option not found", 404);
  if (!serviceOption.active) throw new AppError("Service option is not active", 400);

  const service = await Service.findById(serviceOption.serviceId).session(session || null);
  if (!service || service.businessId.toString() !== businessId.toString()) {
    throw new AppError("Service option does not belong to this business", 400);
  }

  const availabilityPeriods = await Availability.find({
    businessId,
    date,
    status: "available",
  })
    .session(session || null)
    .lean();

  const bookedIntervals = await getBookedIntervals({ businessId, date, session });

  return computeAvailableSlots({
    availabilityPeriods,
    durationMinutes: serviceOption.durationMinutes,
    bookedIntervals,
  });
};