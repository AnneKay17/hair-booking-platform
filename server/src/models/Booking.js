//A customer appointment, with its own snapshot of price/duration/names so later catalog changes never rewrite history.
import mongoose from "mongoose";
import { isValidDateString, isValidTimeString, timeToMinutes } from "../utils/timeUtils.js";

export const BOOKING_STATUSES = ["Pending", "Confirmed", "Rejected", "Cancelled", "Completed"];

const bookingSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "businessId is required"],
    },
    customerName: { type: String, required: [true, "customerName is required"], trim: true },
    customerPhone: { type: String, required: [true, "customerPhone is required"], trim: true },

    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    serviceOptionId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceOption", required: true },

    // Historical snapshot — deliberately duplicated from Service/ServiceOption
    // at booking time so later price/duration/name changes never alter this
    // booking's record.
    serviceName: { type: String, required: true, trim: true },
    serviceOptionName: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: [1, "durationMinutes must be greater than 0"] },
    price: { type: Number, required: true, min: [0, "price must be >= 0"] },

    date: {
      type: String,
      required: true,
      validate: { validator: isValidDateString, message: (p) => `${p.value} is not a valid date (expected YYYY-MM-DD)` },
    },
    startTime: {
      type: String,
      required: true,
      validate: { validator: isValidTimeString, message: (p) => `${p.value} is not a valid time (expected HH:MM)` },
    },
    endTime: {
      type: String,
      required: true,
      validate: { validator: isValidTimeString, message: (p) => `${p.value} is not a valid time (expected HH:MM)` },
    },

    status: { type: String, enum: BOOKING_STATUSES, default: "Pending" },
    notes: { type: String, trim: true, default: "" },

    bookingReference: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

// Zero-argument hook — see the Phase 3 fix: a declared `next` parameter
// triggers a "next is not a function" error on this Mongoose version.
bookingSchema.pre("validate", function () {
  if (
    isValidTimeString(this.startTime) &&
    isValidTimeString(this.endTime) &&
    timeToMinutes(this.endTime) <= timeToMinutes(this.startTime)
  ) {
    this.invalidate("endTime", "endTime must be after startTime");
  }
});

// Supports both the conflict-check query (businessId+date+status) and the
// public lookup (bookingReference, already unique-indexed above).
bookingSchema.index({ businessId: 1, date: 1, status: 1 });

export default mongoose.model("Booking", bookingSchema);