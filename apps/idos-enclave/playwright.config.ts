import { defineConfig } from "@playwright/test";

const baseURL = "https://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: true,
  use: { baseURL, browserName: "chromium", ignoreHTTPSErrors: true },
  webServer: {
    command: "pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    // The preview server uses a self-signed mkcert cert; the readiness check
    // needs to tolerate it just like the browser does.
    ignoreHTTPSErrors: true,
  },
});
