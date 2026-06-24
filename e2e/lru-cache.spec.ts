import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="lru-cache-workbench"]';

test.describe("LRU cache workbench", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/topics/lru-cache");
    await expect(page.locator(WORKBENCH)).toBeVisible();
  });

  test("renders the curated walkthrough on the first frame", async ({
    page,
  }) => {
    await expect(page.getByTestId("lru-diagram")).toBeVisible();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await expect(page.getByTestId("lru-empty")).toBeVisible();
  });

  test("stepping forward inserts the first node", async ({ page }) => {
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 2 /");
    await expect(page.locator('[data-node="A"]')).toBeVisible();
  });

  test("scrubbing to the end leaves the oracle recency order", async ({
    page,
  }) => {
    const slider = page.getByRole("slider", { name: "Scrub steps" });
    await slider.focus();
    await slider.press("End");
    await expect(page.locator('[data-node="C"]')).toBeVisible();
    await expect(page.locator('[data-node="D"]')).toBeVisible();
    await expect(page.locator('[data-node="A"]')).toBeVisible();
    await expect(page.locator('[data-node="B"]')).toHaveCount(0);
  });

  test("custom input reruns the same engine on the sandbox program", async ({
    page,
  }) => {
    const input = ["capacity: 1", "put X 1", "put Y 2", "get X"].join("\n");
    await page.getByLabel("Custom input").fill(input);
    await page.getByRole("button", { name: "Run visualization" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");

    const slider = page.getByRole("slider", { name: "Scrub steps" });
    await slider.focus();
    await slider.press("End");
    await expect(page.locator('[data-node="Y"]')).toBeVisible();
    await expect(page.locator('[data-node="X"]')).toHaveCount(0);
  });

  test("invalid sandbox input surfaces a parser error", async ({ page }) => {
    await page.getByLabel("Custom input").fill("put A");
    await page.getByRole("button", { name: "Run visualization" }).click();
    await expect(page.getByTestId("sandbox-error")).toBeVisible();
  });
});
