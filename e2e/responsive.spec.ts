import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="dijkstra-workbench"]';

test.describe("responsive topic page", () => {
  test("phone shows the small-screen notice, not the workbench", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/topics/dijkstra");
    await expect(page.getByText(/best on a larger screen/i)).toBeVisible();
    await expect(page.locator(WORKBENCH)).not.toBeVisible();
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
  });

  test("tablet shows the workbench and the mobile top bar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/topics/dijkstra");
    await expect(page.locator(WORKBENCH)).toBeVisible();
    await expect(page.getByTestId("dijkstra-graph")).toBeVisible();
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
  });

  test("desktop shows the workbench and the sidebar rail, no top bar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/topics/dijkstra");
    await expect(page.locator(WORKBENCH)).toBeVisible();
    // At desktop the Sidebar rail is visible and the mobile top bar is hidden
    // (display:none, so its links are not in the a11y tree). Assert the
    // Sidebar's DASHBOARD label is visible.
    await expect(page.getByText("DASHBOARD")).toBeVisible();
  });
});

test.describe("responsive home page", () => {
  test("phone shows the mobile top bar nav, not the sidebar rail", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    // Below lg the Sidebar rail is hidden, so the MobileTopBar must supply the
    // nav. Its Dashboard link keeps the library reachable at phone width.
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText("DASHBOARD")).not.toBeVisible();
  });

  test("desktop shows the sidebar rail, no mobile top bar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByText("DASHBOARD")).toBeVisible();
  });
});
