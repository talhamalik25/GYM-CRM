// @ts-check
import { test, expect } from "@playwright/test";

/*
 * Auth UI browser tests — isolated (no production MongoDB).
 * The dev server runs with PUBLIC_REGISTRATION_ENABLED=false,
 * so the login page renders normally and the register page shows
 * the "Registration closed" state. Both are valid UI states to verify.
 */

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the login form with expected elements", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Good to see you again");
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("#login-email-error")).toContainText("Enter your email");
    await expect(page.locator("#login-password-error")).toContainText("Enter your password");
  });

  test("shows email format error for invalid email", async ({ page }) => {
    await page.fill("#login-email", "not-an-email");
    await page.fill("#login-password", "somepassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("#login-email-error")).toContainText("valid email");
  });

  test("clears field error when user types", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("#login-email-error")).toBeVisible();
    await page.fill("#login-email", "user@example.com");
    await expect(page.locator("#login-email-error")).not.toBeVisible();
  });

  test("password visibility toggle works", async ({ page }) => {
    const passwordInput = page.locator("#login-password");
    const toggle = page.getByRole("button", { name: /show password/i });

    await expect(passwordInput).toHaveAttribute("type", "password");
    await toggle.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: /hide password/i })).toBeVisible();

    await page.getByRole("button", { name: /hide password/i }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("submit button shows loading state on valid submission", async ({ page }) => {
    // Intercept the API call so it hangs (simulating loading)
    await page.route("/api/auth/login", (route) => {
      // Don't respond — let the loading state persist
      setTimeout(() => route.fulfill({ status: 401, body: JSON.stringify({ success: false, error: { message: "Invalid credentials." } }) }), 2000);
    });

    await page.fill("#login-email", "user@example.com");
    await page.fill("#login-password", "password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Verify loading state appears
    await expect(page.getByText(/signing in/i)).toBeVisible();
  });

  test("displays form error from failed API response", async ({ page }) => {
    await page.route("/api/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { message: "Invalid email or password." } }),
      });
    });

    await page.fill("#login-email", "user@example.com");
    await page.fill("#login-password", "password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.locator("[role='alert']")).toContainText("Invalid email or password");
  });

  test("has no horizontal overflow at 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("has no horizontal overflow at 768px tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/login");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("has no horizontal overflow at 1280px desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("shows split-screen layout on desktop (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    // The aside panel should be visible at lg+ breakpoints
    const aside = page.locator("aside");
    await expect(aside).toBeVisible();
    await expect(aside).toContainText("More focus on");
  });

  test("hides left panel on mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    const aside = page.locator("aside");
    await expect(aside).toBeHidden();
  });

  test("form is keyboard-navigable", async ({ page }) => {
    await page.locator("#login-email").focus();
    await expect(page.locator("#login-email")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#login-password")).toBeFocused();

    await page.keyboard.press("Tab");
    // Next tab should reach the show/hide password button
    const toggleButton = page.getByRole("button", { name: /show password/i });
    await expect(toggleButton).toBeFocused();
  });

  test("Enter key submits the form", async ({ page }) => {
    let submitted = false;
    await page.route("/api/auth/login", (route) => {
      submitted = true;
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { message: "test" } }),
      });
    });

    await page.fill("#login-email", "user@example.com");
    await page.fill("#login-password", "password123");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    expect(submitted).toBe(true);
  });

  test("registration link visible when registrationAvailable", async ({ page }) => {
    // Without DB, registrationAvailable is false, so link should not appear
    const regLink = page.getByRole("link", { name: /free trial/i });
    await expect(regLink).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Register page (registration closed state)
// ---------------------------------------------------------------------------

test.describe("Register page (closed state)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("shows registration closed message", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Your next chapter starts here");
    await expect(page.getByText(/registration is currently closed/i)).toBeVisible();
  });

  test("has sign-in link", async ({ page }) => {
    const signInLink = page.getByRole("link", { name: /sign in to fitivo/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/login");
  });

  test("has contact link", async ({ page }) => {
    const contactLink = page.getByRole("link", { name: /contact the team/i });
    await expect(contactLink).toBeVisible();
  });

  test("has no horizontal overflow at 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("has no horizontal overflow at 1280px desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/register");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

// ---------------------------------------------------------------------------
// Responsive screenshots
// ---------------------------------------------------------------------------

test.describe("Visual screenshots", () => {
  const viewports = [
    { name: "mobile-375", width: 375, height: 812 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "desktop-1280", width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test(`login at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `tests/e2e/screenshots/login-${vp.name}.png`, fullPage: true });
    });

    test(`register at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/register");
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `tests/e2e/screenshots/register-${vp.name}.png`, fullPage: true });
    });
  }
});
