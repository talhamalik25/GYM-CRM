// Database-free smoke checks only. This cannot verify authenticated workflows.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const reservation = createServer();
reservation.listen(0, "127.0.0.1");
await once(reservation, "listening");
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
// NextRequest normalizes loopback IPs to localhost; use the same canonical
// origin so this exercises legitimate same-origin writes without relaxing CSRF.
const origin = `http://localhost:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  // Empty values deliberately override Next's .env.local loading. Never fall
  // back to either application's or test cluster's credentials in this smoke.
  env: { ...process.env, NODE_ENV: "production", MONGODB_URI: "", MONGODB_TEST_URI: "", AUTH_SESSION_SECRET: randomBytes(32).toString("hex"), PUBLIC_REGISTRATION_ENABLED: "false", PUBLIC_TRIAL_PLAN_ID: "", CRON_SECRET: "", SAAS_EXPIRY_CRON_SECRET: "" },
  stdio: ["ignore", "ignore", "ignore"], windowsHide: true,
});
const stopped = once(server, "exit");
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error("The local smoke server failed to start.");
    try { ready = (await fetch(`${origin}/login`)).ok; } catch { /* Wait for our own local server only. */ }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, "Local server startup timed out.");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  const home = await page.goto(origin);
  assert.equal(home.status(), 200);
  assert.ok(await page.locator("h1").count());
  assert.equal(home.headers()["x-frame-options"], "DENY");
  assert.equal(home.headers()["x-content-type-options"], "nosniff");
  assert.equal(home.headers()["referrer-policy"], "same-origin");
  assert.equal(home.headers()["x-powered-by"], undefined);
  console.log("PASS landing fallback and security headers (database disabled)");
  await page.goto(`${origin}/login`);
  assert.equal(await page.locator('input[type="password"]').count(), 1);
  console.log("PASS login form renders");
  for (const path of ["/dashboard", "/admin", "/members", "/billing"]) {
    await page.goto(`${origin}${path}`);
    assert.equal(new URL(page.url()).pathname, "/login");
  }
  console.log("PASS protected page redirects");
  for (const path of ["/api/members", "/api/admin/billing", "/api/gym/billing"]) assert.equal((await page.request.get(`${origin}${path}`)).status(), 401);
  console.log("PASS unauthenticated business and billing APIs");
  assert.equal((await page.request.post(`${origin}/api/auth/login`, { headers: { origin: "https://evil.example" }, data: {} })).status(), 403);
  assert.equal((await page.request.post(`${origin}/api/auth/login`, { data: { padding: "x".repeat(17000) } })).status(), 413);
  console.log("PASS cross-origin and oversized login rejection");
  assert.equal((await page.request.post(`${origin}/api/auth/logout`, { headers: { origin } })).status(), 200);
  console.log("PASS idempotent logout without a session");
  assert.deepEqual(browserErrors, []);
  console.log("PASS no browser runtime errors");
} finally {
  if (browser) await browser.close();
  server.kill();
  await stopped;
}
