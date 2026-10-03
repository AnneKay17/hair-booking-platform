//HTTP handlers for managing availability and for the customer-facing slots endpoint.
import Availability from "../models/Availability.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { getAvailableSlots } from "../services/slotService.js";
import { isValidDateString } from "../utils/timeUtils.js";
import { getDefaultBusiness } from "../services/business.service.js";

/**
 * GET /api/availability?date=2026-10-03
 * GET /api/availability?startDate=2026-10-01&endDate=2026-10-07
 * Admin: list availability periods. NOT authenticated yet.
 */
export const getAvailability = asyncHandler(async (req, res) => {
  const { date, startDate, endDate } = req.query;
  let { businessId } = req.query;

  if (!businessId) {
    const business = await getDefaultBusiness();
    businessId = business._id;
  }

  const filter = { businessId };

  if (date) {
    if (!isValidDateString(date)) throw new AppError("Invalid date", 400);
    filter.date = date;
  } else if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      if (!isValidDateString(startDate)) throw new AppError("Invalid startDate", 400);
      filter.date.$gte = startDate;
    }
    if (endDate) {
      if (!isValidDateString(endDate)) throw new AppError("Invalid endDate", 400);
      filter.date.$lte = endDate;
    }
  }

  const periods = await Availability.find(filter).sort({ date: 1, startTime: 1 });

  res.status(200).json({ success: true, data: periods });
});

/**
 * POST /api/availability
 * Admin: create an availability (or blocked) period. NOT authenticated yet.
 */
export const createAvailability = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, status } = req.body;
  let { businessId } = req.body;

  if (!businessId) {
    const business = await getDefaultBusiness();
    businessId = business._id;
  }

  const availability = await Availability.create({
    businessId,
    date,
    startTime,
    endTime,
    status,
  });

  res.status(201).json({ success: true, data: availability });
});

/**
 * PATCH /api/availability/:id
 * Admin: update a period's date/times/status. NOT authenticated yet.
 * Uses fetch-then-save (not findByIdAndUpdate) so the model's cross-field
 * startTime/endTime validation actually runs.
 */
export const updateAvailability = asyncHandler(async (req, res) => {
  const allowedFields = ["date", "startTime", "endTime", "status"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const existing = await Availability.findById(req.params.id);
  if (!existing) throw new AppError("Availability period not found", 404);

  Object.assign(existing, updates);
  await existing.save();

  res.status(200).json({ success: true, data: existing });
});

/**
 * DELETE /api/availability/:id
 * Admin: remove a period. Unlike bookings, availability isn't historical
 * data anything else refers to, so a hard delete is fine. NOT authenticated yet.
 */
export const deleteAvailability = asyncHandler(async (req, res) => {
  const deleted = await Availability.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError("Availability period not found", 404);

  res.status(200).json({ success: true, data: { id: req.params.id } });
});

/**
 * GET /api/availability/slots?date=2026-10-03&serviceOptionId=...
 * Customer-facing: available appointment start times for a date/service.
 */
export const getSlots = asyncHandler(async (req, res) => {
  const { date, serviceOptionId } = req.query;
  let { businessId } = req.query;

  if (!businessId) {
    const business = await getDefaultBusiness();
    businessId = business._id;
  }

  const slots = await getAvailableSlots({ businessId, date, serviceOptionId });

  res.status(200).json({ success: true, data: slots });
});