import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="tries-workbench"]';

test.describe("Tries workbench", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/topics/tries");
    await expect(page.locator(WORKBENCH)).toBeVisible();
  });

  test("renders the curated walkthrough on the first frame", async ({
    page,
  }) => {
    await expect(page.getByTestId("trie-tree")).toBeVisible();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("stepping forward builds the trie one character at a time", async ({
    page,
  }) => {
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 2 /");
    await page.getByRole("button", { name: "Step back" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("the final frame reaches a stored word end", async ({ page }) => {
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
    await expect(page.locator('[data-end="true"]').first()).toBeVisible();
  });

  test("custom input reruns the same engine on a new word set", async ({
    page,
  }) => {
    const input = ["insert cat", "insert car", "search cat"].join("\n");
    await page.getByLabel("Custom input").fill(input);
    await page.getByRole("button", { name: "Run visualization" }).click();

    await expect(page.getByTestId("trie-tree")).toBeVisible();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("invalid sandbox input surfaces a parser error", async ({ page }) => {
    await page.getByLabel("Custom input").fill("insert 123");
    await expect(async () => {
      await page.getByRole("button", { name: "Run visualization" }).click();
      await expect(page.getByTestId("sandbox-error")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
  });
});

test.describe("Tries routing", () => {
  test("available topic responds 200, not a 404", async ({ page }) => {
    const response = await page.goto("/topics/tries");
    expect(response?.status()).toBe(200);
    await expect(page.locator(WORKBENCH)).toBeVisible();
  });
});
