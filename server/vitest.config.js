//Test-only environment. Setting MONGODB_URI to empty stops dotenv from ever loading your real connection string into tests.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-only-secret-test-only-secret-1234567890",
      CLIENT_URL: "http://localhost:5173",
      MONGODB_URI: "",
    },
  },
});