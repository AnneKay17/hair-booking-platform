//The core scheduling-logic tests — pure function, no database.
import { describe, it, expect } from "vitest";
import { computeAvailableSlots } from "../../src/services/slotService.js";

describe("computeAvailableSlots", () => {
  it("Example 1: 09:00-18:00, 60min duration — 30-min-interval slots up to 17:00, excludes 17:30", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [{ startTime: "09:00", endTime: "18:00" }],
      durationMinutes: 60,
    });

    expect(slots[0]).toEqual({ startTime: "09:00", endTime: "10:00" });
    expect(slots).toContainEqual({ startTime: "09:30", endTime: "10:30" });
    expect(slots).toContainEqual({ startTime: "17:00", endTime: "18:00" });
    expect(slots.some((s) => s.startTime === "17:30")).toBe(false);
    expect(slots).toHaveLength(17); // 09:00..17:00 inclusive, every 30 min
  });

  it("Example 2: 09:00-12:00, 90min duration", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [{ startTime: "09:00", endTime: "12:00" }],
      durationMinutes: 90,
    });

    expect(slots).toEqual([
      { startTime: "09:00", endTime: "10:30" },
      { startTime: "09:30", endTime: "11:00" },
      { startTime: "10:00", endTime: "11:30" },
      { startTime: "10:30", endTime: "12:00" },
    ]);
  });

  it("Example 3: service longer than the whole availability period yields zero slots", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [{ startTime: "09:00", endTime: "10:00" }],
      durationMinutes: 120,
    });

    expect(slots).toEqual([]);
  });

  it("includes a slot ending exactly at availability end", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [{ startTime: "09:00", endTime: "10:00" }],
      durationMinutes: 60,
    });
    expect(slots).toEqual([{ startTime: "09:00", endTime: "10:00" }]);
  });

  it("excludes a slot that would end even one minute after availability end", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [{ startTime: "09:00", endTime: "09:59" }],
      durationMinutes: 60,
    });
    expect(slots).toEqual([]);
  });

  it("returns no slots when there is no availability at all", () => {
    const slots = computeAvailableSlots({ availabilityPeriods: [], durationMinutes: 60 });
    expect(slots).toEqual([]);
  });

  it("handles multiple, non-adjacent availability periods on the same day", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [
        { startTime: "09:00", endTime: "11:00" },
        { startTime: "14:00", endTime: "16:00" },
      ],
      durationMinutes: 60,
    });

    expect(slots).toContainEqual({ startTime: "09:00", endTime: "10:00" });
    expect(slots).toContainEqual({ startTime: "14:00", endTime: "15:00" });
    expect(slots.some((s) => s.startTime === "11:00")).toBe(false); // gap, not available
    expect(slots.some((s) => s.startTime === "13:30")).toBe(false); // gap, not available
  });

  it("treats two back-to-back (adjacent) periods as one continuous range", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [
        { startTime: "09:00", endTime: "12:00" },
        { startTime: "12:00", endTime: "15:00" },
      ],
      durationMinutes: 60,
    });

    // Valid because the business is continuously available 09:00-15:00.
    expect(slots).toContainEqual({ startTime: "11:30", endTime: "12:30" });
  });

  it("supports a duration that is not a multiple of 30 minutes", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [{ startTime: "09:00", endTime: "11:00" }],
      durationMinutes: 45,
    });

    // Start times stay on the 30-min grid; only the end time reflects the
    // odd duration.
    expect(slots).toEqual([
      { startTime: "09:00", endTime: "09:45" },
      { startTime: "09:30", endTime: "10:15" },
      { startTime: "10:00", endTime: "10:45" },
    ]);
  });

  it("excludes candidate times that overlap an existing booking", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [{ startTime: "09:00", endTime: "12:00" }],
      durationMinutes: 60,
      bookedIntervals: [{ startTime: "09:30", endTime: "10:30" }],
    });

    expect(slots.some((s) => s.startTime === "09:00")).toBe(false);
    expect(slots.some((s) => s.startTime === "09:30")).toBe(false);
    expect(slots.some((s) => s.startTime === "10:00")).toBe(false);
  });

  it("allows an appointment starting exactly when a booking ends (back-to-back)", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [{ startTime: "09:00", endTime: "12:00" }],
      durationMinutes: 60,
      bookedIntervals: [{ startTime: "09:30", endTime: "10:30" }],
    });

    expect(slots).toContainEqual({ startTime: "10:30", endTime: "11:30" });
  });

  it("allows an appointment ending exactly when a booking starts (back-to-back)", () => {
    const slots = computeAvailableSlots({
      availabilityPeriods: [{ startTime: "09:00", endTime: "12:00" }],
      durationMinutes: 30,
      bookedIntervals: [{ startTime: "09:30", endTime: "10:30" }],
    });

    expect(slots).toContainEqual({ startTime: "09:00", endTime: "09:30" });
  });

  it("rejects a non-positive duration", () => {
    expect(() =>
      computeAvailableSlots({ availabilityPeriods: [], durationMinutes: 0 })
    ).toThrow();
  });
});