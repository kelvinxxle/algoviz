import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogStats } from "./CatalogStats";
import { topics } from "@/data/topics";

describe("CatalogStats", () => {
  it("shows honest catalog counts derived from the topic partition", () => {
    render(<CatalogStats topics={topics} />);

    const expectedAvailable = topics.filter(
      (t) => t.status === "available"
    ).length;
    const expectedComingSoon = topics.filter(
      (t) => t.status === "coming-soon"
    ).length;

    const total = screen.getByTestId("stat-total");
    const available = screen.getByTestId("stat-available");
    const comingSoon = screen.getByTestId("stat-coming-soon");

    expect(total).toHaveTextContent(String(topics.length));
    expect(available).toHaveTextContent(String(expectedAvailable));
    expect(comingSoon).toHaveTextContent(String(expectedComingSoon));
  });

  it("labels each stat", () => {
    render(<CatalogStats topics={topics} />);
    expect(screen.getByText(/TOTAL TOPICS/i)).toBeInTheDocument();
    expect(screen.getByText(/AVAILABLE NOW/i)).toBeInTheDocument();
    expect(screen.getByText(/COMING SOON/i)).toBeInTheDocument();
  });
});
