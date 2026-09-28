import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so the React Router plugin isn't loaded in tests.
export default defineConfig({
  test: {
    environment: "node",
  },
});
