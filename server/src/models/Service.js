//A category of service (Braids, Cornrows, etc.) belonging to a business.
import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "businessId is required"],
    },
    name: { type: String, required: [true, "name is required"], trim: true },
    description: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);