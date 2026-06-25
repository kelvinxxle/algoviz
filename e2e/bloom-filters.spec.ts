import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="bloom-filters-workbench"]';

test.describe("Bloom filter workbench", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/topics/bloom-filters");
    await expect(page.locator(WORKBENCH)).toBeVisible();
  });

  test("renders the curated walkthrough on the first frame", async ({
    page,
  }) => {
    await expect(page.getByTestId("bloom-bit-array")).toBeVisible();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    // m=32 curated filter: 32 bit cells.
    await expect(page.locator("[data-bit]")).toHaveCount(32);
  });

  test("step forward and back move through frames", async ({ page }) => {
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 2 /");
    await page.getByRole("button", { name: "Step back" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("scrubbing to the end reaches the done frame and reset returns", async ({
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
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("the walkthrough reaches an honest probably-yes verdict", async ({
    page,
  }) => {
    const slider = page.getByRole("slider", { name: "Scrub steps" });
    await slider.focus();
    // Walk frame by frame until a probably-yes verdict banner appears.
    let seen = false;
    for (let i = 0; i < 40; i += 1) {
      const banner = page.locator(
        '[data-testid="bloom-verdict"][data-verdict="probably-yes"]'
      );
      if (await banner.count()) {
        await expect(banner.first()).toContainText(/probably/i);
        seen = true;
        break;
      }
      await slider.press("ArrowRight");
    }
    expect(seen).toBe(true);
  });

  test("custom input reruns the same engine on a sandbox filter", async ({
    page,
  }) => {
    const input = ["m: 16", "k: 2", "insert: x, y", "query: x"].join("\n");
    await page.getByLabel("Custom input").fill(input);
    await page.getByRole("button", { name: "Run visualization" }).click();

    await expect(page.locator("[data-bit]")).toHaveCount(16);
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("invalid sandbox input surfaces a parser error", async ({ page }) => {
    await page.getByLabel("Custom input").fill("m: 16\nquery: a");
    await page.getByRole("button", { name: "Run visualization" }).click();
    await expect(page.getByTestId("sandbox-error")).toBeVisible();
  });
});
