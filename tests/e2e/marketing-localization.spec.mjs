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

  test("country and language selector opens and searches correctly", async ({ page }) => {
    await page.goto("/");
    const switcher = page.getByRole("button", { name: /Language:/i }).first();
    await switcher.click();

    // Verify search input works
    const searchInput = page.locator('#fitivo-country-selector input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Search for "Turkey"
    await searchInput.fill("Turkey");
    await expect(page.locator('#fitivo-country-selector button:has-text("Türkiye")')).toBeVisible();
    await expect(page.locator('#fitivo-country-selector button:has-text("Pakistan")')).not.toBeVisible();

    // Clear search and search for "Urdu"
    await searchInput.fill("Urdu");
    await expect(page.locator('#fitivo-country-selector button:has-text("Pakistan")')).toBeVisible();

    // Select Turkey and verify language switches to Turkish
    await searchInput.fill("Türkiye");
    await page.locator('#fitivo-country-selector button:has-text("Türkiye")').first().click();
    await expect(page.locator("html")).toHaveAttribute("lang", "tr-TR");
  });

  for (const viewport of [
    { width: 320, height: 568, name: "320px" },
    { width: 375, height: 667, name: "375px" },
    { width: 390, height: 844, name: "390px" },
    { width: 768, height: 1024, name: "768px" },
    { width: 1440, height: 900, name: "1440px" },
  ]) {
    test(`selector operates without horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      const switcher = page.getByRole("button", { name: /Language:/i }).first();
      await switcher.click();

      // Check dialog visibility
      const dialog = page.locator("#fitivo-country-selector");
      await expect(dialog).toBeVisible();

      // Check no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Verify touch target height on options
      const firstOption = dialog.locator("button[data-country-option]").first();
      const box = await firstOption.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    });
  }
});
