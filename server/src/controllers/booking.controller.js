/*HTTP handlers. Note the explicit field whitelist in postBooking — 
this is what actually stops a client from submitting price, durationMinutes, endTime, or status: 
those fields are never read from the request body at all. */
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

/**
 * POST /api/bookings
 * Only these fields are ever read from the request body. price,
 * durationMinutes, endTime, status, and bookingReference are deliberately
 * NOT accepted from the client — they are always computed server-side.
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
 * Public lookup, intended for a customer confirmation/status page. Exposes
 * only what a confirmation page needs — no businessId, serviceId, or phone
 * number, since the reference alone (not a login) gates this endpoint.
 */
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await getBookingByReference(req.params.bookingReference);

  res.status(200).json({
    success: true,
    data: { ...toConfirmationResponse(booking), customerName: booking.customerName, notes: booking.notes },
  });
});