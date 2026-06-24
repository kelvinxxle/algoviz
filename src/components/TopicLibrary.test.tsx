import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicLibrary } from "./TopicLibrary";
import { topics } from "@/data/topics";

describe("TopicLibrary", () => {
  it("renders all topics by default", () => {
    render(<TopicLibrary topics={topics} />);
    expect(screen.getAllByTestId("topic-card")).toHaveLength(10);
  });

  it("filters to canonical topics", async () => {
    const user = userEvent.setup();
    render(<TopicLibrary topics={topics} />);
    await user.click(screen.getByRole("button", { name: "CANONICAL" }));
    expect(screen.getAllByTestId("topic-card")).toHaveLength(5);
  });

  it("filters to systems topics", async () => {
    const user = userEvent.setup();
    render(<TopicLibrary topics={topics} />);
    await user.click(screen.getByRole("button", { name: "SYSTEMS" }));
    expect(screen.getAllByTestId("topic-card")).toHaveLength(5);
  });

  it("restores all topics when ALL TOPICS is clicked", async () => {
    const user = userEvent.setup();
    render(<TopicLibrary topics={topics} />);
    await user.click(screen.getByRole("button", { name: "SYSTEMS" }));
    await user.click(screen.getByRole("button", { name: "ALL TOPICS" }));
    expect(screen.getAllByTestId("topic-card")).toHaveLength(10);
  });

  it("marks the active filter with aria-pressed", async () => {
    const user = userEvent.setup();
    render(<TopicLibrary topics={topics} />);
    const systems = screen.getByRole("button", { name: "SYSTEMS" });
    expect(systems).toHaveAttribute("aria-pressed", "false");
    await user.click(systems);
    expect(systems).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "ALL TOPICS" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});
