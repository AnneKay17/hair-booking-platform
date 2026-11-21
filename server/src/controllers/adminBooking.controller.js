import { asyncHandler } from "../utils/asyncHandler.js";
import { getDefaultBusiness } from "../services/business.service.js";
import {
  changeBookingStatus,
  findBookingById,
  findBookings,
  getDashboardData,
} from "../services/adminBooking.service.js";

const currentBusinessId = async () => (await getDefaultBusiness())._id;

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await getDashboardData({ businessId: await currentBusinessId() });
  res.status(200).json({ success: true, data });
});

export const listBookings = asyncHandler(async (req, res) => {
  const data = await findBookings({ businessId: await currentBusinessId(), query: req.query });
  res.status(200).json({ success: true, data });
});

export const getBooking = asyncHandler(async (req, res) => {
  const data = await findBookingById({ businessId: await currentBusinessId(), id: req.params.id });
  res.status(200).json({ success: true, data });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const data = await changeBookingStatus({
    businessId: await currentBusinessId(),
    id: req.params.id,
    status: req.body?.status,
  });
  res.status(200).json({ success: true, data });
});