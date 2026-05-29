import { expect, test } from "@playwright/test";

test.describe("Auth verification flow", () => {
  test("QA-005 missing token redirects to invalid", async ({ request }) => {
    const response = await request.get("/api/auth/verify-email", {
      maxRedirects: 0,
    });

    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toContain("/auth/confirmed?verified=invalid");
  });

  test("QA-006 invalid token redirects to invalid", async ({ request }) => {
    const response = await request.get("/api/auth/verify-email?token=not-a-real-token", {
      maxRedirects: 0,
    });

    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toContain("/auth/confirmed?verified=invalid");
  });

  test("QA-002 confirmation page renders success copy", async ({ page }) => {
    await page.goto("/auth/confirmed?verified=success");

    await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible();
    await expect(page.getByText("Your email was confirmed successfully.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to sign in" })).toBeVisible();
  });

  test("QA-007 confirmation page renders expired copy", async ({ page }) => {
    await page.goto("/auth/confirmed?verified=expired");

    await expect(page.getByRole("heading", { name: "Link expired" })).toBeVisible();
    await expect(
      page.getByText("This link has expired. Sign in and request a new verification email.")
    ).toBeVisible();
  });

  test("QA-009 sign-in success defaults to dashboard when callbackUrl missing", async ({ page }) => {
    await page.route("**/api/auth/sign-in", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/sign-in");
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("QA-010 sign-in success uses callbackUrl when provided", async ({ page }) => {
    await page.route("**/api/auth/sign-in", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/sign-in?callbackUrl=%2Fprogress");
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/progress", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/progress$/);
  });

  test("QA-011 sign-up goes to error confirmation when verification email failed", async ({ page }) => {
    await page.route("**/api/auth/sign-up", async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-chimaura-verification-email": "failed",
        },
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/sign-up");
    await page.locator('input[autocomplete="name"]').fill("Playwright User");
    await page.locator('input[type="email"]').fill("pw-error@example.com");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/auth/confirmed?verified=error", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/confirmed\?verified=error$/);
  });

  test("QA-012 sign-up goes to success confirmation on normal success", async ({ page }) => {
    await page.route("**/api/auth/sign-up", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/sign-up");
    await page.locator('input[autocomplete="name"]').fill("Playwright User");
    await page.locator('input[type="email"]').fill("pw-success@example.com");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/auth/confirmed?verified=success", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/confirmed\?verified=success$/);
  });
});
