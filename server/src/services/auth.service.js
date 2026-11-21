import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { env, isProduction } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export const AUTH_COOKIE_NAME = "admin_token";

const BCRYPT_ROUNDS = env.nodeEnv === "test" ? 4 : 12;
const MAX_PASSWORD_LENGTH = 200;

// Compared against when the email is unknown, so "no such admin" and "wrong
// password" take about the same time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);

export const authenticateAdmin = async ({ email, password }) => {
  // typeof checks also block NoSQL-injection payloads such as { "$ne": null }
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    throw new AppError("Email and password are required", 400);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError("Invalid email or password", 401);
  }

  const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  const passwordMatches = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }
  return admin;
};

export const signAdminToken = (admin) =>
  jwt.sign({ sub: admin.id }, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: `${env.sessionDays}d`,
  });

export const verifyAdminToken = (token) =>
  jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });

export const serializeAdmin = (admin) => ({ id: admin.id, email: admin.email, name: admin.name });

/** Options for clearing the cookie (must NOT include maxAge, or Express won't expire it). */
export const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction || env.cookieSameSite === "none",
  sameSite: env.cookieSameSite,
  path: "/",
});

export const getSessionCookieOptions = () => ({
  ...getCookieOptions(),
  maxAge: env.sessionDays * 24 * 60 * 60 * 1000,
});