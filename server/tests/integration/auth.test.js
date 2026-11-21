import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../../src/app.js";
import Admin from "../../src/models/Admin.js";
import { env } from "../../src/config/env.js";
import { createLimiter } from "../../src/middleware/rateLimiters.js";
import {
  ADMIN_CREDENTIALS,
  clearDatabase,
  createAdmin,
  loginAgent,
  seedCatalog,
  startTestDb,
  stopTestDb,
} from "../helpers/adminTestUtils.js";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearDatabase);

describe("admin account setup", () => {
  it("stores a bcrypt hash and never exposes it", async () => {
    await createAdmin();

    const withHash = await Admin.findOne({ email: ADMIN_CREDENTIALS.email }).select("+passwordHash");
    expect(withHash.passwordHash).not.toBe(ADMIN_CREDENTIALS.password);
    expect(withHash.passwordHash).toMatch(/^\$2[aby]\$/);

    const plain = await Admin.findOne({ email: ADMIN_CREDENTIALS.email });
    expect(plain.passwordHash).toBeUndefined();
    expect(plain.toJSON().passwordHash).toBeUndefined();
  });

  it("has no public registration endpoint", async () => {
    const res = await request(app).post("/api/auth/register").send(ADMIN_CREDENTIALS);
    expect(res.status).toBe(404);
  });
});

describe("login", () => {
  it("succeeds with correct credentials and sets an HttpOnly cookie", async () => {
    await createAdmin();
    const res = await request(app).post("/api/auth/login").send(ADMIN_CREDENTIALS);

    expect(res.status).toBe(200);
    expect(res.body.data.admin.email).toBe(ADMIN_CREDENTIALS.email);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");

    const cookie = res.headers["set-cookie"].join(";");
    expect(cookie).toContain("admin_token=");
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("gives the same generic error for a wrong password and an unknown email", async () => {
    await createAdmin();
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: ADMIN_CREDENTIALS.email, password: "definitely-wrong" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.test", password: "definitely-wrong" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    expect(wrongPassword.headers["set-cookie"]).toBeUndefined();
  });

  it("rejects missing credentials", async () => {
    await createAdmin();
    expect((await request(app).post("/api/auth/login").send({})).status).toBe(400);
    expect((await request(app).post("/api/auth/login").send({ email: ADMIN_CREDENTIALS.email })).status).toBe(400);
    expect((await request(app).post("/api/auth/login").send({ password: "x" })).status).toBe(400);
  });

  it("rejects non-string credentials (NoSQL injection attempt)", async () => {
    await createAdmin();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });
});

describe("protected endpoints", () => {
  it("rejects a request with no session", async () => {
    const res = await request(app).get("/api/admin/bookings");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).get("/api/admin/bookings").set("Cookie", "admin_token=not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const admin = await createAdmin();
    const token = jwt.sign({ sub: admin.id, exp: Math.floor(Date.now() / 1000) - 60 }, env.jwtSecret, {
      algorithm: "HS256",
    });
    const res = await request(app).get("/api/admin/bookings").set("Cookie", `admin_token=${token}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const admin = await createAdmin();
    const token = jwt.sign({ sub: admin.id }, "some-other-secret-some-other-secret-123456");
    const res = await request(app).get("/api/admin/bookings").set("Cookie", `admin_token=${token}`);
    expect(res.status).toBe(401);
  });

  it("rejects a valid token once the admin no longer exists", async () => {
    const agent = await loginAgent();
    await Admin.deleteMany({});
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("accepts a valid session", async () => {
    const agent = await loginAgent();
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.admin.email).toBe(ADMIN_CREDENTIALS.email);
    expect(JSON.stringify(me.body)).not.toContain("passwordHash");
  });

  it("ends the session on logout", async () => {
    const agent = await loginAgent();
    expect((await agent.post("/api/auth/logout")).status).toBe(200);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });
});

describe("previously open endpoints and public endpoints", () => {
  it("no longer exposes management routes publicly", async () => {
    expect((await request(app).post("/api/services").send({ name: "Hacked" })).status).toBe(404);
    expect((await request(app).delete("/api/availability/000000000000000000000000")).status).toBe(404);
    expect((await request(app).patch("/api/service-options/000000000000000000000000").send({ price: 1 })).status).toBe(404);
  });

  it("keeps customer endpoints working without logging in", async () => {
    await seedCatalog();
    expect((await request(app).get("/api/health")).status).toBe(200);
    const services = await request(app).get("/api/services");
    expect(services.status).toBe(200);
    expect(services.body.data[0].name).toBe("Cornrows");
  });
});

describe("rate limiting", () => {
  it("returns 429 once the limit is exceeded", async () => {
    const limited = express();
    limited.get(
      "/ping",
      createLimiter({ windowMs: 60_000, limit: 2, message: "slow down", skip: () => false }),
      (_req, res) => res.json({ ok: true })
    );
    // eslint-disable-next-line no-unused-vars
    limited.use((err, _req, res, _next) => res.status(err.statusCode || 500).json({ message: err.message }));

    expect((await request(limited).get("/ping")).status).toBe(200);
    expect((await request(limited).get("/ping")).status).toBe(200);
    const blocked = await request(limited).get("/ping");
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toBe("slow down");
  });
});