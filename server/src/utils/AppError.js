/**
 * Error type for expected, client-facing failures (validation, not found,
 * booking conflicts, etc.). Anything thrown that is NOT an AppError is treated
 * as an unexpected server error by the error handler.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Safe to show to the client
   * @param {number} [statusCode=400]
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}