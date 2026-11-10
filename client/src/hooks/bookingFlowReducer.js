export const STEPS = [
  { id: "service", label: "Style" },
  { id: "option", label: "Option" },
  { id: "datetime", label: "Date & time" },
  { id: "details", label: "Your details" },
  { id: "review", label: "Review" },
];

export const STEP_INDEX = { service: 0, option: 1, datetime: 2, details: 3, review: 4 };

export const initialState = {
  step: STEP_INDEX.service,
  service: null,
  option: null,
  date: null,
  slot: null, // { startTime, endTime } as returned by the backend
  details: { name: "", phone: "", notes: "" },
  refreshKey: 0, // bumped to force dates/slots to reload after a conflict
  submitting: false,
  submitError: null,
  conflict: false,
};

export function bookingFlowReducer(state, action) {
  switch (action.type) {
    case "SELECT_SERVICE": {
      // Re-selecting the same service keeps the chosen option.
      if (state.service?.id === action.service.id) {
        return { ...state, step: STEP_INDEX.option };
      }
      return {
        ...state,
        service: action.service,
        option: null,
        date: null,
        slot: null,
        conflict: false,
        submitError: null,
        step: STEP_INDEX.option,
      };
    }

    case "SELECT_OPTION": {
      if (state.option?.id === action.option.id) {
        return { ...state, step: STEP_INDEX.datetime };
      }
      // A different option has a different duration, so dates/times must be re-chosen.
      return {
        ...state,
        option: action.option,
        date: null,
        slot: null,
        conflict: false,
        submitError: null,
        step: STEP_INDEX.datetime,
      };
    }

    case "SELECT_DATE":
      if (state.date === action.date) return state;
      return { ...state, date: action.date, slot: null, conflict: false };

    case "SELECT_SLOT":
      return { ...state, slot: action.slot, conflict: false };

    case "SET_DETAILS":
      return { ...state, details: { ...state.details, ...action.changes } };

    case "GO_TO_STEP":
      return {
        ...state,
        step: Math.min(Math.max(action.step, 0), STEPS.length - 1),
        submitError: null,
      };

    case "SUBMIT_START":
      return { ...state, submitting: true, submitError: null };

    case "SUBMIT_FAILED":
      return { ...state, submitting: false, submitError: action.message };

    // HTTP 409: the slot was taken. Send the customer back to pick another time.
    case "SUBMIT_CONFLICT":
      return {
        ...state,
        submitting: false,
        submitError: null,
        slot: null,
        conflict: true,
        refreshKey: state.refreshKey + 1,
        step: STEP_INDEX.datetime,
      };

    default:
      return state;
  }
}