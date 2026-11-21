import Admin from "../models/Admin.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AUTH_COOKIE_NAME, verifyAdminToken } from "../services/auth.service.js";

export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) throw new AppError("Authentication required", 401);

  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch (error) {
    throw new AppError(
      error.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid session. Please log in again.",
      401
    );
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin) throw new AppError("Invalid session. Please log in again.", 401);

  req.admin = admin;
  next();
});

export const noStore = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};