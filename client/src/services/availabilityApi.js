import { api } from "./apiClient";

const toQuery = (params) => new URLSearchParams(params).toString();

/** Dates in [startDate, endDate] that have at least one bookable slot. */
export const getBookableDates = async ({ serviceOptionId, startDate, endDate }) => {
  const query = toQuery({ serviceOptionId, startDate, endDate });
  return (await api.get(`/availability/dates?${query}`)).data;
};

/** Available start times for a date and service option: [{ startTime, endTime }] */
export const getSlots = async ({ serviceOptionId, date }) => {
  const query = toQuery({ serviceOptionId, date });
  return (await api.get(`/availability/slots?${query}`)).data;
};