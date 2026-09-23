import { getDatabaseStatus } from "../config/database.js";
import { env } from "../config/env.js";
import process from "node:process";

export const getHealth = (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    environment: env.nodeEnv,
    database: getDatabaseStatus(),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};