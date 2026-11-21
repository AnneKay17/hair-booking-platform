import { describe, it, expect } from "vitest";
import { TRANSITIONS, getAllowedStatusChanges } from "../../src/services/adminBooking.service.js";
import { getCurrentTimeMinutes, getTodayDateString } from "../../src/utils/timeUtils.js";

describe("booking status transitions", () => {
  it("lets a Pending booking be confirmed, rejected or cancelled", () => {
    expect(TRANSITIONS.Pending).toEqual(["Confirmed", "Rejected", "Cancelled"]);
  });

  it("lets a Confirmed booking be cancelled or completed only", () => {
    expect(TRANSITIONS.Confirmed).toEqual(["Cancelled", "Completed"]);
  });

  it("treats Rejected, Cancelled and Completed as final", () => {
    expect(TRANSITIONS.Rejected).toEqual([]);
    expect(TRANSITIONS.Cancelled).toEqual([]);
    expect(TRANSITIONS.Completed).toEqual([]);
  });

  it("never allows moving back to Pending", () => {
    Object.values(TRANSITIONS).forEach((targets) => expect(targets).not.toContain("Pending"));
  });

  it("only offers Completed once the appointment has started", () => {
    const future = { status: "Confirmed", date: "2099-01-01", startTime: "09:00" };
    const past = { status: "Confirmed", date: "2000-01-01", startTime: "09:00" };
    expect(getAllowedStatusChanges(future)).toEqual(["Cancelled"]);
    expect(getAllowedStatusChanges(past)).toEqual(["Cancelled", "Completed"]);
  });
});

describe("business time helpers", () => {
  it("returns today as YYYY-MM-DD and the time as minutes since midnight", () => {
    expect(getTodayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const minutes = getCurrentTimeMinutes();
    expect(Number.isInteger(minutes)).toBe(true);
    expect(minutes).toBeGreaterThanOrEqual(0);
    expect(minutes).toBeLessThan(1440);
  });
});