import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopicCard } from "./TopicCard";
import type { Topic } from "@/data/topics";

const availableTopic: Topic = {
  slug: "dijkstra",
  title: "Dijkstra's Shortest Path",
  flavor: "canonical",
  status: "available",
  blurb: "Weighted shortest paths via a priority-queue frontier.",
  complexity: "O(E + V log V)",
  icon: "share_location",
};

const lockedTopic: Topic = {
  slug: "bloom-filters",
  title: "Bloom Filters",
  flavor: "systems",
  status: "coming-soon",
  blurb: "Probabilistic membership: definitely no, maybe yes.",
  complexity: "O(k)",
  icon: "blur_on",
};

describe("TopicCard", () => {
  it("renders title, blurb, and complexity", () => {
    render(<TopicCard topic={availableTopic} />);
    expect(screen.getByText("Dijkstra's Shortest Path")).toBeInTheDocument();
    expect(
      screen.getByText("Weighted shortest paths via a priority-queue frontier.")
    ).toBeInTheDocument();
    expect(screen.getByText("O(E + V log V)")).toBeInTheDocument();
  });

  it("renders the flavor as an uppercased badge", () => {
    render(<TopicCard topic={availableTopic} />);
    expect(screen.getByText("CANONICAL")).toBeInTheDocument();
  });

  it("renders an available topic as a link to its topic page", () => {
    render(<TopicCard topic={availableTopic} />);
    const link = screen.getByRole("link", {
      name: /Dijkstra's Shortest Path/i,
    });
    expect(link).toHaveAttribute("href", "/topics/dijkstra");
  });

  it("does not render a link for a coming-soon topic", () => {
    render(<TopicCard topic={lockedTopic} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("marks a coming-soon topic as locked and disabled", () => {
    render(<TopicCard topic={lockedTopic} />);
    expect(screen.getByText(/COMING SOON/i)).toBeInTheDocument();
    expect(screen.getByTestId("topic-card")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });
});
