import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SmallScreenNotice } from "@/components/player/SmallScreenNotice";

describe("SmallScreenNotice", () => {
  it("explains the visualization needs a larger screen", () => {
    render(<SmallScreenNotice />);
    expect(screen.getByText(/larger screen/i)).toBeInTheDocument();
  });

  it("offers a link back to the library", () => {
    render(<SmallScreenNotice />);
    const link = screen.getByRole("link", { name: /library/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
