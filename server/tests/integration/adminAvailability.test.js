import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";

import app from "../../src/app.js";
import Availability from "../../src/models/Availability.js";
import {
  clearDatabase,
  loginAgent,
  makeBooking,
  seedCatalog,
  startTestDb,
  stopTestDb,
} from "../helpers/adminTestUtils.js";

const DATE = "2099-07-01";
let agent;
let fx;

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDatabase();
  fx = await seedCatalog();
  await Availability.deleteMany({}); // start each test with no availability
  agent = await loginAgent();
});

const add = (body) => agent.post("/api/admin/availability").send(body);
const addWindow = async (startTime, endTime, date = DATE) => (await add({ date, startTime, endTime })).body.data;
const bookingAt = (startTime, endTime, overrides = {}) =>
  makeBooking(fx, { date: DATE, startTime, endTime, ...overrides });

describe("adding availability", () => {
  it("creates an availability period and lists it", async () => {
    const res = await add({ date: DATE, startTime: "09:00", endTime: "18:00" });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ date: DATE, startTime: "09:00", endTime: "18:00", status: "available" });

    const list = await agent.get(`/api/admin/availability?startDate=${DATE}&endDate=${DATE}`);
    expect(list.body.data).toHaveLength(1);
  });

  it.each([
    ["end before start", { date: DATE, startTime: "18:00", endTime: "09:00" }],
    ["zero length", { date: DATE, startTime: "09:00", endTime: "09:00" }],
    ["malformed time", { date: DATE, startTime: "9am", endTime: "17:00" }],
    ["invalid date", { date: "2099-13-45", startTime: "09:00", endTime: "17:00" }],
    ["past date", { date: "2000-01-01", startTime: "09:00", endTime: "17:00" }],
    ["missing fields", { date: DATE }],
    ["blocked status", { date: DATE, startTime: "09:00", endTime: "17:00", status: "blocked" }],
  ])("rejects %s", async (_label, body) => {
    expect((await add(body)).status).toBe(400);
    expect(await Availability.countDocuments()).toBe(0);
  });

  it("rejects an overlapping period but allows an adjacent one", async () => {
    await addWindow("09:00", "12:00");
    expect((await add({ date: DATE, startTime: "11:00", endTime: "14:00" })).status).toBe(409);
    expect((await add({ date: DATE, startTime: "12:00", endTime: "15:00" })).status).toBe(201);
  });

  it("feeds the existing slot generation", async () => {
    await addWindow("09:00", "12:00");
    const res = await request(app).get(`/api/availability/slots?date=${DATE}&serviceOptionId=${fx.option.id}`);
    const starts = res.body.data.map((s) => s.startTime);
    expect(starts).toContain("11:00");
    expect(starts).not.toContain("11:30"); // a 60-minute service would end at 12:30
  });
});

describe("editing availability", () => {
  it("edits a period", async () => {
    const window = await addWindow("09:00", "18:00");
    const res = await agent.patch(`/api/admin/availability/${window.id}`).send({ endTime: "17:00" });
    expect(res.status).toBe(200);
    expect(res.body.data.endTime).toBe("17:00");
  });

  it("rejects an invalid edit and leaves the period unchanged", async () => {
    const window = await addWindow("09:00", "18:00");
    expect((await agent.patch(`/api/admin/availability/${window.id}`).send({ endTime: "08:00" })).status).toBe(400);
    expect((await Availability.findById(window.id)).endTime).toBe("18:00");
  });

  it("blocks shrinking a period past an active booking, naming the booking", async () => {
    const window = await addWindow("09:00", "18:00");
    const booking = await bookingAt("14:00", "15:00");

    const blocked = await agent.patch(`/api/admin/availability/${window.id}`).send({ endTime: "13:00" });
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain(booking.bookingReference);
    expect((await Availability.findById(window.id)).endTime).toBe("18:00");

    const ok = await agent.patch(`/api/admin/availability/${window.id}`).send({ endTime: "16:00" });
    expect(ok.status).toBe(200);
  });

  it("blocks moving a period to another date while a booking depends on it", async () => {
    const window = await addWindow("09:00", "18:00");
    await bookingAt("14:00", "15:00");
    expect((await agent.patch(`/api/admin/availability/${window.id}`).send({ date: "2099-07-02" })).status).toBe(409);
  });
});

describe("removing availability", () => {
  it("removes an empty period", async () => {
    const window = await addWindow("09:00", "18:00");
    expect((await agent.delete(`/api/admin/availability/${window.id}`)).status).toBe(200);
    expect(await Availability.countDocuments()).toBe(0);
  });

  it("blocks removal while a pending or confirmed booking depends on it", async () => {
    const window = await addWindow("09:00", "18:00");
    await bookingAt("14:00", "15:00");
    expect((await agent.delete(`/api/admin/availability/${window.id}`)).status).toBe(409);
    expect(await Availability.countDocuments()).toBe(1);
  });

  it("allows removal when the only booking is cancelled, rejected or completed", async () => {
    const window = await addWindow("09:00", "18:00");
    await bookingAt("14:00", "15:00", { status: "Cancelled" });
    await bookingAt("15:00", "16:00", { status: "Rejected" });
    await bookingAt("16:00", "17:00", { status: "Completed" });
    expect((await agent.delete(`/api/admin/availability/${window.id}`)).status).toBe(200);
  });

  it("treats adjacent periods as one range when checking a booking that spans them", async () => {
    await addWindow("09:00", "12:00");
    const second = await addWindow("12:00", "15:00");
    await bookingAt("11:30", "12:30"); // spans the join

    expect((await agent.delete(`/api/admin/availability/${second.id}`)).status).toBe(409);
  });

  it("allows removing a period that no booking depends on", async () => {
    await addWindow("09:00", "12:00");
    const second = await addWindow("12:00", "15:00");
    await bookingAt("10:00", "11:00");

    expect((await agent.delete(`/api/admin/availability/${second.id}`)).status).toBe(200);
  });

  it("returns 404 for an unknown period", async () => {
    expect((await agent.delete("/api/admin/availability/000000000000000000000000")).status).toBe(404);
  });
});

describe("authentication", () => {
  it("requires login", async () => {
    expect((await request(app).post("/api/admin/availability").send({})).status).toBe(401);
    expect((await request(app).get("/api/admin/availability")).status).toBe(401);
  });
});