// @ts-check
import { test, expect } from "@playwright/test";

test.describe("Marketing Localization & Language Switching", () => {
  test("loads in English by default per strict policy", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("h1#hero-title")).toContainText("Your entire gym");
  });

  test("switches to Urdu immediately without reload and sets RTL", async ({ page }) => {
    await page.goto("/");
    const switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();

    // Select Urdu (either suggested button or option)
    const urduOption = page.locator('button:has-text("اردو")').first();
    await urduOption.click();

    // Verify instant DOM update without reload
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ur-PK");
    await expect(page.locator("h1#hero-title")).toContainText("آپ کا پورا جم");
  });

  test("switches to Arabic immediately without reload and sets RTL", async ({ page }) => {
    await page.goto("/");
    const switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();

    // Select Arabic from option list
    const arabicOption = page.locator('button:has-text("العربية")').first();
    await arabicOption.click();

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar-SA");
    await expect(page.locator("h1#hero-title")).toContainText("ناديك الرياضي بالكامل");
  });

  test("switching back to English restores English content and LTR", async ({ page }) => {
    await page.goto("/");
    // Switch to Arabic first
    let switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();
    await page.locator('button:has-text("العربية")').first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // Switch back to English
    switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();
    await page.locator('button:has-text("English")').first().click();

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page.locator("h1#hero-title")).toContainText("Your entire gym");
  });

  test("persists language selection across page refresh", async ({ page }) => {
    await page.goto("/");
    const switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();
    await page.locator('button:has-text("اردو")').first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // Reload page
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("h1#hero-title")).toContainText("آپ کا پورا جم");
  });

  test("persists language when navigating from marketing to login and back", async ({ page }) => {
    await page.goto("/");
    const switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();
    await page.locator('button:has-text("العربية")').first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // Navigate to login
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar-SA");

    // Navigate back to marketing home
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("h1#hero-title")).toContainText("ناديك الرياضي بالكامل");
  });

  test("has no horizontal overflow at 375px mobile in RTL", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();
    await page.locator('button:has-text("اردو")').first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("captures screenshots for English, Arabic, and Urdu", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. English
    await page.goto("/");
    await page.screenshot({ path: "tests/e2e/screenshots/marketing-english-1280.png", fullPage: false });

    // 2. Urdu
    let switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();
    await page.locator('button:has-text("اردو")').first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.screenshot({ path: "tests/e2e/screenshots/marketing-urdu-1280.png", fullPage: false });

    // 3. Arabic
    switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();
    await page.locator('button:has-text("العربية")').first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.screenshot({ path: "tests/e2e/screenshots/marketing-arabic-1280.png", fullPage: false });
  });
});
