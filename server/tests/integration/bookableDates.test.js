import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Business from "../../src/models/Business.js";
import Service from "../../src/models/Service.js";
import ServiceOption from "../../src/models/ServiceOption.js";
import Availability from "../../src/models/Availability.js";
import Booking from "../../src/models/Booking.js";
import { getBookableDates } from "../../src/services/bookableDates.service.js";
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
    Booking.deleteMany({}),
  ]);
});

const D1 = "2099-06-15"; // 09:00-12:00 available
const D2 = "2099-06-16"; // 09:00-10:00 available (only room for one 60-min booking)
const D3 = "2099-06-17"; // 09:00-12:00 but status "blocked"
const RANGE = { startDate: "2099-06-01", endDate: "2099-06-30" };

const seed = async () => {
  const business = await Business.create({ name: "Test Studio" });
  const service = await Service.create({ businessId: business._id, name: "Cornrows" });
  const option = await ServiceOption.create({
    serviceId: service._id,
    name: "Basic",
    price: 25,
    durationMinutes: 60,
  });
  await Availability.create([
    { businessId: business._id, date: D1, startTime: "09:00", endTime: "12:00", status: "available" },
    { businessId: business._id, date: D2, startTime: "09:00", endTime: "10:00", status: "available" },
    { businessId: business._id, date: D3, startTime: "09:00", endTime: "12:00", status: "blocked" },
  ]);
  return { business, service, option };
};

const addBooking = ({ business, service, option }, overrides = {}) =>
  Booking.create({
    businessId: business._id,
    customerName: "Test Customer",
    customerPhone: "0821234567",
    serviceId: service._id,
    serviceOptionId: option._id,
    serviceName: "Cornrows",
    serviceOptionName: "Basic",
    durationMinutes: 60,
    price: 25,
    date: D2,
    startTime: "09:00",
    endTime: "10:00",
    status: "Pending",
    bookingReference: `HB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    ...overrides,
  });

describe("getBookableDates", () => {
  it("returns only dates with at least one bookable slot, and agrees with the slots service", async () => {
    const fixtures = await seed();
    await addBooking(fixtures); // fills D2 completely

    const dates = await getBookableDates({
      businessId: fixtures.business._id,
      serviceOptionId: fixtures.option._id,
      ...RANGE,
    });

    expect(dates).toEqual([D1]);

    for (const date of [D1, D2, D3]) {
      const slots = await getAvailableSlots({
        businessId: fixtures.business._id,
        date,
        serviceOptionId: fixtures.option._id,
      });
      expect(slots.length > 0).toBe(dates.includes(date));
    }
  });

  it("does not drop a date because of a Cancelled booking", async () => {
    const fixtures = await seed();
    await addBooking(fixtures, { status: "Cancelled" });

    const dates = await getBookableDates({
      businessId: fixtures.business._id,
      serviceOptionId: fixtures.option._id,
      ...RANGE,
    });

    expect(dates).toEqual([D1, D2]);
  });

  it("excludes dates where the service duration does not fit", async () => {
    const fixtures = await seed();
    const longOption = await ServiceOption.create({
      serviceId: fixtures.service._id,
      name: "Long",
      price: 80,
      durationMinutes: 120, // does not fit in D2's 60-minute window
    });

    const dates = await getBookableDates({
      businessId: fixtures.business._id,
      serviceOptionId: longOption._id,
      ...RANGE,
    });

    expect(dates).toEqual([D1]);
  });

  it("returns an empty list for a range entirely in the past", async () => {
    const fixtures = await seed();
    const dates = await getBookableDates({
      businessId: fixtures.business._id,
      serviceOptionId: fixtures.option._id,
      startDate: "2020-01-01",
      endDate: "2020-02-01",
    });
    expect(dates).toEqual([]);
  });

  it("rejects invalid input", async () => {
    const fixtures = await seed();
    const base = { businessId: fixtures.business._id, serviceOptionId: fixtures.option._id, ...RANGE };

    await expect(getBookableDates({ ...base, startDate: "nope" })).rejects.toThrow(AppError);
    await expect(getBookableDates({ ...base, endDate: "2099-13-45" })).rejects.toThrow(AppError);
    await expect(
      getBookableDates({ ...base, startDate: "2099-06-30", endDate: "2099-06-01" })
    ).rejects.toThrow(AppError);
    await expect(
      getBookableDates({ ...base, startDate: "2099-01-01", endDate: "2099-12-31" })
    ).rejects.toThrow(AppError);
    await expect(getBookableDates({ ...base, serviceOptionId: undefined })).rejects.toThrow(AppError);
  });

  it("rejects an inactive service option", async () => {
    const fixtures = await seed();
    fixtures.option.active = false;
    await fixtures.option.save();

    await expect(
      getBookableDates({
        businessId: fixtures.business._id,
        serviceOptionId: fixtures.option._id,
        ...RANGE,
      })
    ).rejects.toThrow(AppError);
  });
});