/**
 * Playwright smoke tests — Part F.
 *
 * These tests load pages from the running dev server and verify:
 *  - /privacy, /terms, /pricing render without error
 *  - the sign-up form has the required Terms and Privacy checkboxes
 *  - the pricing page has monthly/yearly interval buttons
 *  - the pricing page does NOT promise HeyGen video or AI video generation
 *
 * Run with: npm run test:e2e
 * The web server is started automatically by playwright.config.ts.
 */
import { expect, test } from "@playwright/test";

// ── Static page load smoke tests ─────────────────────────────────────────────

test.describe("Static page load", () => {
  test("/privacy loads and renders policy heading", async ({ page }) => {
    const response = await page.goto("/privacy");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("/terms loads and renders heading", async ({ page }) => {
    const response = await page.goto("/terms");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("/pricing loads and renders pricing content", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBeLessThan(400);
    // The hero tag is always present and doesn't require login
    await expect(page.getByText(/premium/i).first()).toBeVisible();
  });
});

// ── Pricing page — interval buttons ─────────────────────────────────────────

test.describe("Pricing page — billing interval toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("Monthly button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /monthly/i })
    ).toBeVisible();
  });

  test("Yearly button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /yearly/i })
    ).toBeVisible();
  });
});

// ── Pricing page — no forbidden feature promises ─────────────────────────────

test.describe("Pricing page — feature promise regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("pricing page does not promise HeyGen video generation", async ({ page }) => {
    const bodyText = await page.locator("body").innerText();
    // These were removed in Session 4 — their reappearance would be a regression.
    expect(bodyText.toLowerCase()).not.toContain("heygen");
    expect(bodyText.toLowerCase()).not.toContain("ai short meditation video");
    expect(bodyText.toLowerCase()).not.toContain("video generation");
  });

  test("pricing page contains recurring-subscription disclosure", async ({ page }) => {
    // Legal disclosure added in Session 4 must remain.
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).toContain("recurring");
    expect(bodyText.toLowerCase()).toContain("cancel");
  });
});

// ── Sign-up form — legal consent checkboxes ──────────────────────────────────

test.describe("Sign-up form — legal consent checkboxes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-up");
  });

  test("Terms of Service checkbox is visible", async ({ page }) => {
    await expect(page.getByText("Terms of Service")).toBeVisible();
  });

  test("Privacy Policy checkbox is visible", async ({ page }) => {
    await expect(page.getByText("Privacy Policy")).toBeVisible();
  });

  test("submit button is disabled when neither checkbox is checked", async ({ page }) => {
    // The button text contains the sign-up CTA; it should be disabled by default.
    const submitBtn = page.getByRole("button", { name: /create account|sign up|register/i });
    await expect(submitBtn).toBeDisabled();
  });

  test("submit button remains disabled after only Terms is checked", async ({ page }) => {
    // Click the first checkbox (Terms).
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.first().check();

    const submitBtn = page.getByRole("button", { name: /create account|sign up|register/i });
    await expect(submitBtn).toBeDisabled();
  });

  test("submit button remains disabled after only Privacy is checked", async ({ page }) => {
    // Click the second checkbox (Privacy).
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(1).check();

    const submitBtn = page.getByRole("button", { name: /create account|sign up|register/i });
    await expect(submitBtn).toBeDisabled();
  });

  test("submit button becomes enabled once both checkboxes are checked", async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.first().check();
    await checkboxes.nth(1).check();

    const submitBtn = page.getByRole("button", { name: /create account|sign up|register/i });
    await expect(submitBtn).toBeEnabled();
  });
});
