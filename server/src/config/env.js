import process from "node:process";
import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  port: toNumber(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "",
};

export const isProduction = env.nodeEnv === "production";

/**
 * Variables that must be present before the app is allowed to boot.
 * MONGODB_URI is deliberately NOT required in production-optional form yet;
 * it becomes required in Phase 2 when real models are introduced.
 */
const requiredInProduction = ["MONGODB_URI"];

export const validateEnv = () => {
  if (!isProduction) return;

  const missing = requiredInProduction.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(", ")}`
    );
  }
};