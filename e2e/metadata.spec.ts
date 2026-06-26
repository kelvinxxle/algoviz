import { test, expect } from "@playwright/test";

test.describe("Site metadata", () => {
  test("home page has the branded title and OG tags", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AlgoViz/);

    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toContain("AlgoViz");

    const twitterCard = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute("content");
    expect(twitterCard).toBe("summary_large_image");

    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .getAttribute("content");
    expect(themeColor).toBe("#131313");
  });

  test("a topic page has its own title distinct from the home title", async ({
    page,
  }) => {
    await page.goto("/topics/dijkstra");
    await expect(page).toHaveTitle(/Dijkstra/);
    await expect(page).toHaveTitle(/AlgoViz/);
  });
});
