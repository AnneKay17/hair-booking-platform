import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connects to MongoDB using MONGODB_URI.
 *
 * Phase 1 behaviour: if MONGODB_URI is empty the server still starts and logs a
 * warning. This lets the foundation run before a database is provisioned.
 * From Phase 2 onwards a connection will be mandatory.
 *
 * @returns {Promise<boolean>} true if a connection was established
 */
export const connectDatabase = async () => {
  if (!env.mongodbUri) {
    console.warn(
      "[database] MONGODB_URI is not set. Starting without a database connection.\n" +
        "           Set MONGODB_URI in server/.env when your MongoDB instance is ready."
    );
    return false;
  }

  try {
    await mongoose.connect(env.mongodbUri);
    console.log("[database] Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("[database] Connection failed:", error.message);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  await mongoose.connection.close();
  console.log("[database] Connection closed");
};

/**
 * Human-readable connection state, used by the health endpoint.
 * @returns {"not_configured"|"disconnected"|"connected"|"connecting"|"disconnecting"|"unknown"}
 */
export const getDatabaseStatus = () => {
  if (!env.mongodbUri) return "not_configured";

  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] || "unknown";
};