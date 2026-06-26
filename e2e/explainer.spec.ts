import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="dijkstra-workbench"]';
const QUESTION_LABEL = "Question for the AI explainer";

test.describe("Scoped AI explainer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/topics/dijkstra");
    await expect(page.locator(WORKBENCH)).toBeVisible();
  });

  test("asks a question and renders the answer with a step badge", async ({
    page,
  }) => {
    await page.route("**/api/explain", async (route) => {
      const body = route.request().postDataJSON();
      expect(body.topicId).toBe("dijkstra");
      expect(typeof body.question).toBe("string");
      expect(typeof body.step.narration).toBe("string");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          answer: "Stubbed: a heap gives O(log V) extract-min.",
        }),
      });
    });

    await page.getByLabel(QUESTION_LABEL).fill("Why use a heap here?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();

    const entry = page.getByTestId("explainer-entry");
    await expect(entry).toBeVisible();
    await expect(entry).toContainText(
      "Stubbed: a heap gives O(log V) extract-min."
    );
    await expect(entry).toContainText("Why use a heap here?");
    await expect(entry).toContainText(/Step 1 \//);
  });

  test("shows the honest not-configured notice on a 503", async ({ page }) => {
    await page.route("**/api/explain", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "not_configured" }),
      });
    });

    await page.getByLabel(QUESTION_LABEL).fill("Why use a heap here?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();

    await expect(page.getByTestId("explainer-not-configured")).toBeVisible();
    await expect(page.getByTestId("explainer-not-configured")).toContainText(
      "GEMINI_API_KEY"
    );
    await expect(page.getByTestId("explainer-answer")).toHaveCount(0);
  });
});
