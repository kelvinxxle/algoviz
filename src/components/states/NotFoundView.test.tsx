import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotFoundView } from "./NotFoundView";

describe("NotFoundView", () => {
  it("shows a branded not-found message and a link back to the library", () => {
    render(<NotFoundView />);
    expect(
      screen.getByRole("heading", { name: /that topic does not exist yet/i })
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /topic library/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
