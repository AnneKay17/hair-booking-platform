import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";

import app from "../../src/app.js";
import Service from "../../src/models/Service.js";
import ServiceOption from "../../src/models/ServiceOption.js";
import {
  FUTURE_DATE,
  clearDatabase,
  loginAgent,
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

const bookingBody = (overrides = {}) => ({
  serviceId: fx.service.id,
  serviceOptionId: fx.option.id,
  date: FUTURE_DATE,
  startTime: "09:30",
  customerName: "Alice Customer",
  customerPhone: "0821234567",
  notes: "private note",
  ...overrides,
});

const publicServices = async () => (await request(app).get("/api/services")).body.data;

describe("service management", () => {
  it("lists every service and option, including inactive ones, for the admin", async () => {
    const inactive = await Service.create({ businessId: fx.business._id, name: "Hidden", active: false });
    await ServiceOption.create({ serviceId: inactive._id, name: "Old", price: 10, durationMinutes: 30, active: false });

    const res = await agent.get("/api/admin/services");
    expect(res.status).toBe(200);
    const hidden = res.body.data.find((s) => s.name === "Hidden");
    expect(hidden.active).toBe(false);
    expect(hidden.options[0].active).toBe(false);

    expect((await publicServices()).map((s) => s.name)).toEqual(["Cornrows"]);
  });

  it("adds a service", async () => {
    const res = await agent.post("/api/admin/services").send({ name: "Twists", description: "Two-strand twists" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Twists");
    expect(res.body.data.active).toBe(true);
  });

  it("rejects a service with no name", async () => {
    expect((await agent.post("/api/admin/services").send({ description: "x" })).status).toBe(400);
  });

  it("edits a service", async () => {
    const res = await agent.patch(`/api/admin/services/${fx.service.id}`).send({ name: "Cornrows Deluxe" });
    expect(res.status).toBe(200);
    expect((await Service.findById(fx.service.id)).name).toBe("Cornrows Deluxe");
  });
});

describe("option management", () => {
  const addOption = (body) => agent.post(`/api/admin/services/${fx.service.id}/options`).send(body);

  it("adds an option", async () => {
    const res = await addOption({ name: "Long", price: 400, durationMinutes: 180 });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: "Long", price: 400, durationMinutes: 180, active: true });
  });

  it.each([
    ["negative price", { name: "X", price: -1, durationMinutes: 60 }],
    ["zero duration", { name: "X", price: 10, durationMinutes: 0 }],
    ["fractional duration", { name: "X", price: 10, durationMinutes: 45.5 }],
    ["missing name", { price: 10, durationMinutes: 60 }],
    ["missing price", { name: "X", durationMinutes: 60 }],
  ])("rejects %s", async (_label, body) => {
    expect((await addOption(body)).status).toBe(400);
  });

  it("edits an option's price and duration", async () => {
    const res = await agent.patch(`/api/admin/service-options/${fx.option.id}`).send({ price: 300, durationMinutes: 75 });
    expect(res.status).toBe(200);
    const stored = await ServiceOption.findById(fx.option.id);
    expect([stored.price, stored.durationMinutes]).toEqual([300, 75]);
  });

  it("rejects an invalid option edit", async () => {
    expect((await agent.patch(`/api/admin/service-options/${fx.option.id}`).send({ price: -5 })).status).toBe(400);
    expect((await agent.patch(`/api/admin/service-options/${fx.option.id}`).send({ durationMinutes: 0 })).status).toBe(400);
  });
});

describe("deactivation", () => {
  it("hides an inactive option from customers and blocks booking it", async () => {
    await agent.patch(`/api/admin/service-options/${fx.option.id}`).send({ active: false });

    expect((await publicServices())[0].options).toHaveLength(0);
    const res = await request(app).post("/api/bookings").send(bookingBody());
    expect(res.status).toBe(400);
  });

  it("hides an inactive service from customers and blocks booking and slots", async () => {
    await agent.patch(`/api/admin/services/${fx.service.id}`).send({ active: false });

    expect(await publicServices()).toHaveLength(0);
    expect((await request(app).post("/api/bookings").send(bookingBody())).status).toBe(400);
    const slots = await request(app).get(`/api/availability/slots?date=${FUTURE_DATE}&serviceOptionId=${fx.option.id}`);
    expect(slots.status).toBe(400);
  });

  it("can be reactivated", async () => {
    await agent.patch(`/api/admin/services/${fx.service.id}`).send({ active: false });
    await agent.patch(`/api/admin/services/${fx.service.id}`).send({ active: true });
    expect(await publicServices()).toHaveLength(1);
  });

  it("never deletes records: the soft-delete route only deactivates", async () => {
    await agent.delete(`/api/admin/service-options/${fx.option.id}`);
    expect((await ServiceOption.findById(fx.option.id)).active).toBe(false);
  });
});

describe("public booking and history", () => {
  it("still lets a customer book", async () => {
    const res = await request(app).post("/api/bookings").send(bookingBody());
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: "Pending", price: 250, durationMinutes: 60, endTime: "10:30" });
  });

  it("keeps the original price and duration after the option changes", async () => {
    const created = await request(app).post("/api/bookings").send(bookingBody());
    const reference = created.body.data.bookingReference;

    await agent.patch(`/api/admin/service-options/${fx.option.id}`).send({ price: 999, durationMinutes: 90 });

    const lookup = await request(app).get(`/api/bookings/${reference}`);
    expect(lookup.body.data).toMatchObject({ price: 250, durationMinutes: 60, endTime: "10:30" });

    const list = await agent.get("/api/admin/bookings?when=all");
    const stored = list.body.data.items.find((b) => b.bookingReference === reference);
    expect(stored).toMatchObject({ price: 250, durationMinutes: 60 });
  });

  it("does not expose the full name, phone or notes in the public lookup", async () => {
    const created = await request(app).post("/api/bookings").send(bookingBody());
    const lookup = await request(app).get(`/api/bookings/${created.body.data.bookingReference}`);

    expect(lookup.body.data.customerName).toBe("Alice C.");
    expect(JSON.stringify(lookup.body)).not.toContain("0821234567");
    expect(JSON.stringify(lookup.body)).not.toContain("private note");
  });
});

describe("authentication", () => {
  it("requires login for service management", async () => {
    expect((await request(app).get("/api/admin/services")).status).toBe(401);
    expect((await request(app).post("/api/admin/services").send({ name: "X" })).status).toBe(401);
    expect((await request(app).patch(`/api/admin/service-options/${fx.option.id}`).send({ price: 1 })).status).toBe(401);
  });
});