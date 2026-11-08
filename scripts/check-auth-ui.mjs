// Uses the installed Next compiler and Playwright. No database or application API runs.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, readdir, mkdtemp } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const artifacts = process.env.AUTH_UI_ARTIFACTS || await mkdtemp(path.join(tmpdir(), "fitivo-auth-ui-"));
const { chromium } = require("playwright");
const webpackRuntime = require("next/dist/compiled/webpack/webpack");
const { webpack } = webpackRuntime;
await new Promise((resolve, reject) => {
  const compiler = webpack({
    mode: "development", devtool: false, context: root,
    entry: path.join(root, "tests/fixtures/auth-ui-entry.jsx"),
    output: { path: artifacts, filename: "auth-fixture.js" },
    resolve: { extensions: [".js", ".jsx"], alias: { "next/navigation": path.join(root, "tests/fixtures/auth-ui-router.js") } },
    module: { rules: [{ test: /\.[cm]?jsx?$/, exclude: /node_modules/, use: path.join(root, "tests/fixtures/auth-ui-loader.cjs") }] },
  });
  compiler.run((error, stats) => compiler.close(() => {
    if (error || stats.hasErrors()) reject(error || new Error(stats.toString({ all: false, errors: true })));
    else resolve();
  }));
});
const staticRoot = path.join(root, ".next/static");
const cssFiles = (await readdir(staticRoot, { recursive: true })).filter((name) => name.endsWith(".css"));
assert.ok(cssFiles.length, "Run the production build before browser checks");
const css = (await Promise.all(cssFiles.map((name) => readFile(path.join(staticRoot, name), "utf8")))).join("\n");
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) { response.writeHead(500); response.end("API must be intercepted by the test"); return; }
    if (url.pathname === "/auth-fixture.js") { response.setHeader("Content-Type", "text/javascript"); response.end(await readFile(path.join(artifacts, "auth-fixture.js"))); return; }
    if (url.pathname === "/styles.css") { response.setHeader("Content-Type", "text/css"); response.end(css); return; }
    if (url.pathname === "/logo.png" || url.pathname === "/_next/image") { response.setHeader("Content-Type", "image/png"); response.end(await readFile(path.join(root, "public/logo.png"))); return; }
    if (url.pathname.startsWith("/media/")) {
      const name = path.basename(url.pathname);
      response.end(await readFile(path.join(staticRoot, "media", name))); return;
    }
    response.setHeader("Content-Type", "text/html");
    response.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/auth-fixture.js"></script></body></html>');
  } catch { response.writeHead(404); response.end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(process.env.AUTH_UI_CHROME ? { executablePath: process.env.AUTH_UI_CHROME } : {});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }
async function open(screen, available = true) {
  await page.goto(`${base}/?screen=${screen}&available=${available ? "1" : "0"}`);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.evaluate(() => document.fonts.ready);
}
try {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [screen, available] of [["login", true], ["register", true], ["register", false]]) {
      await check(`${screen} ${available ? "open" : "closed"} at ${width}px`, async () => {
        await open(screen, available);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        const inputs = await page.locator("input").evaluateAll((elements) => elements.map((element) => ({ width: element.getBoundingClientRect().width, font: parseFloat(getComputedStyle(element).fontSize) })));
        assert.ok(inputs.every(({ width, font }) => width > 200 && font >= 16));
        await page.screenshot({ path: path.join(artifacts, `auth-${screen}-${available ? "open" : "closed"}-${width}.png`), fullPage: true });
      });
    }
  }
  await check("login required fields, invalid email and keyboard focus", async () => {
    await open("login");
    await page.getByRole("button", { name: "Sign in to your workspace" }).click();
    assert.equal(await page.locator("#login-email").evaluate((element) => element === document.activeElement), true);
    assert.equal(await page.getByText("Enter your email address.", { exact: true }).count(), 1);
    assert.equal(await page.getByText("Enter your password.", { exact: true }).count(), 1);
    await page.locator("#login-email").fill("invalid");
    await page.getByRole("button", { name: "Sign in to your workspace" }).click();
    assert.equal(await page.getByText("Enter a valid email address.", { exact: true }).count(), 1);
    await page.locator("#login-email").focus();
    await page.keyboard.press("Tab");
    assert.equal(await page.locator("#login-password").evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#login-password").getAttribute("type"), "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    assert.equal(await page.locator("#login-password").getAttribute("type"), "password");
  });
  await check("login loading, API error and retry", async () => {
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    await page.route("**/api/auth/login", async (route) => { await pending; await route.fulfill({ status: 401, json: { success: false, error: { message: "Invalid email or password." } } }); });
    await page.locator("#login-email").fill("synthetic@example.test");
    await page.locator("#login-password").fill("synthetic-password");
    await page.getByRole("button", { name: "Sign in to your workspace" }).click();
    await page.getByRole("button", { name: "Signing in…" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Signing in…" }).isDisabled(), true);
    release();
    await page.getByRole("alert").filter({ hasText: "Invalid email or password." }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Sign in to your workspace" }).isEnabled(), true);
    await page.unroute("**/api/auth/login");
  });
  await check("login network error and server-selected redirect", async () => {
    await page.route("**/api/auth/login", (route) => route.abort());
    await page.getByRole("button", { name: "Sign in to your workspace" }).click();
    await page.getByText("We couldn’t connect. Check your connection and try again.").waitFor();
    await page.unroute("**/api/auth/login");
    await page.route("**/api/auth/login", (route) => route.fulfill({ json: { success: true, data: { redirectTo: "/trainer" } } }));
    await page.getByRole("button", { name: "Sign in to your workspace" }).click();
    await page.waitForFunction(() => window.__authRedirect === "/trainer" && window.__authRefreshed);
  });
  await check("registration required fields, email and minimum password length", async () => {
    await open("register");
    assert.equal(await page.locator("form").evaluate((form) => form.checkValidity()), false);
    await page.locator("#register-full-name").fill("Synthetic Owner");
    await page.locator("#register-gym-name").fill("Synthetic Gym");
    await page.locator("#register-email").fill("invalid");
    assert.equal(await page.locator("#register-email").evaluate((input) => input.validity.typeMismatch), true);
    await page.locator("#register-email").fill("synthetic@example.test");
    await page.locator("#register-password").pressSequentially("short");
    assert.equal(await page.locator("#register-password").evaluate((input) => input.validity.tooShort), true);
    await page.locator("#register-password").fill("synthetic-password");
    assert.equal(await page.locator("form").evaluate((form) => form.checkValidity()), true);
  });
  await check("registration loading, server field errors and successful redirect", async () => {
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    await page.route("**/api/auth/register", async (route) => { await pending; await route.fulfill({ status: 400, json: { success: false, error: { message: "Please check your details.", fields: { gymName: "Choose a different gym name." } } } }); });
    await page.getByRole("button", { name: "Create owner account" }).click();
    await page.getByRole("button", { name: "Creating account…" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Creating account…" }).isDisabled(), true);
    release();
    await page.getByText("Choose a different gym name.").waitFor();
    assert.equal(await page.locator("#register-gym-name").getAttribute("aria-invalid"), "true");
    await page.unroute("**/api/auth/register");
    await page.route("**/api/auth/register", (route) => route.fulfill({ json: { success: true, data: { redirectTo: "/dashboard" } } }));
    await page.getByRole("button", { name: "Create owner account" }).click();
    await page.waitForFunction(() => window.__authRedirect === "/dashboard");
  });
  await check("availability gates and reduced motion", async () => {
    await open("login", false);
    assert.equal(await page.locator('a[href="/register"]').count(), 0);
    await open("register", false);
    assert.equal(await page.locator("form").count(), 0);
    assert.equal(await page.locator('a[href="/login"]').count(), 1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open("login");
    assert.equal(await page.getByRole("button", { name: "Show password" }).evaluate((element) => getComputedStyle(element).transitionDuration), "0s");
  });
  assert.deepEqual(errors, [], "No uncaught browser exceptions");
  console.log(`${passed} passed; 0 failed. Screenshots: ${artifacts}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
