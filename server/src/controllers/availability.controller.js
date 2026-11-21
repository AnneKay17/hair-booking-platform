import { asyncHandler } from "../utils/asyncHandler.js";
import { getAvailableSlots } from "../services/slotService.js";
import { getBookableDates } from "../services/bookableDates.service.js";
import { getDefaultBusiness } from "../services/business.service.js";

const resolveBusinessId = async (queryBusinessId) =>
  queryBusinessId || (await getDefaultBusiness())._id;

/** GET /api/availability/slots?date=...&serviceOptionId=... */
export const getSlots = asyncHandler(async (req, res) => {
  const { date, serviceOptionId } = req.query;
  const businessId = await resolveBusinessId(req.query.businessId);

  const slots = await getAvailableSlots({ businessId, date, serviceOptionId });
  res.status(200).json({ success: true, data: slots });
});

/** GET /api/availability/dates?serviceOptionId=...&startDate=...&endDate=... */
export const getDates = asyncHandler(async (req, res) => {
  const { serviceOptionId, startDate, endDate } = req.query;
  const businessId = await resolveBusinessId(req.query.businessId);

  const dates = await getBookableDates({ businessId, serviceOptionId, startDate, endDate });
  res.status(200).json({ success: true, data: dates });
});