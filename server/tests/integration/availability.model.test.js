//Schema-level validation tests. Pure .validate() calls, no live DB connection needed.
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Availability from "../../src/models/Availability.js";

describe("Availability model validation", () => {
  const businessId = new mongoose.Types.ObjectId();

  it("rejects a zero-duration period (startTime equals endTime)", async () => {
    const doc = new Availability({
      businessId,
      date: "2099-01-01",
      startTime: "10:00",
      endTime: "10:00",
    });
    await expect(doc.validate()).rejects.toThrow();
  });

  it("rejects startTime after endTime", async () => {
    const doc = new Availability({
      businessId,
      date: "2099-01-01",
      startTime: "11:00",
      endTime: "09:00",
    });
    await expect(doc.validate()).rejects.toThrow();
  });

  it("rejects a malformed date", async () => {
    const doc = new Availability({
      businessId,
      date: "2099-13-40",
      startTime: "09:00",
      endTime: "10:00",
    });
    await expect(doc.validate()).rejects.toThrow();
  });

  it("rejects a malformed time", async () => {
    const doc = new Availability({
      businessId,
      date: "2099-01-01",
      startTime: "9am",
      endTime: "10:00",
    });
    await expect(doc.validate()).rejects.toThrow();
  });

  it("accepts a well-formed period", async () => {
    const doc = new Availability({
      businessId,
      date: "2099-01-01",
      startTime: "09:00",
      endTime: "18:00",
    });
    await expect(doc.validate()).resolves.toBeUndefined();
  });
});