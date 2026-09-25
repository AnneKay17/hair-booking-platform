//A priced, timed variation of a service (e.g. Braids → Short/Medium/Long).
import mongoose from "mongoose";

const serviceOptionSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "serviceId is required"],
    },
    name: { type: String, required: [true, "name is required"], trim: true },
    price: {
      type: Number,
      required: [true, "price is required"],
      min: [0, "price must be >= 0"],
    },
    durationMinutes: {
      type: Number,
      required: [true, "durationMinutes is required"],
      min: [1, "durationMinutes must be greater than 0"],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceOption", serviceOptionSchema);