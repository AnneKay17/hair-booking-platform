//The real test: a single-node replica set (so transactions are actually available), firing two simultaneous requests for the identical slot.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import Business from "../../src/models/Business.js";
import Service from "../../src/models/Service.js";
import ServiceOption from "../../src/models/ServiceOption.js";
import Availability from "../../src/models/Availability.js";
import Booking from "../../src/models/Booking.js";
import { createBooking } from "../../src/services/bookingService.js";

let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await replSet.waitUntilRunning();
  await mongoose.connect(replSet.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

beforeEach(async () => {
  await Promise.all([
    Business.deleteMany({}),
    Service.deleteMany({}),
    ServiceOption.deleteMany({}),
    Availability.deleteMany({}),
    Booking.deleteMany({}),
  ]);
});

describe("createBooking — concurrency (replica set, transactions enabled)", () => {
  it("allows only one of two simultaneous requests for the exact same slot to succeed", async () => {
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
      date: "2099-06-15",
      startTime: "09:00",
      endTime: "12:00",
      status: "available",
    });

    const bookingInput = {
      businessId: business._id,
      serviceId: service._id,
      serviceOptionId: option._id,
      date: "2099-06-15",
      startTime: "09:30",
      customerPhone: "0821234567",
    };

    const results = await Promise.allSettled([
      createBooking({ ...bookingInput, customerName: "Customer A" }),
      createBooking({ ...bookingInput, customerName: "Customer B" }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.statusCode).toBe(409);

    const blockingBookings = await Booking.find({
      businessId: business._id,
      date: "2099-06-15",
      status: { $in: ["Pending", "Confirmed"] },
    });
    expect(blockingBookings).toHaveLength(1); // exactly one booking was actually created
  }, 30000);
});