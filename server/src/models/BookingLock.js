//Internal-only collection; not part of the public data model. Exists purely to give concurrent transactions a single document to contend over
import mongoose from "mongoose";

const bookingLockSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    date: { type: String, required: true },
    // The value itself is never read — only the act of writing to this
    // document is what creates the contention point transactions need.
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bookingLockSchema.index({ businessId: 1, date: 1 }, { unique: true });

export default mongoose.model("BookingLock", bookingLockSchema);