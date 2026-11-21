import { asyncHandler } from "../utils/asyncHandler.js";
import { getDefaultBusiness } from "../services/business.service.js";
import {
  addAvailability,
  editAvailability,
  findAvailability,
  removeAvailability,
} from "../services/adminAvailability.service.js";

const currentBusinessId = async () => (await getDefaultBusiness())._id;

export const listAvailability = asyncHandler(async (req, res) => {
  const data = await findAvailability({ businessId: await currentBusinessId(), query: req.query });
  res.status(200).json({ success: true, data });
});

export const createAvailability = asyncHandler(async (req, res) => {
  const data = await addAvailability({ businessId: await currentBusinessId(), body: req.body ?? {} });
  res.status(201).json({ success: true, data });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const data = await editAvailability({
    businessId: await currentBusinessId(),
    id: req.params.id,
    body: req.body ?? {},
  });
  res.status(200).json({ success: true, data });
});

export const deleteAvailability = asyncHandler(async (req, res) => {
  const data = await removeAvailability({ businessId: await currentBusinessId(), id: req.params.id });
  res.status(200).json({ success: true, data });
});