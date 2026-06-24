import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="dijkstra-workbench"]';

test.describe("Dijkstra workbench", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/topics/dijkstra");
    await expect(page.locator(WORKBENCH)).toBeVisible();
  });

  test("renders the curated walkthrough on the first frame", async ({
    page,
  }) => {
    await expect(page.getByTestId("dijkstra-graph")).toBeVisible();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await expect(page.locator('[data-node="A"]')).toBeVisible();
    await expect(page.locator('[data-node="G"]')).toBeVisible();
  });

  test("step forward and back move through frames", async ({ page }) => {
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 2 /");
    await page.getByRole("button", { name: "Step back" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("play advances the transport, pause halts it", async ({ page }) => {
    await page.getByRole("button", { name: "4x" }).click();
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByTestId("step-position")).not.toContainText(
      "STEP 1 /",
      { timeout: 4000 }
    );
    await page.getByRole("button", { name: "Pause" }).click();
    const halted = await page.getByTestId("step-position").textContent();
    await page.waitForTimeout(600);
    await expect(page.getByTestId("step-position")).toHaveText(halted ?? "");
  });

  test("scrub jumps to the final frame and reset returns to the first", async ({
    page,
  }) => {
    const slider = page.getByRole("slider", { name: "Scrub steps" });
    await slider.focus();
    await slider.press("End");
    const total = await page
      .getByTestId("step-position")
      .textContent()
      .then((t) => (t ?? "").split("/")[1]?.trim());
    await expect(page.getByTestId("step-position")).toContainText(
      `STEP ${total} / ${total}`
    );
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("speed selection updates the active control", async ({ page }) => {
    const fast = page.getByRole("button", { name: "2x" });
    await fast.click();
    await expect(fast).toHaveAttribute("aria-pressed", "true");
  });

  test("custom input reruns the same engine on the sandbox graph", async ({
    page,
  }) => {
    const input = ["source: X", "target: Z", "X Y 1", "Y Z 1"].join("\n");
    await page.getByLabel("Custom input").fill(input);
    await page.getByRole("button", { name: "Run visualization" }).click();

    await expect(page.locator('[data-node="X"]')).toBeVisible();
    await expect(page.locator('[data-node="Z"]')).toBeVisible();
    await expect(page.locator('[data-node="A"]')).toHaveCount(0);
    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
  });

  test("invalid sandbox input surfaces a parser error", async ({ page }) => {
    await page.getByLabel("Custom input").fill("X Y -3");
    await page.getByRole("button", { name: "Run visualization" }).click();
    await expect(page.getByTestId("sandbox-error")).toBeVisible();
  });
});
