import { describe, it, expect } from "vitest";
import { bookingFlowReducer, initialState, STEP_INDEX } from "./bookingFlowReducer";

const braids = { id: "s1", name: "Braids", options: [] };
const cornrows = { id: "s2", name: "Cornrows", options: [] };
const short = { id: "o1", name: "Short", price: 30, durationMinutes: 120 };
const medium = { id: "o2", name: "Medium", price: 40, durationMinutes: 180 };
const slot = { startTime: "09:30", endTime: "11:30" };

const run = (...actions) => actions.reduce(bookingFlowReducer, initialState);

describe("bookingFlowReducer", () => {
  it("selecting a service moves to the option step", () => {
    const state = run({ type: "SELECT_SERVICE", service: braids });
    expect(state.service).toBe(braids);
    expect(state.step).toBe(STEP_INDEX.option);
  });

  it("changing the service resets option, date and time", () => {
    const state = run(
      { type: "SELECT_SERVICE", service: braids },
      { type: "SELECT_OPTION", option: short },
      { type: "SELECT_DATE", date: "2026-11-12" },
      { type: "SELECT_SLOT", slot },
      { type: "SELECT_SERVICE", service: cornrows }
    );
    expect(state.service).toBe(cornrows);
    expect(state.option).toBeNull();
    expect(state.date).toBeNull();
    expect(state.slot).toBeNull();
  });

  it("re-selecting the same service keeps the chosen option", () => {
    const state = run(
      { type: "SELECT_SERVICE", service: braids },
      { type: "SELECT_OPTION", option: short },
      { type: "SELECT_SERVICE", service: braids }
    );
    expect(state.option).toBe(short);
    expect(state.step).toBe(STEP_INDEX.option);
  });

  it("changing the option resets date and time", () => {
    const state = run(
      { type: "SELECT_SERVICE", service: braids },
      { type: "SELECT_OPTION", option: short },
      { type: "SELECT_DATE", date: "2026-11-12" },
      { type: "SELECT_SLOT", slot },
      { type: "SELECT_OPTION", option: medium }
    );
    expect(state.option).toBe(medium);
    expect(state.date).toBeNull();
    expect(state.slot).toBeNull();
  });

  it("selecting a different date clears the chosen time", () => {
    const state = run(
      { type: "SELECT_DATE", date: "2026-11-12" },
      { type: "SELECT_SLOT", slot },
      { type: "SELECT_DATE", date: "2026-11-13" }
    );
    expect(state.slot).toBeNull();
  });

  it("a booking conflict returns to the date/time step, clears the slot and forces a refresh", () => {
    const before = run(
      { type: "SELECT_SERVICE", service: braids },
      { type: "SELECT_OPTION", option: short },
      { type: "SELECT_DATE", date: "2026-11-12" },
      { type: "SELECT_SLOT", slot },
      { type: "GO_TO_STEP", step: STEP_INDEX.review },
      { type: "SUBMIT_START" }
    );
    const state = bookingFlowReducer(before, { type: "SUBMIT_CONFLICT" });

    expect(state.step).toBe(STEP_INDEX.datetime);
    expect(state.slot).toBeNull();
    expect(state.date).toBe("2026-11-12");
    expect(state.conflict).toBe(true);
    expect(state.submitting).toBe(false);
    expect(state.refreshKey).toBe(before.refreshKey + 1);
  });

  it("choosing a new time clears the conflict flag", () => {
    const conflicted = bookingFlowReducer(initialState, { type: "SUBMIT_CONFLICT" });
    const state = bookingFlowReducer(conflicted, { type: "SELECT_SLOT", slot });
    expect(state.conflict).toBe(false);
  });

  it("a failed submit keeps the customer's selections and shows the error", () => {
    const state = run(
      { type: "SELECT_DATE", date: "2026-11-12" },
      { type: "SELECT_SLOT", slot },
      { type: "SUBMIT_START" },
      { type: "SUBMIT_FAILED", message: "Nope" }
    );
    expect(state.submitting).toBe(false);
    expect(state.submitError).toBe("Nope");
    expect(state.slot).toBe(slot);
  });
});