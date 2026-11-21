import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

/** Skipped under NODE_ENV=test unless a test passes its own `skip`. */
export const createLimiter = ({
  windowMs,
  limit,
  message,
  skipSuccessfulRequests = false,
  skip = () => env.nodeEnv === "test",
}) =>
  rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new AppError(message, 429)),
  });

// Only FAILED logins count towards the limit.
export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Please wait 15 minutes and try again.",
});

export const lookupLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many lookups. Please wait a few minutes and try again.",
});