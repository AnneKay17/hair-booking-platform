import { describe, it, expect } from "vitest";
import {
  addMonths,
  compareMonths,
  formatDateLong,
  getMonthGrid,
  getMonthRange,
  getTodayString,
  toDateString,
} from "./dateUtils";

describe("dateUtils", () => {
  it("pads date strings", () => {
    expect(toDateString(2026, 3, 5)).toBe("2026-03-05");
  });

  it("returns today's date as YYYY-MM-DD", () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formats dates without shifting the day", () => {
    const tuesday = formatDateLong("2026-10-20");
    expect(tuesday).toContain("Tuesday");
    expect(tuesday).toContain("20");
    expect(tuesday).toContain("October");

    expect(formatDateLong("2026-03-01")).toContain("1 March");
    expect(formatDateLong("2026-12-31")).toContain("31");
    expect(formatDateLong("2026-12-31")).toContain("December");
  });

  it("builds a Monday-first month grid", () => {
    // 1 October 2026 is a Thursday -> three leading blanks
    const grid = getMonthGrid(2026, 10);
    expect(grid.slice(0, 3)).toEqual([null, null, null]);
    expect(grid[3]).toBe("2026-10-01");
    expect(grid[grid.length - 1]).toBe("2026-10-31");
    expect(grid).toHaveLength(34);
  });

  it("handles leap years", () => {
    expect(getMonthGrid(2028, 2).filter(Boolean)).toHaveLength(29);
    expect(getMonthGrid(2027, 2).filter(Boolean)).toHaveLength(28);
  });

  it("adds and compares months across year boundaries", () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(compareMonths({ year: 2027, month: 1 }, { year: 2026, month: 11 })).toBe(2);
  });

  it("clips a month range so it never starts before today", () => {
    expect(getMonthRange(2026, 10, "2026-10-12")).toEqual({
      startDate: "2026-10-12",
      endDate: "2026-10-31",
    });
    expect(getMonthRange(2026, 11, "2026-10-12")).toEqual({
      startDate: "2026-11-01",
      endDate: "2026-11-30",
    });
  });
});