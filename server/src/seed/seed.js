//Manual, re-runnable script that populates clearly fictional example data. Never runs automatically.
/**
 * Development seed script.
 *
 * Populates the database with obviously fictional example data so the
 * service API has something to return. Safe to re-run: it clears the
 * Business, Service, and ServiceOption collections first.
 *
 * Run manually with: npm run seed
 * This is NOT executed automatically when the server starts.
 */
import mongoose from "mongoose";
import { env, validateEnv } from "../config/env.js";
import Business from "../models/Business.js";
import Service from "../models/Service.js";
import ServiceOption from "../models/ServiceOption.js";
import process from "node:process";

const seed = async () => {
  if (!env.mongodbUri) {
    console.error(
      "[seed] MONGODB_URI is not set in server/.env. Configure it before seeding."
    );
    process.exit(1);
  }

  validateEnv();

  await mongoose.connect(env.mongodbUri);
  console.log("[seed] Connected to MongoDB");

  await Promise.all([
    Business.deleteMany({}),
    Service.deleteMany({}),
    ServiceOption.deleteMany({}),
  ]);
  console.log("[seed] Cleared existing Business/Service/ServiceOption data");

  const business = await Business.create({
    name: "Example Hair Studio",
    phone: "000-000-0000",
    description: "Example seed business — edit or delete freely.",
    active: true,
  });

  const [braids, cornrows, straightUp] = await Service.create([
    { businessId: business._id, name: "Braids", description: "Example braid styles." },
    { businessId: business._id, name: "Cornrows", description: "Example cornrow styles." },
    {
      businessId: business._id,
      name: "Straight-up / Straight-back",
      description: "Example straight-up style.",
    },
  ]);

  await ServiceOption.create([
    { serviceId: braids._id, name: "Short", price: 30, durationMinutes: 120 },
    { serviceId: braids._id, name: "Medium", price: 40, durationMinutes: 180 },
    { serviceId: braids._id, name: "Long", price: 50, durationMinutes: 240 },
    { serviceId: cornrows._id, name: "Basic", price: 25, durationMinutes: 60 },
    { serviceId: straightUp._id, name: "Basic", price: 20, durationMinutes: 45 },
  ]);

  console.log("[seed] Inserted example business, services, and options");

  await mongoose.disconnect();
  console.log("[seed] Done. Disconnected from MongoDB.");
  process.exit(0);
};

seed().catch((error) => {
  console.error("[seed] Failed:", error.message);
  process.exit(1);
});