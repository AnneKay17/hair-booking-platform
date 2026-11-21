import { asyncHandler } from "../utils/asyncHandler.js";
import {
  AUTH_COOKIE_NAME,
  authenticateAdmin,
  getCookieOptions,
  getSessionCookieOptions,
  serializeAdmin,
  signAdminToken,
} from "../services/auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const admin = await authenticateAdmin(req.body ?? {});
  res.cookie(AUTH_COOKIE_NAME, signAdminToken(admin), getSessionCookieOptions());
  res.status(200).json({ success: true, data: { admin: serializeAdmin(admin) } });
});

export const logout = (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getCookieOptions());
  res.status(200).json({ success: true, data: null });
};

export const me = (req, res) => {
  res.status(200).json({ success: true, data: { admin: serializeAdmin(req.admin) } });
};