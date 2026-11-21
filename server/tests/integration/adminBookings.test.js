import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";

import app from "../../src/app.js";
import Booking from "../../src/models/Booking.js";
import { getTodayDateString } from "../../src/utils/timeUtils.js";
import {
  FUTURE_DATE,
  clearDatabase,
  loginAgent,
  makeBooking,
  seedCatalog,
  startTestDb,
  stopTestDb,
} from "../helpers/adminTestUtils.js";

let agent;
let fx;

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDatabase();
  fx = await seedCatalog();
  agent = await loginAgent();
});

const setStatus = (id, status) => agent.patch(`/api/admin/bookings/${id}/status`).send({ status });

describe("viewing and filtering bookings", () => {
  it("lists bookings with customer details and the stored snapshot", async () => {
    await makeBooking(fx);
    const res = await agent.get("/api/admin/bookings");

    expect(res.status).toBe(200);
    expect(res.body.data.items[0]).toMatchObject({
      customerName: "Jane Doe",
      customerPhone: "0821234567",
      serviceName: "Cornrows",
      serviceOptionName: "Basic",
      price: 250,
      durationMinutes: 60,
      date: FUTURE_DATE,
      startTime: "09:30",
      endTime: "10:30",
      status: "Pending",
    });
  });

  it("filters by status and rejects an unknown status", async () => {
    await makeBooking(fx, { startTime: "09:00", endTime: "10:00" });
    await makeBooking(fx, { status: "Confirmed", startTime: "11:00", endTime: "12:00" });

    const confirmed = await agent.get("/api/admin/bookings?status=Confirmed");
    expect(confirmed.body.data.items).toHaveLength(1);
    expect(confirmed.body.data.items[0].status).toBe("Confirmed");

    expect((await agent.get("/api/admin/bookings?status=Bogus")).status).toBe(400);
  });

  it("filters by a specific date and rejects an invalid one", async () => {
    await makeBooking(fx);
    await makeBooking(fx, { date: "2099-06-16" });

    const res = await agent.get("/api/admin/bookings?date=2099-06-16");
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].date).toBe("2099-06-16");

    expect((await agent.get("/api/admin/bookings?date=nope")).status).toBe(400);
  });

  it("separates upcoming from past bookings", async () => {
    await makeBooking(fx);
    await makeBooking(fx, { date: "2000-01-01" });

    expect((await agent.get("/api/admin/bookings")).body.data.items).toHaveLength(1);
    expect((await agent.get("/api/admin/bookings?when=past")).body.data.items).toHaveLength(1);
    expect((await agent.get("/api/admin/bookings?when=all")).body.data.items).toHaveLength(2);
    expect((await agent.get("/api/admin/bookings?when=sometime")).status).toBe(400);
  });

  it("searches by name, phone and reference", async () => {
    const booking = await makeBooking(fx, { customerName: "Thandi Nkosi", customerPhone: "0831112222" });
    await makeBooking(fx, { startTime: "12:00", endTime: "13:00" });

    for (const term of ["thandi", "0831112", booking.bookingReference.slice(0, 7)]) {
      const res = await agent.get(`/api/admin/bookings?search=${encodeURIComponent(term)}`);
      expect(res.body.data.items.map((b) => b.id)).toContain(booking.id);
    }
    const none = await agent.get("/api/admin/bookings?search=zzzzzz");
    expect(none.body.data.items).toHaveLength(0);
  });

  it("returns booking details, 404 for unknown ids and 400 for malformed ids", async () => {
    const booking = await makeBooking(fx);
    expect((await agent.get(`/api/admin/bookings/${booking.id}`)).body.data.customerPhone).toBe("0821234567");
    expect((await agent.get("/api/admin/bookings/000000000000000000000000")).status).toBe(404);
    expect((await agent.get("/api/admin/bookings/not-an-id")).status).toBe(400);
  });
});

describe("changing booking status", () => {
  it("confirms a pending booking", async () => {
    const booking = await makeBooking(fx);
    const res = await setStatus(booking.id, "Confirmed");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Confirmed");
    expect((await Booking.findById(booking.id)).status).toBe("Confirmed");
  });

  it("rejects a pending booking", async () => {
    const booking = await makeBooking(fx);
    expect((await setStatus(booking.id, "Rejected")).body.data.status).toBe("Rejected");
  });

  it("cancels pending and confirmed bookings", async () => {
    const pending = await makeBooking(fx, { startTime: "09:00", endTime: "10:00" });
    const confirmed = await makeBooking(fx, { status: "Confirmed", startTime: "11:00", endTime: "12:00" });
    expect((await setStatus(pending.id, "Cancelled")).status).toBe(200);
    expect((await setStatus(confirmed.id, "Cancelled")).status).toBe(200);
  });

  it("completes a confirmed booking whose appointment has started, and keeps it stored", async () => {
    const booking = await makeBooking(fx, { status: "Confirmed", date: "2000-01-01" });
    const res = await setStatus(booking.id, "Completed");
    expect(res.status).toBe(200);
    expect(await Booking.countDocuments({ _id: booking.id, status: "Completed" })).toBe(1);
  });

  it("refuses to complete a booking that has not started yet", async () => {
    const booking = await makeBooking(fx, { status: "Confirmed" });
    expect((await setStatus(booking.id, "Completed")).status).toBe(409);
  });

  it("refuses to complete a booking that was never confirmed", async () => {
    const booking = await makeBooking(fx, { date: "2000-01-01" });
    expect((await setStatus(booking.id, "Completed")).status).toBe(409);
  });

  it.each([
    ["Cancelled", "Confirmed"],
    ["Rejected", "Confirmed"],
    ["Completed", "Cancelled"],
    ["Cancelled", "Completed"],
    ["Confirmed", "Rejected"],
    ["Confirmed", "Confirmed"],
    ["Confirmed", "Pending"],
  ])("blocks the invalid change %s -> %s", async (from, to) => {
    const booking = await makeBooking(fx, { status: from, date: "2000-01-01" });
    const res = await setStatus(booking.id, to);
    expect(res.status).toBe(409);
    expect((await Booking.findById(booking.id)).status).toBe(from);
  });

  it("rejects an unknown or missing target status", async () => {
    const booking = await makeBooking(fx);
    expect((await setStatus(booking.id, "Archived")).status).toBe(400);
    expect((await agent.patch(`/api/admin/bookings/${booking.id}/status`).send({})).status).toBe(400);
  });

  it("requires authentication", async () => {
    const booking = await makeBooking(fx);
    const res = await request(app).patch(`/api/admin/bookings/${booking.id}/status`).send({ status: "Confirmed" });
    expect(res.status).toBe(401);
  });
});

describe("slots after status changes (public API)", () => {
  it("frees a slot when a pending booking is rejected", async () => {
    const body = {
      serviceId: fx.service.id,
      serviceOptionId: fx.option.id,
      date: FUTURE_DATE,
      startTime: "09:30",
      customerName: "First Customer",
      customerPhone: "0821111111",
    };

    const first = await request(app).post("/api/bookings").send(body);
    expect(first.status).toBe(201);
    expect((await request(app).post("/api/bookings").send({ ...body, customerName: "Second" })).status).toBe(409);

    const stored = await Booking.findOne({ bookingReference: first.body.data.bookingReference });
    expect((await setStatus(stored.id, "Rejected")).status).toBe(200);

    const retry = await request(app).post("/api/bookings").send({ ...body, customerName: "Second Customer" });
    expect(retry.status).toBe(201);
  });
});

describe("dashboard", () => {
  it("summarises today, pending and upcoming confirmed bookings", async () => {
    const today = getTodayDateString();
    await makeBooking(fx, { date: today, status: "Confirmed", startTime: "09:00", endTime: "10:00" });
    await makeBooking(fx, { date: "2000-01-01" }); // old, never handled: still needs attention
    await makeBooking(fx, { status: "Confirmed", startTime: "13:00", endTime: "14:00" });
    await makeBooking(fx, { status: "Cancelled", startTime: "15:00", endTime: "16:00" });

    const res = await agent.get("/api/admin/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.data.counts).toEqual({ today: 1, pending: 1, upcomingConfirmed: 1 });
    expect(res.body.data.todaysBookings).toHaveLength(1);
    expect(res.body.data.pending).toHaveLength(1);
    expect(res.body.data.upcomingConfirmed).toHaveLength(1);
  });
});