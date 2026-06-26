import { execFileSync } from "node:child_process";
import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

// Ask the OS for a currently-free ephemeral port. Runs in a short-lived child
// node process so the lookup stays synchronous at config-load time without
// adding a dependency.
function findFreePort(): number {
  const script =
    "const s = require('net').createServer();" +
    "s.listen(0, '127.0.0.1', () => {" +
    "const { port } = s.address();" +
    "s.close(() => process.stdout.write(String(port)));" +
    "});";
  const out = execFileSync(process.execPath, ["-e", script], {
    encoding: "utf8",
  });
  return Number.parseInt(out.trim(), 10);
}

// Parse a string into a valid TCP port (an integer in [1, 65535]) or return
// null when it is missing, non-numeric, or out of range. This keeps the local
// dev server from being pointed at an impossible address like
// http://localhost:0 when PORT is set to a bad value.
function parsePort(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535
    ? parsed
    : null;
}

// Single source of truth for the dev server port. CI keeps the fixed 3000 it
// has always used. Local runs honor an explicit PORT or otherwise pick a free
// port, so a stale or foreign server on 3000 is never reused as if it were ours.
//
// Playwright re-evaluates this config in every worker process, so the chosen
// port is cached in the environment: the main process resolves it once and boots
// one webServer, and the workers inherit the same value instead of each picking
// its own (unused) port and hitting a connection-refused.
function resolvePort(): number {
  const cached = process.env.PLAYWRIGHT_E2E_PORT;
  if (cached) {
    const cachedPort = parsePort(cached);
    if (cachedPort === null) {
      throw new Error(
        `PLAYWRIGHT_E2E_PORT is set to an invalid port: "${cached}". ` +
          "Expected an integer in [1, 65535]."
      );
    }
    return cachedPort;
  }

  // CI always uses 3000 and ignores PORT. Locally an explicit PORT is honored
  // only when it is a valid in-range port; anything else (0, negative, out of
  // range, or non-numeric) falls back to an auto-selected free port.
  const explicit = isCI ? 3000 : parsePort(process.env.PORT);
  const chosen = explicit ?? findFreePort();
  process.env.PLAYWRIGHT_E2E_PORT = String(chosen);
  return chosen;
}

const port = resolvePort();
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // One worker everywhere. CI already ran serially; pinning it locally too
  // removes the cross-worker contention on the single shared server that made
  // the scrub-to-end assertions flake.
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: isCI
      ? "npm run start"
      : `npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    // Never silently adopt a foreign server. CI was already false; local now
    // always boots its own correct build on the resolved port.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
