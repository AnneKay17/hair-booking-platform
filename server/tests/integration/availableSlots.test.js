//Integration tests for the DB-facing rules, against an in-memory MongoDB.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Business from "../../src/models/Business.js";
import Service from "../../src/models/Service.js";
import ServiceOption from "../../src/models/ServiceOption.js";
import Availability from "../../src/models/Availability.js";
import { getAvailableSlots } from "../../src/services/slotService.js";
import { AppError } from "../../src/utils/AppError.js";

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    Business.deleteMany({}),
    Service.deleteMany({}),
    ServiceOption.deleteMany({}),
    Availability.deleteMany({}),
  ]);
});

const FUTURE_DATE = "2099-06-15";
const PAST_DATE = "2000-01-01";

const seedBasics = async () => {
  const business = await Business.create({ name: "Test Studio" });
  const service = await Service.create({ businessId: business._id, name: "Cornrows" });
  const option = await ServiceOption.create({
    serviceId: service._id,
    name: "Basic",
    price: 25,
    durationMinutes: 60,
  });
  await Availability.create({
    businessId: business._id,
    date: FUTURE_DATE,
    startTime: "09:00",
    endTime: "12:00",
    status: "available",
  });
  return { business, service, option };
};

describe("getAvailableSlots (integration)", () => {
  it("returns generated slots for a valid business/date/service option", async () => {
    const { business, option } = await seedBasics();

    const slots = await getAvailableSlots({
      businessId: business._id,
      date: FUTURE_DATE,
      serviceOptionId: option._id,
    });

    expect(slots).toContainEqual({ startTime: "09:00", endTime: "10:00" });
    expect(slots).toContainEqual({ startTime: "11:00", endTime: "12:00" });
  });

  it("rejects an inactive service option", async () => {
    const { business, option } = await seedBasics();
    option.active = false;
    await option.save();

    await expect(
      getAvailableSlots({ businessId: business._id, date: FUTURE_DATE, serviceOptionId: option._id })
    ).rejects.toThrow(AppError);
  });

  it("rejects a service option belonging to a different business", async () => {
    const { option } = await seedBasics();
    const otherBusiness = await Business.create({ name: "Other Studio" });

    await expect(
      getAvailableSlots({
        businessId: otherBusiness._id,
        date: FUTURE_DATE,
        serviceOptionId: option._id,
      })
    ).rejects.toThrow(AppError);
  });

  it("rejects an invalid date", async () => {
    const { business, option } = await seedBasics();

    await expect(
      getAvailableSlots({ businessId: business._id, date: "not-a-date", serviceOptionId: option._id })
    ).rejects.toThrow(AppError);
  });

  it("rejects a past date", async () => {
    const { business, option } = await seedBasics();

    await expect(
      getAvailableSlots({ businessId: business._id, date: PAST_DATE, serviceOptionId: option._id })
    ).rejects.toThrow(AppError);
  });

  it("returns an empty array when there is no availability for the requested date", async () => {
    const { business, option } = await seedBasics();

    const slots = await getAvailableSlots({
      businessId: business._id,
      date: "2099-06-16", // no Availability document seeded for this date
      serviceOptionId: option._id,
    });

    expect(slots).toEqual([]);
  });

  it("rejects a nonexistent service option", async () => {
    const { business } = await seedBasics();
    const fakeId = new mongoose.Types.ObjectId();

    await expect(
      getAvailableSlots({ businessId: business._id, date: FUTURE_DATE, serviceOptionId: fakeId })
    ).rejects.toThrow(AppError);
  });
});