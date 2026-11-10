//Frontend API client for the future booking UI — no components built yet.
import { api } from "./apiClient";

/** Active services, each with its active options (price + durationMinutes). */
export const getServices = async () => (await api.get("/services")).data;