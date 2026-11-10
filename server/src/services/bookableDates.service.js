//Returns the dates in a range that have at least one bookable slot for a service option. 
// It reuses computeAvailableSlots, so it can’t disagree with the slots endpoint
import ServiceOption from "../models/ServiceOption.js";
import Service from "../models/Service.js";
import Availability from "../models/Availability.js";
import { AppError } from "../utils/AppError.js";
import { isValidDateString, getTodayDateString } from "../utils/timeUtils.js";
import { computeAvailableSlots } from "./slotService.js";
import { getBookedIntervalsForRange } from "./bookingConflict.service.js";

const MAX_RANGE_DAYS = 100;

const daysBetween = (start, end) => {
  const [y1, m1, d1] = start.split("-").map(Number);
  const [y2, m2, d2] = end.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

/**
 * Dates in [startDate, endDate] on which the service option has at least one
 * bookable slot. Dates before today are ignored.
 *
 * @returns {Promise<string[]>} sorted "YYYY-MM-DD" strings
 */
export const getBookableDates = async ({ businessId, serviceOptionId, startDate, endDate }) => {
  if (!businessId) throw new AppError("businessId is required", 400);
  if (!serviceOptionId) throw new AppError("serviceOptionId is required", 400);
  if (!isValidDateString(startDate)) {
    throw new AppError("startDate must be a valid date in YYYY-MM-DD format", 400);
  }
  if (!isValidDateString(endDate)) {
    throw new AppError("endDate must be a valid date in YYYY-MM-DD format", 400);
  }
  if (endDate < startDate) throw new AppError("endDate must not be before startDate", 400);
  if (daysBetween(startDate, endDate) > MAX_RANGE_DAYS) {
    throw new AppError(`Date range must not exceed ${MAX_RANGE_DAYS} days`, 400);
  }

  // Same option/business rules as the slots endpoint.
  const serviceOption = await ServiceOption.findById(serviceOptionId);
  if (!serviceOption) throw new AppError("Service option not found", 404);
  if (!serviceOption.active) throw new AppError("Service option is not active", 400);

  const service = await Service.findById(serviceOption.serviceId);
  if (!service || service.businessId.toString() !== businessId.toString()) {
    throw new AppError("Service option does not belong to this business", 400);
  }

  const today = getTodayDateString();
  const effectiveStart = startDate < today ? today : startDate;
  if (effectiveStart > endDate) return [];

  const periods = await Availability.find({
    businessId,
    status: "available",
    date: { $gte: effectiveStart, $lte: endDate },
  }).lean();

  if (periods.length === 0) return [];

  const bookedByDate = await getBookedIntervalsForRange({
    businessId,
    startDate: effectiveStart,
    endDate,
  });

  const periodsByDate = {};
  for (const period of periods) {
    (periodsByDate[period.date] ||= []).push(period);
  }

  return Object.keys(periodsByDate)
    .sort()
    .filter(
      (date) =>
        computeAvailableSlots({
          availabilityPeriods: periodsByDate[date],
          durationMinutes: serviceOption.durationMinutes,
          bookedIntervals: bookedByDate[date] || [],
        }).length > 0
    );
};