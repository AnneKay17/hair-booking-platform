//Standalone update/deactivate for a service option by its own id.
import ServiceOption from "../models/ServiceOption.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * PATCH /api/service-options/:id
 * Admin: update name, price, durationMinutes, or active flag.
 * NOTE: not authenticated yet — auth will be added in a later phase.
 */
export const updateServiceOption = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "price", "durationMinutes", "active"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const option = await ServiceOption.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!option) throw new AppError("Service option not found", 404);

  res.status(200).json({ success: true, data: option });
});

/**
 * DELETE /api/service-options/:id
 * Admin: soft delete — sets active to false rather than removing the document.
 * NOTE: not authenticated yet — auth will be added in a later phase.
 */
export const deactivateServiceOption = asyncHandler(async (req, res) => {
  const option = await ServiceOption.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );

  if (!option) throw new AppError("Service option not found", 404);

  res.status(200).json({ success: true, data: option });
});