import { test, expect } from "@playwright/test";

/**
 * Regression guard for the pseudocode panel: long lines must wrap inside the
 * narrow desktop sidebar (lg:w-96) instead of bleeding past its right edge.
 * The LRU cache topic has lines long enough to overflow that 384px panel, so
 * each rendered line's scrollWidth must stay within its clientWidth.
 */
test.describe("pseudocode panel overflow", () => {
  test("long pseudocode lines wrap and do not overflow horizontally", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/topics/lru-cache");

    const panel = page.getByTestId("pseudocode-panel");
    await expect(panel).toBeVisible();

    const overflowing = await panel
      .locator("[data-line]")
      .evaluateAll((els) =>
        els
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => el.textContent ?? "")
      );

    expect(overflowing).toEqual([]);
  });
});
