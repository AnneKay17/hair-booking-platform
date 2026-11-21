import { api } from "./apiClient";

export const login = async ({ email, password }) =>
  (await api.post("/auth/login", { email, password })).data.admin;

export const logout = () => api.post("/auth/logout", {});

export const getCurrentAdmin = async () => (await api.get("/auth/me")).data.admin;