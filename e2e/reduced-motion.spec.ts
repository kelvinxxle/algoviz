import { test, expect } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test.describe("reduced motion", () => {
  test("the walkthrough still advances and renders with motion reduced", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/topics/dijkstra");

    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 2 /");
    await expect(page.getByTestId("dijkstra-graph")).toBeVisible();

    const hasReducedMotionRule = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRule[];
        try {
          rules = Array.from(sheet.cssRules);
        } catch {
          continue;
        }
        for (const rule of rules) {
          if (rule.cssText.includes("prefers-reduced-motion")) return true;
        }
      }
      return false;
    });
    expect(hasReducedMotionRule).toBe(true);
  });
});
