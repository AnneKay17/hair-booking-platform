import { asyncHandler } from "../utils/asyncHandler.js";
import { getDefaultBusiness } from "../services/business.service.js";
import { getAllServicesWithOptions } from "../services/adminCatalog.service.js";

export const listAdminServices = asyncHandler(async (_req, res) => {
  const business = await getDefaultBusiness();
  const data = await getAllServicesWithOptions(business._id);
  res.status(200).json({ success: true, data });
});