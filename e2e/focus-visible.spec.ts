import { test, expect } from "@playwright/test";

test.describe("focus-visible ring", () => {
  test("keyboard focus shows a visible outline", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/topics/dijkstra");

    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return { width: 0, style: "none" };
      const s = getComputedStyle(el);
      return { width: parseFloat(s.outlineWidth) || 0, style: s.outlineStyle };
    });
    expect(outline.width).toBeGreaterThan(0);
    expect(outline.style).not.toBe("none");

    const hasGlobalFocusRule = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRule[];
        try {
          rules = Array.from(sheet.cssRules);
        } catch {
          continue;
        }
        for (const rule of rules) {
          const selector = (rule as CSSStyleRule).selectorText;
          if (
            selector === ":focus-visible" &&
            rule.cssText.includes("outline")
          ) {
            return true;
          }
        }
      }
      return false;
    });
    expect(hasGlobalFocusRule).toBe(true);
  });
});
