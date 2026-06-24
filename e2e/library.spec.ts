import { test, expect } from "@playwright/test";

const cardSelector = '[data-testid="topic-card"]';
const availableSelector = `${cardSelector}[data-status="available"]`;
const comingSoonSelector = `${cardSelector}[data-status="coming-soon"]`;

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

  test("every card is either available or coming-soon, summing to 10", async ({
    page,
  }) => {
    await expect(page.getByTestId("topic-card")).toHaveCount(10);
    const available = await page.locator(availableSelector).count();
    const comingSoon = await page.locator(comingSoonSelector).count();
    expect(available + comingSoon).toBe(10);
    expect(available).toBeGreaterThanOrEqual(1);
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

  test("catalog stats match the rendered availability split", async ({
    page,
  }) => {
    const total = await page.locator(cardSelector).count();
    const available = await page.locator(availableSelector).count();
    const comingSoon = await page.locator(comingSoonSelector).count();

    await expect(page.getByTestId("stat-total")).toContainText(String(total));
    await expect(page.getByTestId("stat-available")).toContainText(
      String(available)
    );
    await expect(page.getByTestId("stat-coming-soon")).toContainText(
      String(comingSoon)
    );
  });

  test("every available card routes to a 200 workbench", async ({ page }) => {
    const available = page.locator(availableSelector);
    const count = await available.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const slug = await available.nth(i).getAttribute("data-slug");
      expect(slug).toBeTruthy();
      const response = await page.request.get(`/topics/${slug}`);
      expect(response.status()).toBe(200);
    }
  });

  test("every coming-soon card is non-navigable and its route 404s", async ({
    page,
  }) => {
    const comingSoon = page.locator(comingSoonSelector);
    const count = await comingSoon.count();

    for (let i = 0; i < count; i++) {
      const card = comingSoon.nth(i);
      await expect(card).toHaveAttribute("aria-disabled", "true");
      await expect(card.locator("a")).toHaveCount(0);

      const slug = await card.getAttribute("data-slug");
      expect(slug).toBeTruthy();
      const response = await page.request.get(`/topics/${slug}`);
      expect(response.status()).toBe(404);
    }
  });
});

test.describe("Topic detail routing", () => {
  test("available topic responds 200, not a 404", async ({ page }) => {
    const response = await page.goto("/topics/dijkstra");
    expect(response?.status()).toBe(200);
    await expect(page.getByTestId("dijkstra-workbench")).toBeVisible();
  });

  test("an unknown topic slug returns 404", async ({ page }) => {
    const response = await page.goto("/topics/not-a-real-topic");
    expect(response?.status()).toBe(404);
  });
});
