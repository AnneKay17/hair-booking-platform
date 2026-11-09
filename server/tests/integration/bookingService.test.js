//Standalone in-memory MongoDB — this exercises the non-transactional fallback path 
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Business from "../../src/models/Business.js";
import Service from "../../src/models/Service.js";
import ServiceOption from "../../src/models/ServiceOption.js";
import Availability from "../../src/models/Availability.js";
import Booking from "../../src/models/Booking.js";
import { createBooking, getBookingByReference } from "../../src/services/bookingService.js";
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

const FUTURE_DATE = "2099-06-15";
const PAST_DATE = "2000-01-01";

/** Business + Cornrows service with a 60-min "Basic" option and a 30-min
 * "Quick" option (the latter is used for before/after back-to-back tests),
 * plus 09:00–12:00 availability. */
const seedBasics = async () => {
  const business = await Business.create({ name: "Test Studio" });
  const service = await Service.create({ businessId: business._id, name: "Cornrows" });
  const option = await ServiceOption.create({
    serviceId: service._id,
    name: "Basic",
    price: 250,
    durationMinutes: 60,
  });
  const quickOption = await ServiceOption.create({
    serviceId: service._id,
    name: "Quick",
    price: 100,
    durationMinutes: 30,
  });
  await Availability.create({
    businessId: business._id,
    date: FUTURE_DATE,
    startTime: "09:00",
    endTime: "12:00",
    status: "available",
  });
  return { business, service, option, quickOption };
};

const baseInput = ({ business, service, option }, overrides = {}) => ({
  businessId: business._id,
  serviceId: service._id,
  serviceOptionId: option._id,
  date: FUTURE_DATE,
  startTime: "09:30",
  customerName: "Jane Customer",
  customerPhone: "0821234567",
  ...overrides,
});

describe("createBooking — basic creation", () => {
  it("creates a valid booking with a server-calculated endTime, price, and duration", async () => {
    const fixtures = await seedBasics();
    const booking = await createBooking(baseInput(fixtures));

    expect(booking.bookingReference).toMatch(/^HB-[A-Z0-9]{6}$/);
    expect(booking.status).toBe("Pending");
    expect(booking.price).toBe(250);
    expect(booking.durationMinutes).toBe(60);
    expect(booking.startTime).toBe("09:30");
    expect(booking.endTime).toBe("10:30");
    expect(booking.serviceName).toBe("Cornrows");
    expect(booking.serviceOptionName).toBe("Basic");

    const stored = await Booking.findById(booking._id);
    expect(stored).not.toBeNull();
  });

  it("generates unique references across separate bookings", async () => {
    const fixtures = await seedBasics();
    const b1 = await createBooking(baseInput(fixtures, { startTime: "09:00" }));
    const b2 = await createBooking(baseInput(fixtures, { startTime: "10:30" }));
    expect(b1.bookingReference).not.toBe(b2.bookingReference);
  });

  it("ignores any client-supplied price/duration/endTime/status (backend is the source of truth)", async () => {
    const fixtures = await seedBasics();
    const booking = await createBooking(
      baseInput(fixtures, { price: 1, durationMinutes: 1, endTime: "09:31", status: "Confirmed" })
    );
    // These fields don't even exist on the service input signature, so a
    // client attempting to inject them has no effect:
    expect(booking.price).toBe(250);
    expect(booking.durationMinutes).toBe(60);
    expect(booking.endTime).toBe("10:30");
    expect(booking.status).toBe("Pending");
  });
});

describe("createBooking — data integrity", () => {
  it("retains the original price and duration after the service option later changes", async () => {
    const fixtures = await seedBasics();
    const booking = await createBooking(baseInput(fixtures));

    fixtures.option.price = 9999;
    fixtures.option.durationMinutes = 999;
    await fixtures.option.save();

    const stored = await getBookingByReference(booking.bookingReference);
    expect(stored.price).toBe(250);
    expect(stored.durationMinutes).toBe(60);
  });
});

describe("createBooking — validation", () => {
  it("rejects a missing customerName", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { customerName: "" }))).rejects.toThrow(AppError);
  });

  it("rejects a missing customerPhone", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { customerPhone: "" }))).rejects.toThrow(AppError);
  });

  it("rejects a missing serviceId", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { serviceId: undefined }))).rejects.toThrow(AppError);
  });

  it("rejects a missing serviceOptionId", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { serviceOptionId: undefined }))).rejects.toThrow(AppError);
  });

  it("rejects a nonexistent serviceId", async () => {
    const fixtures = await seedBasics();
    await expect(
      createBooking(baseInput(fixtures, { serviceId: new mongoose.Types.ObjectId() }))
    ).rejects.toThrow(AppError);
  });

  it("rejects an inactive service", async () => {
    const fixtures = await seedBasics();
    fixtures.service.active = false;
    await fixtures.service.save();
    await expect(createBooking(baseInput(fixtures))).rejects.toThrow(AppError);
  });

  it("rejects a nonexistent serviceOptionId", async () => {
    const fixtures = await seedBasics();
    await expect(
      createBooking(baseInput(fixtures, { serviceOptionId: new mongoose.Types.ObjectId() }))
    ).rejects.toThrow(AppError);
  });

  it("rejects a service option belonging to a different service", async () => {
    const fixtures = await seedBasics();
    const otherService = await Service.create({ businessId: fixtures.business._id, name: "Braids" });
    const otherOption = await ServiceOption.create({
      serviceId: otherService._id,
      name: "Short",
      price: 300,
      durationMinutes: 120,
    });
    await expect(
      createBooking(baseInput(fixtures, { serviceOptionId: otherOption._id }))
    ).rejects.toThrow(AppError);
  });

  it("rejects an invalid date", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { date: "not-a-date" }))).rejects.toThrow(AppError);
  });

  it("rejects a past date", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { date: PAST_DATE }))).rejects.toThrow(AppError);
  });

  it("rejects an invalid time format", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { startTime: "9:30am" }))).rejects.toThrow(AppError);
  });

  it("rejects a non-30-minute start time", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { startTime: "09:15" }))).rejects.toThrow(AppError);
  });
});

describe("createBooking — availability enforcement", () => {
  it("allows a booking starting exactly at availability start", async () => {
    const fixtures = await seedBasics();
    const booking = await createBooking(baseInput(fixtures, { startTime: "09:00" }));
    expect(booking.startTime).toBe("09:00");
  });

  it("allows a booking ending exactly at availability end", async () => {
    const fixtures = await seedBasics();
    const booking = await createBooking(baseInput(fixtures, { startTime: "11:00" })); // 11:00-12:00
    expect(booking.endTime).toBe("12:00");
  });

  it("rejects a start time outside any availability period", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { startTime: "14:00" }))).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("rejects an appointment that would extend beyond availability end", async () => {
    const fixtures = await seedBasics();
    await expect(createBooking(baseInput(fixtures, { startTime: "11:30" }))).rejects.toMatchObject({
      statusCode: 409,
    }); // 11:30 + 60min = 12:30, past the 12:00 availability end
  });

  it("rejects when there is no availability at all for the date", async () => {
    const fixtures = await seedBasics();
    await expect(
      createBooking(baseInput(fixtures, { date: "2099-06-16" }))
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects when the service duration is longer than the entire availability period", async () => {
    const fixtures = await seedBasics();
    const longOption = await ServiceOption.create({
      serviceId: fixtures.service._id,
      name: "Extra Long",
      price: 500,
      durationMinutes: 240, // longer than the 09:00-12:00 (180 min) window
    });
    await expect(
      createBooking(baseInput(fixtures, { serviceOptionId: longOption._id, startTime: "09:00" }))
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("createBooking — conflict handling", () => {
  it("rejects an overlapping booking", async () => {
    const fixtures = await seedBasics();
    await createBooking(baseInput(fixtures, { startTime: "09:30" })); // 09:30-10:30, Pending

    await expect(
      createBooking(baseInput(fixtures, { startTime: "10:00" })) // overlaps 10:00-11:00
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("allows a booking back-to-back immediately after an existing one", async () => {
    const fixtures = await seedBasics();
    await createBooking(baseInput(fixtures, { startTime: "09:30" })); // 09:30-10:30

    const second = await createBooking(baseInput(fixtures, { startTime: "10:30" })); // 10:30-11:30
    expect(second.startTime).toBe("10:30");
  });

  it("allows a booking back-to-back immediately before an existing one", async () => {
    const fixtures = await seedBasics();
    await createBooking(baseInput(fixtures, { startTime: "09:30" })); // 09:30-10:30

    const second = await createBooking(
      baseInput(fixtures, { serviceOptionId: fixtures.quickOption._id, startTime: "09:00" }) // 09:00-09:30
    );
    expect(second.endTime).toBe("09:30");
  });

  it("does not block on a Cancelled booking", async () => {
    const fixtures = await seedBasics();
    const first = await createBooking(baseInput(fixtures, { startTime: "09:30" }));
    await Booking.findByIdAndUpdate(first._id, { status: "Cancelled" });

    const second = await createBooking(baseInput(fixtures, { startTime: "10:00" })); // would've overlapped
    expect(second.startTime).toBe("10:00");
  });

  it("does not block on a Rejected booking", async () => {
    const fixtures = await seedBasics();
    const first = await createBooking(baseInput(fixtures, { startTime: "09:30" }));
    await Booking.findByIdAndUpdate(first._id, { status: "Rejected" });

    const second = await createBooking(baseInput(fixtures, { startTime: "10:00" }));
    expect(second.startTime).toBe("10:00");
  });

  it("blocks on a Confirmed booking", async () => {
    const fixtures = await seedBasics();
    const first = await createBooking(baseInput(fixtures, { startTime: "09:30" }));
    await Booking.findByIdAndUpdate(first._id, { status: "Confirmed" });

    await expect(
      createBooking(baseInput(fixtures, { startTime: "10:00" }))
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("getBookingByReference", () => {
  it("retrieves a booking by its reference", async () => {
    const fixtures = await seedBasics();
    const created = await createBooking(baseInput(fixtures));
    const found = await getBookingByReference(created.bookingReference);
    expect(found._id.toString()).toBe(created._id.toString());
  });

  it("throws a 404 for an unknown reference", async () => {
    await expect(getBookingByReference("HB-ZZZZZZ")).rejects.toMatchObject({ statusCode: 404 });
  });
});