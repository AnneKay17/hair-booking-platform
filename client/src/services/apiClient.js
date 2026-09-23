const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Thin fetch wrapper that returns parsed JSON and throws on non-2xx responses.
 *
 * @param {string} path - Path relative to the API base, e.g. "/health"
 * @param {RequestInit} [options]
 */
export const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }

  return data;
};

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
};

export const getHealth = () => api.get("/health");