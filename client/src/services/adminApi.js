import { api } from "./apiClient";

const qs = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
};

export const getDashboard = async () => (await api.get("/admin/dashboard")).data;

export const listBookings = async (params) => (await api.get(`/admin/bookings${qs(params)}`)).data;
export const changeBookingStatus = async (id, status) =>
  (await api.patch(`/admin/bookings/${id}/status`, { status })).data;

export const listAvailability = async (params) =>
  (await api.get(`/admin/availability${qs(params)}`)).data;
export const createAvailability = async (body) => (await api.post("/admin/availability", body)).data;
export const updateAvailability = async (id, changes) =>
  (await api.patch(`/admin/availability/${id}`, changes)).data;
export const deleteAvailability = async (id) => (await api.delete(`/admin/availability/${id}`)).data;

export const listServices = async () => (await api.get("/admin/services")).data;
export const createService = async (body) => (await api.post("/admin/services", body)).data;
export const updateService = async (id, changes) =>
  (await api.patch(`/admin/services/${id}`, changes)).data;
export const createOption = async (serviceId, body) =>
  (await api.post(`/admin/services/${serviceId}/options`, body)).data;
export const updateOption = async (id, changes) =>
  (await api.patch(`/admin/service-options/${id}`, changes)).data;