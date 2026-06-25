import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="dynamic-programming-workbench"]';

test.describe("Dynamic Programming workbench", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/topics/dynamic-programming");
    await expect(page.locator(WORKBENCH)).toBeVisible();
  });

  test("renders the curated walkthrough on the first frame", async ({
    page,
  }) => {
    await expect(page.getByRole("grid", { name: /knapsack/i })).toBeVisible();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await expect(page.locator('[data-item="A"]')).toBeVisible();
    await expect(page.locator('[data-item="D"]')).toBeVisible();
  });

  test("step forward and back move through frames", async ({ page }) => {
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 2 /");
    await page.getByRole("button", { name: "Step back" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("scrub jumps to the final frame and shows the optimal value", async ({
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
    // dp[4][7] = 9 is the optimal value for the curated instance.
    await expect(page.locator('[data-cell="4,7"]')).toHaveText("9");
  });

  test("custom input reruns the same engine on the sandbox instance", async ({
    page,
  }) => {
    const input = ["capacity: 2", "X 1 1", "Y 2 3"].join("\n");
    await page.getByLabel("Custom input").fill(input);
    await page.getByRole("button", { name: "Run visualization" }).click();

    await expect(page.locator('[data-item="X"]')).toBeVisible();
    await expect(page.locator('[data-item="Y"]')).toBeVisible();
    await expect(page.locator('[data-item="A"]')).toHaveCount(0);
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("invalid sandbox input surfaces a parser error", async ({ page }) => {
    await page.getByLabel("Custom input").fill("A 1 1");
    await page.getByRole("button", { name: "Run visualization" }).click();
    await expect(page.getByTestId("sandbox-error")).toBeVisible();
  });
});
