import { test, expect } from "@playwright/test";

test.describe("landmarks and skip-link", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/topics/dijkstra");
  });

  test("the skip-link is first and moves focus to the visualization", async ({
    page,
  }) => {
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to visualization/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe("visualization");
  });

  test("exposes labeled landmarks and a named figure", async ({ page }) => {
    await expect(
      page.getByRole("complementary", { name: "Primary" })
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Walkthrough details" })
    ).toBeVisible();
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("img", { name: /dijkstra/i })).toBeVisible();
  });

  test("the skip-link is hidden below md where the workbench is not shown", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/topics/dijkstra");
    await expect(
      page.getByRole("link", { name: /skip to visualization/i })
    ).toBeHidden();
  });
});
