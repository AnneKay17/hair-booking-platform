import { describe, it, expect } from "vitest";
import {
  isPlausibleBookingReference,
  normalizeBookingReference,
  validateCustomerDetails,
} from "./validation";

const valid = { name: "Jane Doe", phone: "0821234567", notes: "" };

describe("validateCustomerDetails", () => {
  it("accepts valid details", () => {
    expect(validateCustomerDetails(valid)).toEqual({});
  });

  it("requires a name (whitespace only is empty)", () => {
    expect(validateCustomerDetails({ ...valid, name: "   " }).name).toBeDefined();
  });

  it("requires a phone number", () => {
    expect(validateCustomerDetails({ ...valid, phone: "" }).phone).toBeDefined();
  });

  it("accepts common phone formats", () => {
    expect(validateCustomerDetails({ ...valid, phone: "+27 82 123 4567" }).phone).toBeUndefined();
    expect(validateCustomerDetails({ ...valid, phone: "(082) 123-4567" }).phone).toBeUndefined();
  });

  it("rejects too-short or non-phone input", () => {
    expect(validateCustomerDetails({ ...valid, phone: "12345" }).phone).toBeDefined();
    expect(validateCustomerDetails({ ...valid, phone: "call me maybe" }).phone).toBeDefined();
  });

  it("rejects overly long notes", () => {
    expect(validateCustomerDetails({ ...valid, notes: "x".repeat(501) }).notes).toBeDefined();
  });
});

describe("booking reference helpers", () => {
  it("normalizes common ways of typing a reference", () => {
    expect(normalizeBookingReference("hb-4k9x2r")).toBe("HB-4K9X2R");
    expect(normalizeBookingReference("  4K9X2R ")).toBe("HB-4K9X2R");
    expect(normalizeBookingReference("HB4K9X2R")).toBe("HB-4K9X2R");
  });

  it("recognises plausible references only", () => {
    expect(isPlausibleBookingReference("HB-4K9X2R")).toBe(true);
    expect(isPlausibleBookingReference("HB-123")).toBe(false);
    expect(isPlausibleBookingReference("nonsense")).toBe(false);
  });
});