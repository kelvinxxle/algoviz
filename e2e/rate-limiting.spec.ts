import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="rate-limiting-workbench"]';

test.describe("Rate Limiting workbench", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/topics/rate-limiting");
    await expect(page.locator(WORKBENCH)).toBeVisible();
  });

  test("renders the curated walkthrough on the first frame", async ({
    page,
  }) => {
    await expect(page.getByTestId("rate-limiting-scene")).toBeVisible();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await expect(page.locator('[data-request="R1"]')).toBeVisible();
    await expect(page.locator('[data-request="R5"]')).toBeVisible();
  });

  test("step forward and back move through frames", async ({ page }) => {
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 2 /");
    await page.getByRole("button", { name: "Step back" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("scrubbing to the end reaches a decided bucket and reset returns", async ({
    page,
  }) => {
    const slider = page.getByRole("slider", { name: "Scrub steps" });
    await expect(async () => {
      await slider.focus();
      await slider.press("End");
      const text =
        (await page.getByTestId("step-position").textContent()) ?? "";
      const total = text.split("/")[1]?.trim();
      await expect(page.getByTestId("step-position")).toContainText(
        `STEP ${total} / ${total}`
      );
    }).toPass();
    // R5 was the burst overflow and must read as rejected at the end.
    await expect(page.locator('[data-request="R5"]')).toHaveAttribute(
      "data-role",
      "rejected"
    );
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("custom input reruns the same engine on the sandbox timeline", async ({
    page,
  }) => {
    const input = ["capacity: 1", "refill: 1", "0 ONE", "0 TWO"].join("\n");
    await page.getByLabel("Custom input").fill(input);
    await page.getByRole("button", { name: "Run visualization" }).click();

    await expect(page.locator('[data-request="ONE"]')).toBeVisible();
    await expect(page.locator('[data-request="TWO"]')).toBeVisible();
    await expect(page.locator('[data-request="R1"]')).toHaveCount(0);
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("invalid sandbox input surfaces a parser error", async ({ page }) => {
    await page.getByLabel("Custom input").fill("refill: 1\n0 A");
    await page.getByRole("button", { name: "Run visualization" }).click();
    await expect(page.getByTestId("sandbox-error")).toBeVisible();
  });
});
