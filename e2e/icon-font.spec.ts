import { test, expect } from "@playwright/test";

// Regression for the Material Symbols icon font. The font used to load through
// a remote @import in globals.css, which Next dropped from the merged
// stylesheet, so every .material-symbols-outlined span rendered its literal
// ligature name (e.g. "play_arrow") instead of a glyph and overlapped its
// neighbors. The font is now self-hosted in the bundle, so it must render even
// with the Google font hosts blocked.
//
// jsdom cannot lay out a font glyph, so this guard must be an e2e test that
// measures the rendered icon at a real desktop viewport.
test.describe("Material Symbols icon font renders offline", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("the play icon is a glyph, not literal text, with the font CDN blocked", async ({
    page,
  }) => {
    const blockedRequests: string[] = [];
    const blockFontHost = async (route: import("@playwright/test").Route) => {
      blockedRequests.push(route.request().url());
      await route.abort();
    };
    await page.route("**://fonts.googleapis.com/**", blockFontHost);
    await page.route("**://fonts.gstatic.com/**", blockFontHost);

    await page.goto("/topics/dynamic-programming");
    await expect(
      page.locator('[data-testid="dynamic-programming-workbench"]')
    ).toBeVisible();

    // The curated load starts paused, so the toggle shows the Play icon.
    const playIcon = page
      .getByRole("button", { name: "Play" })
      .locator(".material-symbols-outlined");
    await expect(playIcon).toBeVisible();
    await expect(playIcon).toHaveText("play_arrow");

    // A real glyph at this font size is roughly 24 to 28px wide. The literal
    // "play_arrow" ligature text is well over 100px, so a small box proves the
    // self-hosted font loaded and the ligature collapsed into one glyph. Poll
    // instead of sampling once: with font-display block a slow CI font load can
    // briefly show the wide fallback (FOIT) before the glyph paints. This stays
    // a true regression guard, since if the self-hosted font never loads the
    // width stays around 127px and the poll fails on timeout.
    await expect
      .poll(async () => (await playIcon.boundingBox())?.width ?? Infinity, {
        timeout: 5000,
      })
      .toBeLessThan(48);

    // The font must come from the self-hosted bundle: nothing should have even
    // tried to reach the Google font hosts.
    expect(blockedRequests).toEqual([]);
  });
});
