//The single hairstylist business record.
import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true },
    phone: { type: String, trim: true },
    description: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Business", businessSchema);