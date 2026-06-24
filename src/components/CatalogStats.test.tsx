import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogStats } from "./CatalogStats";
import { topics } from "@/data/topics";
import type { Topic } from "@/data/topics";

function makeTopic(slug: string, status: Topic["status"]): Topic {
  return {
    slug,
    title: slug,
    flavor: "canonical",
    status,
    blurb: "blurb",
    complexity: "O(1)",
    icon: "icon",
  };
}

// A fixed synthetic split decouples the counting assertions from the live
// catalog, so flipping a real topic to available never breaks this test.
const fixture: Topic[] = [
  makeTopic("a-1", "available"),
  makeTopic("a-2", "available"),
  makeTopic("a-3", "available"),
  makeTopic("s-1", "coming-soon"),
  makeTopic("s-2", "coming-soon"),
];

describe("CatalogStats", () => {
  it("counts the available and coming-soon split from its topics prop", () => {
    render(<CatalogStats topics={fixture} />);

    // Exact equality on the rendered number matters: a substring assertion like
    // toHaveTextContent("5") also passes for "15", so a wrong count could slip
    // through and defeat the count-preservation guard this suite exists for. The
    // label and the number live in separate spans, so assert against the number
    // node (the stat element's last child) with strict equality.
    const statValue = (testId: string): string | null =>
      screen.getByTestId(testId).lastElementChild?.textContent ?? null;

    expect(statValue("stat-total")).toBe("5");
    expect(statValue("stat-available")).toBe("3");
    expect(statValue("stat-coming-soon")).toBe("2");
  });

  it("labels each stat", () => {
    render(<CatalogStats topics={topics} />);
    expect(screen.getByText(/TOTAL TOPICS/i)).toBeInTheDocument();
    expect(screen.getByText(/AVAILABLE NOW/i)).toBeInTheDocument();
    expect(screen.getByText(/COMING SOON/i)).toBeInTheDocument();
  });
});
