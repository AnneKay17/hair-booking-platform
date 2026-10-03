//A specific date/time period during which the business can accept appointments, or is explicitly blocked.
import mongoose from "mongoose";
import { isValidDateString, isValidTimeString, timeToMinutes } from "../utils/timeUtils.js";

const availabilitySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "businessId is required"],
    },
    date: {
      type: String,
      required: [true, "date is required"],
      validate: {
        validator: isValidDateString,
        message: (props) => `${props.value} is not a valid date (expected YYYY-MM-DD)`,
      },
    },
    startTime: {
      type: String,
      required: [true, "startTime is required"],
      validate: {
        validator: isValidTimeString,
        message: (props) => `${props.value} is not a valid time (expected HH:MM, 24-hour)`,
      },
    },
    endTime: {
      type: String,
      required: [true, "endTime is required"],
      validate: {
        validator: isValidTimeString,
        message: (props) => `${props.value} is not a valid time (expected HH:MM, 24-hour)`,
      },
    },
    status: {
      type: String,
      enum: ["available", "blocked"],
      default: "available",
    },
  },
  { timestamps: true }
);

// Cross-field check: endTime must be strictly after startTime (also rejects
// zero-duration periods). Runs on .validate()/.save(), including the
// controller's fetch-then-save update pattern.
availabilitySchema.pre("validate", function () {
  if (
    isValidTimeString(this.startTime) &&
    isValidTimeString(this.endTime) &&
    timeToMinutes(this.startTime) >= timeToMinutes(this.endTime)
  ) {
    this.invalidate("endTime", "endTime must be after startTime");
  }
});

availabilitySchema.index({ businessId: 1, date: 1 });

export default mongoose.model("Availability", availabilitySchema);