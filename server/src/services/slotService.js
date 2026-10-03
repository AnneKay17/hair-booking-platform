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

/**
 * Merges overlapping/adjacent periods into continuous ranges, expressed as
 * integer minutes. Two back-to-back availability periods (e.g. 09:00-12:00
 * and 12:00-15:00) become one continuous 09:00-15:00 range, so an
 * appointment can validly span across where they meet (e.g. 11:30-12:30).
 */
const mergePeriods = (periods) => {
  const sorted = periods
    .map((p) => ({ start: timeToMinutes(p.startTime), end: timeToMinutes(p.endTime) }))
    .filter((p) => p.end > p.start) // defensive: ignore any malformed period
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
 * Pure, DB-free slot calculation.
 *
 * Candidate start times always sit on the global 30-minute grid (:00/:30),
 * matching "appointment start times use 30-minute intervals" from the spec.
 * The service duration itself does not need to be a multiple of 30 — only
 * the *start* times are grid-aligned; the end time is whatever
 * start + duration works out to.
 *
 * The booked-interval overlap rule is [start, end): two intervals conflict
 * only if one starts before the other ends AND ends after the other starts.
 * This is what makes back-to-back appointments valid.
 *
 * @param {{
 *   availabilityPeriods: {startTime:string,endTime:string}[],
 *   durationMinutes: number,
 *   bookedIntervals?: {startTime:string,endTime:string}[]
 * }} params
 * @returns {{startTime:string,endTime:string}[]} slots sorted by start time
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
    // First 30-minute-grid point at or after the period's start.
    const firstCandidate =
      Math.ceil(period.start / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;

    for (
      let candidateStart = firstCandidate;
      candidateStart + durationMinutes <= period.end; // must fit ENTIRELY inside
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
 * DB-facing orchestrator: validates input, loads the service option,
 * verifies it's active and belongs to this business, loads availability
 * and (later) bookings for the date, and delegates the actual math to
 * computeAvailableSlots.
 *
 * @param {{ businessId: string, date: string, serviceOptionId: string }} params
 * @returns {Promise<{startTime:string,endTime:string}[]>}
 */
export const getAvailableSlots = async ({ businessId, date, serviceOptionId }) => {
  if (!businessId) throw new AppError("businessId is required", 400);
  if (!serviceOptionId) throw new AppError("serviceOptionId is required", 400);
  if (!isValidDateString(date)) {
    throw new AppError("date must be a valid date in YYYY-MM-DD format", 400);
  }
  if (isPastDate(date)) {
    throw new AppError("date must not be in the past", 400);
  }

  const serviceOption = await ServiceOption.findById(serviceOptionId);
  if (!serviceOption) throw new AppError("Service option not found", 404);
  if (!serviceOption.active) throw new AppError("Service option is not active", 400);

  const service = await Service.findById(serviceOption.serviceId);
  if (!service || service.businessId.toString() !== businessId.toString()) {
    throw new AppError("Service option does not belong to this business", 400);
  }

  const availabilityPeriods = await Availability.find({
    businessId,
    date,
    status: "available",
  }).lean();

  const bookedIntervals = await getBookedIntervals({ businessId, date });

  return computeAvailableSlots({
    availabilityPeriods,
    durationMinutes: serviceOption.durationMinutes,
    bookedIntervals,
  });
};