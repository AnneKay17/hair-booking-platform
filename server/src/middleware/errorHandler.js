import { AppError } from "../utils/AppError.js";
import { isProduction } from "../config/env.js";

const normalizeError = (error) => {
  if (error instanceof AppError) return error;

  if (error.type === "entity.parse.failed") {
    return new AppError("Request body is not valid JSON", 400);
  }
  if (error.type === "entity.too.large") {
    return new AppError("Request body is too large", 413);
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((e) => e.message);
    return new AppError(messages.join("; "), 400);
  }

  if (error.name === "CastError") {
    return new AppError(`Invalid ${error.path}: ${error.value}`, 400);
  }

  if (error.code === 11000) {
    return new AppError("Duplicate value violates a unique constraint", 409);
  }

  return error;
};

/* eslint-disable no-unused-vars */
export const errorHandler = (error, _req, res, _next) => {
  const normalized = normalizeError(error);
  const isKnown = normalized instanceof AppError;
  const statusCode = isKnown ? normalized.statusCode : 500;

  if (!isKnown) {
    console.error("[error]", error);
  }

  res.status(statusCode).json({
    success: false,
    message: isKnown || !isProduction ? normalized.message : "Internal server error",
    ...(isProduction ? {} : { stack: error.stack }),
  });
};