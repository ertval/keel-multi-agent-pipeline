import { defineConfig, devices } from "@playwright/test";

// Bind and probe the same literal address. `localhost` can resolve to ::1 on
// Node 24 while Next has bound 127.0.0.1 (or vice versa), which makes the
// readiness probe miss a live server and forces a doomed second spawn.
const HOST = "127.0.0.1";
const PORT = 3000;
const BASE_URL = `http://${HOST}:${PORT}`;

// The API's CORS allowlist is a list of *origins*, so the browser has to
// present one it names. The API defaults to `http://localhost:3000`, so the
// tests navigate by name while the server stays bound and probed by address —
// the two have to disagree, or the API answers the fetch with no
// `Access-Control-Allow-Origin` and every data-backed assertion sees an empty
// page. Set KEEL_CORS_ORIGINS to add this origin if the API is reconfigured.
const ORIGIN_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html"]] : "list",
  // `next dev` compiles each route on first request, so the default 30s
  // per-test budget is not enough for the multi-page demo workflow.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: ORIGIN_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // No `--` separator: `pnpm dev -- --port 3000` forwards the literal `--` to
    // `next dev`, which then reads `--hostname` as a positional project dir.
    command: `pnpm dev --hostname ${HOST} --port ${PORT}`,
    // `/favicon.ico` is served straight off disk from `app/favicon.ico` and
    // never enters the React render tree, so it answers 200 as soon as Next is
    // listening. Playwright treats any non-2xx/3xx as "not up", which would
    // otherwise make it ignore a running server (breaking
    // `reuseExistingServer`) and spawn a second one -> EADDRINUSE.
    url: `${BASE_URL}/favicon.ico`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
