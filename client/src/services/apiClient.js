const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  /**
   * @param {string} message - Safe to show to customers
   * @param {number} status - HTTP status, or 0 if the server couldn't be reached
   */
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Thin fetch wrapper returning parsed JSON. Throws ApiError on network
 * failure or any non-2xx response.
 */
export const request = async (path, options = {}) => {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "We couldn't reach the server. Please check your connection and try again.",
      0
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      response.status >= 500
        ? "Something went wrong on our side. Please try again in a moment."
        : data?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data;
};

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
};

export const getHealth = () => api.get("/health");