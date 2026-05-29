import { expect, test } from "@playwright/test";

test.describe("Yoga mode request wiring", () => {
  test("sends yoga mode payload with focus and level", async ({ page }) => {
    await page.route("**/api/generate-meditation", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          meditation: "Test yoga session script.",
          sessionId: "pw-yoga-session",
        }),
      });
    });

    await page.goto("/meditation");

    await page.getByRole("button", { name: "Yoga" }).click();

    const focusSelect = page
      .locator("select")
      .filter({ has: page.locator('option[value="flexibility"]') })
      .first();
    await focusSelect.selectOption("flexibility");

    const levelSelect = page
      .locator("select")
      .filter({ has: page.locator('option[value="advanced"]') })
      .first();
    await levelSelect.selectOption("advanced");

    const requestPromise = page.waitForRequest("**/api/generate-meditation");
    await page.getByRole("button", { name: "Generate My Session" }).click();
    const request = await requestPromise;

    const payload = request.postDataJSON() as {
      mode: string;
      yogaFocus?: string;
      yogaLevel?: string;
    };

    expect(payload.mode).toBe("yoga");
    expect(payload.yogaFocus).toBe("flexibility");
    expect(payload.yogaLevel).toBe("advanced");

    await expect(page.getByText("Test yoga session script.")).toBeVisible();
  });
});
