//Finds the single active business rather than requiring every request to pass a businessId — this is the seam that will later allow multiple businesses.
import Business from "../models/Business.js";
import { AppError } from "../utils/AppError.js";

export const getDefaultBusiness = async () => {
  const business = await Business.findOne({ active: true }).sort({ createdAt: 1 });

  if (!business) {
    throw new AppError(
      "No business found. Run 'npm run seed' or create a Business document first.",
      404
    );
  }

  return business;
};