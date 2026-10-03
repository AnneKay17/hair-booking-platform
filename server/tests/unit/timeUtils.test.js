//Confirms time/date parsing does exactly what it should and never drifts.
import { describe, it, expect } from "vitest";
import {
  isValidDateString,
  isValidTimeString,
  timeToMinutes,
  minutesToTime,
  isPastDate,
} from "../../src/utils/timeUtils.js";

describe("timeUtils", () => {
  it("accepts valid HH:MM times", () => {
    expect(isValidTimeString("09:30")).toBe(true);
    expect(isValidTimeString("00:00")).toBe(true);
    expect(isValidTimeString("23:59")).toBe(true);
  });

  it("rejects malformed times", () => {
    expect(isValidTimeString("9:30")).toBe(false);
    expect(isValidTimeString("24:00")).toBe(false);
    expect(isValidTimeString("12:60")).toBe(false);
    expect(isValidTimeString("not-a-time")).toBe(false);
  });

  it("converts HH:MM to minutes and back without drift", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(timeToMinutes("17:45"))).toBe("17:45");
  });

  it("never shifts 09:30 into another hour — no timezone math is involved", () => {
    expect(timeToMinutes("09:30")).toBe(9 * 60 + 30);
    expect(minutesToTime(9 * 60 + 30)).toBe("09:30");
  });

  it("validates real calendar dates", () => {
    expect(isValidDateString("2026-10-03")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false); // Feb 30 doesn't exist
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("not-a-date")).toBe(false);
  });

  it("flags dates before today as past", () => {
    expect(isPastDate("2000-01-01")).toBe(true);
    expect(isPastDate("2999-01-01")).toBe(false);
  });
});