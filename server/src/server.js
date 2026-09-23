import app from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import process from "node:process";

const start = async () => {
  try {
    validateEnv();
    await connectDatabase();

    const server = app.listen(env.port, () => {
      console.log(`[server] Running in ${env.nodeEnv} mode on port ${env.port}`);
      console.log(`[server] Health check: http://localhost:${env.port}/api/health`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[server] ${signal} received, shutting down`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    process.on("unhandledRejection", (reason) => {
      console.error("[server] Unhandled rejection:", reason);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("[server] Failed to start:", error.message);
    process.exit(1);
  }
};

start();