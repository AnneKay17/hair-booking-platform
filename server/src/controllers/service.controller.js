//HTTP handlers for services and their nested options.
import Service from "../models/Service.js";
import ServiceOption from "../models/ServiceOption.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { getDefaultBusiness } from "../services/business.service.js";
import {
  getActiveServicesWithOptions,
  getServiceWithAllOptions,
} from "../services/service.service.js";

/**
 * GET /api/services
 * Customer-facing: active services for the business, with active options only.
 */
export const getServices = asyncHandler(async (_req, res) => {
  const business = await getDefaultBusiness();
  const services = await getActiveServicesWithOptions(business._id);

  res.status(200).json({ success: true, data: services });
});

/**
 * GET /api/services/:id
 * Admin: a single service with ALL of its options (active and inactive).
 * NOTE: not authenticated yet — auth will be added in a later phase.
 */
export const getServiceById = asyncHandler(async (req, res) => {
  const service = await getServiceWithAllOptions(req.params.id);
  res.status(200).json({ success: true, data: service });
});

/**
 * POST /api/services
 * Admin: create a service. If businessId is omitted, the single existing
 * business is used automatically.
 * NOTE: not authenticated yet — auth will be added in a later phase.
 */
export const createService = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  let { businessId } = req.body;

  if (!businessId) {
    const business = await getDefaultBusiness();
    businessId = business._id;
  }

  const service = await Service.create({ businessId, name, description });

  res.status(201).json({ success: true, data: service });
});

/**
 * PATCH /api/services/:id
 * Admin: update name, description, or active flag.
 * NOTE: not authenticated yet — auth will be added in a later phase.
 */
export const updateService = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "description", "active"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const service = await Service.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!service) throw new AppError("Service not found", 404);

  res.status(200).json({ success: true, data: service });
});

/**
 * DELETE /api/services/:id
 * Admin: soft delete — sets active to false. Historical bookings will later
 * need to keep referring to their original service, so nothing is removed.
 * NOTE: not authenticated yet — auth will be added in a later phase.
 */
export const deactivateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );

  if (!service) throw new AppError("Service not found", 404);

  res.status(200).json({ success: true, data: service });
});

/**
 * GET /api/services/:serviceId/options
 * Admin: list ALL options (active and inactive) for a service.
 * NOTE: not authenticated yet — auth will be added in a later phase.
 */
export const listServiceOptions = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new AppError("Service not found", 404);

  const options = await ServiceOption.find({ serviceId: service._id }).sort({
    createdAt: 1,
  });

  res.status(200).json({ success: true, data: options });
});

/**
 * POST /api/services/:serviceId/options
 * Admin: create an option under a service.
 * NOTE: not authenticated yet — auth will be added in a later phase.
 */
export const createServiceOption = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new AppError("Service not found", 404);

  const { name, price, durationMinutes } = req.body;

  const option = await ServiceOption.create({
    serviceId: service._id,
    name,
    price,
    durationMinutes,
  });

  res.status(201).json({ success: true, data: option });
});