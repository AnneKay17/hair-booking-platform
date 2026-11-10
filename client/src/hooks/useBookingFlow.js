import { useMemo, useReducer } from "react";
import { bookingFlowReducer, initialState } from "./bookingFlowReducer";

export default function useBookingFlow() {
  const [state, dispatch] = useReducer(bookingFlowReducer, initialState);

  const actions = useMemo(
    () => ({
      selectService: (service) => dispatch({ type: "SELECT_SERVICE", service }),
      selectOption: (option) => dispatch({ type: "SELECT_OPTION", option }),
      selectDate: (date) => dispatch({ type: "SELECT_DATE", date }),
      selectSlot: (slot) => dispatch({ type: "SELECT_SLOT", slot }),
      setDetails: (changes) => dispatch({ type: "SET_DETAILS", changes }),
      goToStep: (step) => dispatch({ type: "GO_TO_STEP", step }),
      submitStart: () => dispatch({ type: "SUBMIT_START" }),
      submitFailed: (message) => dispatch({ type: "SUBMIT_FAILED", message }),
      submitConflict: () => dispatch({ type: "SUBMIT_CONFLICT" }),
    }),
    []
  );

  return [state, actions];
}