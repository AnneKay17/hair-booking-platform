import { AppError } from "../utils/AppError.js";
import { isProduction } from "../config/env.js";

/* eslint-disable no-unused-vars */
export const errorHandler = (error, _req, res, _next) => {
  const isKnown = error instanceof AppError;
  const statusCode = isKnown ? error.statusCode : 500;

  if (!isKnown) {
    console.error("[error]", error);
  }

  res.status(statusCode).json({
    success: false,
    message: isKnown || !isProduction ? error.message : "Internal server error",
    ...(isProduction ? {} : { stack: error.stack }),
  });
};