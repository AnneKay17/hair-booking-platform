import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "email is not valid"],
    },
    name: { type: String, trim: true, default: "Admin" },
    // select:false keeps the hash out of every query unless explicitly requested.
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

adminSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Admin", adminSchema);