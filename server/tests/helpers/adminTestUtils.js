import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../../src/app.js";
import Admin from "../../src/models/Admin.js";
import Business from "../../src/models/Business.js";
import Service from "../../src/models/Service.js";
import ServiceOption from "../../src/models/ServiceOption.js";
import Availability from "../../src/models/Availability.js";
import Booking from "../../src/models/Booking.js";
import { hashPassword } from "../../src/services/auth.service.js";

export const ADMIN_CREDENTIALS = { email: "owner@example.test", password: "a-long-test-password" };
export const FUTURE_DATE = "2099-06-15";

let mongod;

export const startTestDb = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const stopTestDb = async () => {
  await mongoose.disconnect();
  await mongod.stop();
};

export const clearDatabase = () =>
  Promise.all(
    [Admin, Business, Service, ServiceOption, Availability, Booking].map((model) => model.deleteMany({}))
  );

export const createAdmin = async () =>
  Admin.create({
    email: ADMIN_CREDENTIALS.email,
    name: "Test Owner",
    passwordHash: await hashPassword(ADMIN_CREDENTIALS.password),
  });

/** A supertest agent that is logged in and keeps the session cookie. */
export const loginAgent = async () => {
  if (!(await Admin.exists({ email: ADMIN_CREDENTIALS.email }))) await createAdmin();
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/login").send(ADMIN_CREDENTIALS);
  if (response.status !== 200) throw new Error(`Test login failed with ${response.status}`);
  return agent;
};

export const seedCatalog = async () => {
  const business = await Business.create({ name: "Test Studio" });
  const service = await Service.create({ businessId: business._id, name: "Cornrows" });
  const option = await ServiceOption.create({
    serviceId: service._id,
    name: "Basic",
    price: 250,
    durationMinutes: 60,
  });
  await Availability.create({
    businessId: business._id,
    date: FUTURE_DATE,
    startTime: "09:00",
    endTime: "18:00",
    status: "available",
  });
  return { business, service, option };
};

let referenceCounter = 0;

/** Inserts a booking directly (bypasses the public API so any date/status can be used). */
export const makeBooking = ({ business, service, option }, overrides = {}) =>
  Booking.create({
    businessId: business._id,
    customerName: "Jane Doe",
    customerPhone: "0821234567",
    serviceId: service._id,
    serviceOptionId: option._id,
    serviceName: service.name,
    serviceOptionName: option.name,
    durationMinutes: option.durationMinutes,
    price: option.price,
    date: FUTURE_DATE,
    startTime: "09:30",
    endTime: "10:30",
    status: "Pending",
    bookingReference: `HB-T${String(++referenceCounter).padStart(5, "0")}`,
    ...overrides,
  });