import process from "node:process";
import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const SAME_SITE_VALUES = ["lax", "strict", "none"];

export const env = {
  port: toNumber(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  sessionDays: toNumber(process.env.SESSION_DAYS, 7),
  cookieSameSite: (process.env.COOKIE_SAME_SITE || "lax").toLowerCase(),
  trustProxy: toNumber(process.env.TRUST_PROXY, 0),
};

export const isProduction = env.nodeEnv === "production";

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

/** Auth settings are required in every environment: the admin area cannot run without them. */
export const validateAuthEnv = () => {
  const problems = [];

  if (env.jwtSecret.length < 32) {
    problems.push("JWT_SECRET must be set to a random string of at least 32 characters");
  }
  if (!SAME_SITE_VALUES.includes(env.cookieSameSite)) {
    problems.push("COOKIE_SAME_SITE must be lax, strict or none");
  }
  if (env.sessionDays < 1 || env.sessionDays > 30) {
    problems.push("SESSION_DAYS must be between 1 and 30");
  }

  if (problems.length > 0) {
    throw new Error(`Invalid auth configuration:\n - ${problems.join("\n - ")}`);
  }
};