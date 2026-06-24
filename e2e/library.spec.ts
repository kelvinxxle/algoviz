import { test, expect } from "@playwright/test";

test.describe("Topic Library landing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the Topic Library heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Topic Library" })
    ).toBeAttached();
  });

  test("renders all 10 topic cards", async ({ page }) => {
    await expect(page.getByTestId("topic-card")).toHaveCount(10);
  });

  test("marks 9 topics as coming soon", async ({ page }) => {
    await expect(
      page.locator('[data-testid="topic-card"][data-status="coming-soon"]')
    ).toHaveCount(9);
  });

  test("exposes Dijkstra as an available link", async ({ page }) => {
    const link = page.getByRole("link", {
      name: /Dijkstra's Shortest Path/i,
    });
    await expect(link).toHaveAttribute("href", "/topics/dijkstra");
  });

  test("filters to 5 systems topics", async ({ page }) => {
    await page.getByRole("button", { name: "SYSTEMS" }).click();
    await expect(page.getByTestId("topic-card")).toHaveCount(5);
  });

  test("shows honest catalog stats", async ({ page }) => {
    await expect(page.getByTestId("stat-total")).toContainText("10");
    await expect(page.getByTestId("stat-available")).toContainText("1");
    await expect(page.getByTestId("stat-coming-soon")).toContainText("9");
  });
});
