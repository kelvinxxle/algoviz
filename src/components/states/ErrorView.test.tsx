import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorView } from "./ErrorView";

describe("ErrorView", () => {
  it("shows an honest error message and a retry control", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorView onRetry={onRetry} />);

    expect(
      screen.getByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render a raw stack trace", () => {
    render(<ErrorView onRetry={() => {}} />);
    expect(screen.queryByText(/at .*\(.*:\d+:\d+\)/)).not.toBeInTheDocument();
  });
});
