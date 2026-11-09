//All booking business logic. Controllers stay thin; this is where validation, calculation, the final availability check, and creation live.
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import BookingLock from "../models/BookingLock.js";
import Service from "../models/Service.js";
import ServiceOption from "../models/ServiceOption.js";
import { AppError } from "../utils/AppError.js";
import { generateBookingReference } from "../utils/bookingReference.js";
import { getAvailableSlots } from "./slotService.js";
import {
  isValidDateString,
  isValidTimeString,
  isPastDate,
  timeToMinutes,
  minutesToTime,
} from "../utils/timeUtils.js";

const SLOT_INTERVAL_MINUTES = 30;
const MAX_REFERENCE_ATTEMPTS = 5;
const MAX_NAME_LENGTH = 100;
const MIN_PHONE_LENGTH = 6;
const MAX_PHONE_LENGTH = 30;
const MAX_NOTES_LENGTH = 500;

/** Detects "this MongoDB deployment doesn't support transactions" — i.e. a
 * standalone mongod rather than a replica set — as distinct from a genuine
 * AppError raised by our own validation/conflict logic. */
const isTransactionsUnsupportedError = (error) =>
  !(error instanceof AppError) &&
  (error.code === 20 ||
    error.codeName === "IllegalOperation" ||
    /Transaction numbers/i.test(error.message || "") ||
    /does not support retryable writes/i.test(error.message || ""));

const validateBookingInput = ({ customerName, customerPhone, date, startTime }) => {
  if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
    throw new AppError("customerName is required", 400);
  }
  if (customerName.trim().length > MAX_NAME_LENGTH) {
    throw new AppError(`customerName must be at most ${MAX_NAME_LENGTH} characters`, 400);
  }

  if (!customerPhone || typeof customerPhone !== "string" || !customerPhone.trim()) {
    throw new AppError("customerPhone is required", 400);
  }
  const phoneLength = customerPhone.trim().length;
  if (phoneLength < MIN_PHONE_LENGTH || phoneLength > MAX_PHONE_LENGTH) {
    throw new AppError("customerPhone must be a valid length", 400);
  }

  if (!isValidDateString(date)) {
    throw new AppError("date must be a valid date in YYYY-MM-DD format", 400);
  }
  if (isPastDate(date)) {
    throw new AppError("date must not be in the past", 400);
  }

  if (!isValidTimeString(startTime)) {
    throw new AppError("startTime must be a valid HH:MM time", 400);
  }
  if (timeToMinutes(startTime) % SLOT_INTERVAL_MINUTES !== 0) {
    throw new AppError("startTime must align to a 30-minute interval", 400);
  }
};

const loadServiceAndOption = async ({ businessId, serviceId, serviceOptionId }) => {
  if (!serviceId) throw new AppError("serviceId is required", 400);
  if (!serviceOptionId) throw new AppError("serviceOptionId is required", 400);

  const service = await Service.findById(serviceId);
  if (!service) throw new AppError("Service not found", 404);
  if (service.businessId.toString() !== businessId.toString()) {
    throw new AppError("Service does not belong to this business", 400);
  }
  if (!service.active) throw new AppError("Service is not active", 400);

  const serviceOption = await ServiceOption.findById(serviceOptionId);
  if (!serviceOption) throw new AppError("Service option not found", 404);
  if (serviceOption.serviceId.toString() !== service._id.toString()) {
    throw new AppError("Service option does not belong to the selected service", 400);
  }
  if (!serviceOption.active) throw new AppError("Service option is not active", 400);

  return { service, serviceOption };
};

/** The single authoritative check — reuses slotService.getAvailableSlots, the
 * exact function GET /availability/slots uses, so the two endpoints can never
 * disagree about what's bookable. */
const assertSlotStillAvailable = async ({ businessId, date, serviceOptionId, startTime, endTime, session }) => {
  const slots = await getAvailableSlots({ businessId, date, serviceOptionId, session });
  const stillAvailable = slots.some((s) => s.startTime === startTime && s.endTime === endTime);

  if (!stillAvailable) {
    throw new AppError("The selected time is no longer available.", 409);
  }
};

/** The contention point described in §5. Must run inside the transaction. */
const acquireDayLock = async ({ businessId, date, session }) => {
  await BookingLock.findOneAndUpdate(
    { businessId, date },
    { $inc: { version: 1 } },
    { upsert: true, session }
  );
};

const insertBooking = async (bookingData, session) => {
  const bookingReference = generateBookingReference();
  try {
    const [booking] = await Booking.create([{ ...bookingData, bookingReference }], {
      session: session || undefined,
    });
    return booking;
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.bookingReference) {
      throw new AppError(
        "Could not generate a unique booking reference. Please try again.",
        500
      );
    }
    throw error;
  }
};

/** Only used outside a transaction, where retrying a single failed write is
 * safe (see §5 for why this can't be done the same way inside one). */
const insertBookingWithRetry = async (bookingData) => {
  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt++) {
    try {
      return await insertBooking(bookingData, null);
    } catch (error) {
      const isCollision = error instanceof AppError && error.statusCode === 500;
      const isLastAttempt = attempt === MAX_REFERENCE_ATTEMPTS - 1;
      if (isCollision && !isLastAttempt) continue;
      throw error;
    }
  }
};

/**
 * Creates a booking. The backend — never the client — determines price,
 * durationMinutes, endTime, status, and bookingReference.
 *
 * @param {{
 *   businessId: string, serviceId: string, serviceOptionId: string,
 *   date: string, startTime: string,
 *   customerName: string, customerPhone: string, notes?: string
 * }} input
 */
export const createBooking = async (input) => {
  const { businessId, serviceId, serviceOptionId, date, startTime, customerName, customerPhone, notes } = input;

  if (!businessId) throw new AppError("businessId is required", 400);

  validateBookingInput({ customerName, customerPhone, date, startTime });

  const { service, serviceOption } = await loadServiceAndOption({
    businessId,
    serviceId,
    serviceOptionId,
  });

  const endTime = minutesToTime(timeToMinutes(startTime) + serviceOption.durationMinutes);

  const bookingData = {
    businessId,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    serviceId: service._id,
    serviceOptionId: serviceOption._id,
    serviceName: service.name,
    serviceOptionName: serviceOption.name,
    date,
    startTime,
    endTime,
    durationMinutes: serviceOption.durationMinutes,
    price: serviceOption.price,
    status: "Pending",
    notes: typeof notes === "string" ? notes.trim().slice(0, MAX_NOTES_LENGTH) : "",
  };

  const session = await mongoose.startSession();

  try {
    try {
      let createdBooking;

      await session.withTransaction(async () => {
        await acquireDayLock({ businessId, date, session });
        await assertSlotStillAvailable({
          businessId,
          date,
          serviceOptionId: serviceOption._id,
          startTime,
          endTime,
          session,
        });
        createdBooking = await insertBooking(bookingData, session);
      });

      return createdBooking;
    } catch (txError) {
      if (!isTransactionsUnsupportedError(txError)) {
        throw txError; // a real validation/conflict/server error — propagate as-is
      }

      // Standalone MongoDB deployment (no replica set) — transactions are
      // unavailable here by design (local `mongod` default). Falling back to
      // a non-transactional check-then-create. This is best-effort only: it
      // closes most of the race window but cannot fully guarantee atomicity
      // without a replica set. Use MongoDB Atlas or any replica-set-backed
      // deployment in production to close this gap completely (see §5).
      console.warn(
        "[bookingService] MongoDB transactions are unavailable (this looks like a standalone " +
          "deployment, not a replica set). Falling back to a non-transactional conflict check."
      );

      await assertSlotStillAvailable({
        businessId,
        date,
        serviceOptionId: serviceOption._id,
        startTime,
        endTime,
      });

      return await insertBookingWithRetry(bookingData);
    }
  } finally {
    await session.endSession();
  }
};

/**
 * Customer-facing lookup. Only called with a bookingReference the customer
 * already has (it was returned to them on creation) — see the controller for
 * which fields are actually exposed.
 */
export const getBookingByReference = async (bookingReference) => {
  const booking = await Booking.findOne({ bookingReference });
  if (!booking) throw new AppError("Booking not found", 404);
  return booking;
};