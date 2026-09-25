//Frontend API client for the future booking UI — no components built yet.
import { api } from "./apiClient";

/**
 * Fetches active services (with their active options) for the customer-facing
 * booking flow. Not wired into any UI yet — Phase 2 only adds the API client.
 */
export const getServices = () => api.get("/services");