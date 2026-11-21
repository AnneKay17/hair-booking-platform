import { createBooking, getBookingByReference } from "../services/bookingService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDefaultBusiness } from "../services/business.service.js";

const toConfirmationResponse = (booking) => ({
  bookingReference: booking.bookingReference,
  status: booking.status,
  service: booking.serviceName,
  option: booking.serviceOptionName,
  price: booking.price,
  date: booking.date,
  startTime: booking.startTime,
  endTime: booking.endTime,
  durationMinutes: booking.durationMinutes,
});

/** "Jane Doe" -> "Jane D." so the reference alone never reveals a full name. */
const maskName = (fullName) => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

/**
 * POST /api/bookings
 * Only these fields are read from the body. price, durationMinutes, endTime,
 * status and bookingReference are always computed server-side.
 */
export const postBooking = asyncHandler(async (req, res) => {
  const { serviceId, serviceOptionId, date, startTime, customerName, customerPhone, notes } = req.body;
  let { businessId } = req.body;

  if (!businessId) {
    const business = await getDefaultBusiness();
    businessId = business._id;
  }

  const booking = await createBooking({
    businessId,
    serviceId,
    serviceOptionId,
    date,
    startTime,
    customerName,
    customerPhone,
    notes,
  });

  res.status(201).json({ success: true, data: toConfirmationResponse(booking) });
});

/**
 * GET /api/bookings/:bookingReference
 * Public. Exposes only what a status page needs: a masked name, no phone, no notes.
 */
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await getBookingByReference(req.params.bookingReference);

  res.status(200).json({
    success: true,
    data: { ...toConfirmationResponse(booking), customerName: maskName(booking.customerName) },
  });
});