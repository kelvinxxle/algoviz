import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogStats } from "./CatalogStats";
import { topics } from "@/data/topics";

describe("CatalogStats", () => {
  it("shows honest catalog counts derived from the registry", () => {
    render(<CatalogStats topics={topics} />);

    const total = screen.getByTestId("stat-total");
    const available = screen.getByTestId("stat-available");
    const comingSoon = screen.getByTestId("stat-coming-soon");

    expect(total).toHaveTextContent("10");
    expect(available).toHaveTextContent("1");
    expect(comingSoon).toHaveTextContent("9");
  });

  it("labels each stat", () => {
    render(<CatalogStats topics={topics} />);
    expect(screen.getByText(/TOTAL TOPICS/i)).toBeInTheDocument();
    expect(screen.getByText(/AVAILABLE NOW/i)).toBeInTheDocument();
    expect(screen.getByText(/COMING SOON/i)).toBeInTheDocument();
  });
});
