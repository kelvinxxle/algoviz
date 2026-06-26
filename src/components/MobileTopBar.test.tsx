import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileTopBar } from "@/components/MobileTopBar";

describe("MobileTopBar", () => {
  it("shows the AlgoViz wordmark and a dashboard link", () => {
    render(<MobileTopBar />);
    expect(screen.getByText("AlgoViz")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("renders the reference links from shared nav data", () => {
    render(<MobileTopBar />);
    expect(screen.getByRole("link", { name: /source/i })).toHaveAttribute(
      "href",
      "https://github.com/kelvinxxle/algoviz"
    );
  });
});
