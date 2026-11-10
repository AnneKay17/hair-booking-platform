import { describe, it, expect } from "vitest";
import { formatDuration, formatPrice } from "./formatters";

describe("formatters", () => {
  it("formats prices", () => {
    expect(formatPrice(30)).toBe("R30");
    expect(formatPrice(45.5)).toBe("R45.50");
  });

  it("formats durations", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
    expect(formatDuration(120)).toBe("2 hrs");
    expect(formatDuration(240)).toBe("4 hrs");
  });
});