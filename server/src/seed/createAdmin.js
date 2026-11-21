/**
 * Creates the single admin account from environment variables.
 *   npm run create-admin
 *   npm run create-admin -- --reset-password   (resets an existing admin's password)
 * Remove ADMIN_PASSWORD from server/.env afterwards.
 */
import mongoose from "mongoose";
import process from "node:process";
import { env } from "../config/env.js";
import Admin from "../models/Admin.js";
import { hashPassword } from "../services/auth.service.js";

const MIN_PASSWORD_LENGTH = 10;

const run = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";
  const reset = process.argv.includes("--reset-password");

  if (!env.mongodbUri) throw new Error("MONGODB_URI is not set in server/.env");
  if (!email) throw new Error("ADMIN_EMAIL is not set in server/.env");
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be set and at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  await mongoose.connect(env.mongodbUri);
  const existing = await Admin.findOne({ email });

  if (existing && !reset) {
    console.log(`[create-admin] An admin with that email already exists. Use --reset-password to change its password.`);
  } else if (existing) {
    existing.passwordHash = await hashPassword(password);
    await existing.save();
    console.log("[create-admin] Password updated.");
  } else {
    await Admin.create({ email, name, passwordHash: await hashPassword(password) });
    console.log("[create-admin] Admin created.");
  }

  console.log("[create-admin] Now remove ADMIN_PASSWORD from server/.env.");
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("[create-admin] Failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});