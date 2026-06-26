import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

const pathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: () => pathname(),
}));

import { Sidebar } from "./Sidebar";

afterEach(() => cleanup());

describe("Sidebar primary navigation", () => {
  it("renders the Dashboard item as a link to home", () => {
    pathname.mockReturnValue("/");
    render(<Sidebar />);

    const dashboard = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboard).toHaveAttribute("href", "/");
  });

  it("marks Dashboard as the current page on the home route", () => {
    pathname.mockReturnValue("/");
    render(<Sidebar />);

    const dashboard = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboard).toHaveAttribute("aria-current", "page");
  });

  it("drops aria-current when not on the home route", () => {
    pathname.mockReturnValue("/topics/dijkstra");
    render(<Sidebar />);

    const dashboard = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboard).not.toHaveAttribute("aria-current");
  });

  it("opens external reference links safely in a new tab", () => {
    pathname.mockReturnValue("/");
    render(<Sidebar />);

    const source = screen.getByRole("link", { name: /source/i });
    expect(source).toHaveAttribute("target", "_blank");
    expect(source).toHaveAttribute("rel", "noopener noreferrer");
  });
});
