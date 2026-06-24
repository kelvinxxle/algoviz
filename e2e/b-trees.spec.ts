import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="b-trees-workbench"]';

test.describe("B-Trees workbench", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/topics/b-trees");
    await expect(page.locator(WORKBENCH)).toBeVisible();
  });

  test("opens on the first frame of the curated walkthrough", async ({
    page,
  }) => {
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("stepping forward builds the tree and renders nodes", async ({
    page,
  }) => {
    const forward = page.getByRole("button", { name: "Step forward" });
    for (let i = 0; i < 4; i += 1) await forward.click();
    await expect(page.getByTestId("b-trees-tree")).toBeVisible();
    await expect(page.locator("[data-node]").first()).toBeVisible();
  });

  test("step forward and back move through frames", async ({ page }) => {
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 2 /");
    await page.getByRole("button", { name: "Step back" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("custom input reruns the same engine on the sandbox tree", async ({
    page,
  }) => {
    const input = ["order: 3", "insert: 5 1 9 2 7", "search: 9"].join("\n");
    await page.getByLabel("Custom input").fill(input);
    await page.getByRole("button", { name: "Run visualization" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("b-trees-tree")).toBeVisible();
  });

  test("invalid sandbox input surfaces a parser error", async ({ page }) => {
    await page.getByLabel("Custom input").fill("order: 2\ninsert: 1 2 3");
    await page.getByRole("button", { name: "Run visualization" }).click();
    await expect(page.getByTestId("sandbox-error")).toBeVisible();
  });
});
