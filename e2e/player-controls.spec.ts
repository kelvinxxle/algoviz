import { test, expect } from "@playwright/test";

// Regression for the shared M1 PlayerControls. The right-hand transport group
// used flex-1 without min-w-0, so the scrub range input refused to shrink below
// its intrinsic width and pushed the speed buttons out of their column. On a
// tall-pseudocode topic (Union-Find has a 13-line pseudocode panel) the speed
// buttons slid under the later-painted pseudocode aside, which then intercepted
// the pointer: the 4x speed control was effectively unclickable.
//
// jsdom cannot compute layout or hit-testing, so this guard must be an e2e test
// at a real desktop viewport.
test.describe("PlayerControls speed buttons", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("4x is clickable and selects 4x on a tall-pseudocode topic", async ({
    page,
  }) => {
    await page.goto("/topics/union-find");
    await expect(
      page.locator('[data-testid="union-find-workbench"]')
    ).toBeVisible();

    const speed4x = page.getByRole("button", { name: "4x", exact: true });
    await expect(speed4x).toBeVisible();
    await expect(speed4x).toHaveAttribute("aria-pressed", "false");

    // Nothing (the pseudocode aside in particular) may overlay the 4x button:
    // the element at its own center must be the button itself.
    const ownsClickTarget = await speed4x.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(
        r.x + r.width / 2,
        r.y + r.height / 2
      );
      return top !== null && el.contains(top);
    });
    expect(ownsClickTarget).toBe(true);

    await speed4x.click();
    await expect(speed4x).toHaveAttribute("aria-pressed", "true");
  });
});
