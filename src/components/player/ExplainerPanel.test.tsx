import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExplainerPanel } from "./ExplainerPanel";

const STEP = {
  index: 1,
  total: 5,
  narration: "Relax the edge from A to B.",
  caption: "Relax A to B",
  activeLine: 3,
  counters: { visited: 2 },
};

function okResponse(answer: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ answer }),
  } as unknown as Response;
}

function errorResponse(status: number, error: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ error }),
  } as unknown as Response;
}

function setFetch(impl: typeof fetch): void {
  vi.stubGlobal("fetch", vi.fn(impl));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ExplainerPanel", () => {
  beforeEach(() => {
    setFetch(async () =>
      okResponse("Because a heap pops the min in log time.")
    );
  });

  it("shows an honest idle hint before any question", () => {
    render(<ExplainerPanel topicId="dijkstra" step={STEP} />);
    expect(screen.getByText(/ask about this step/i)).toBeInTheDocument();
  });

  it("disables Ask when the question is empty", () => {
    render(<ExplainerPanel topicId="dijkstra" step={STEP} />);
    expect(screen.getByRole("button", { name: /ask/i })).toBeDisabled();
  });

  it("appends the answer with a step badge and sends the step context", async () => {
    const user = userEvent.setup();
    render(<ExplainerPanel topicId="dijkstra" step={STEP} />);

    await user.type(
      screen.getByLabelText(/question for the ai explainer/i),
      "Why a heap?"
    );
    await user.click(screen.getByRole("button", { name: /ask/i }));

    await screen.findByText(/because a heap pops the min/i);
    expect(screen.getByText("Why a heap?")).toBeInTheDocument();
    expect(screen.getByText(/step 2 \/ 5/i)).toBeInTheDocument();

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/explain");
    const body = JSON.parse(init.body);
    expect(body.topicId).toBe("dijkstra");
    expect(body.question).toBe("Why a heap?");
    expect(body.step.index).toBe(1);
    expect(body.step.narration).toBe("Relax the edge from A to B.");
  });

  it("submits on Enter", async () => {
    const user = userEvent.setup();
    render(<ExplainerPanel topicId="dijkstra" step={STEP} />);
    await user.type(
      screen.getByLabelText(/question for the ai explainer/i),
      "Why a heap?{Enter}"
    );
    await screen.findByText(/because a heap pops the min/i);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("locks the input and disables Ask while a request is in flight", async () => {
    let resolve: (r: Response) => void = () => {};
    setFetch(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        })
    );
    const user = userEvent.setup();
    render(<ExplainerPanel topicId="dijkstra" step={STEP} />);

    await user.type(
      screen.getByLabelText(/question for the ai explainer/i),
      "Why a heap?"
    );
    await user.click(screen.getByRole("button", { name: /ask/i }));

    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ask/i })).toBeDisabled();
    expect(
      screen.getByLabelText(/question for the ai explainer/i)
    ).toBeDisabled();

    resolve(okResponse("done"));
    await screen.findByText("done");
  });

  it("renders a calm not-configured notice on 503", async () => {
    setFetch(async () => errorResponse(503, "not_configured"));
    const user = userEvent.setup();
    render(<ExplainerPanel topicId="dijkstra" step={STEP} />);
    await user.type(
      screen.getByLabelText(/question for the ai explainer/i),
      "Why a heap?"
    );
    await user.click(screen.getByRole("button", { name: /ask/i }));

    expect(await screen.findByText(/not configured/i)).toBeInTheDocument();
    expect(screen.getByText(/GEMINI_API_KEY/)).toBeInTheDocument();
  });

  it("renders a provider error with retry on 502", async () => {
    setFetch(async () => errorResponse(502, "provider_error"));
    const user = userEvent.setup();
    render(<ExplainerPanel topicId="dijkstra" step={STEP} />);
    await user.type(
      screen.getByLabelText(/question for the ai explainer/i),
      "Why a heap?"
    );
    await user.click(screen.getByRole("button", { name: /ask/i }));

    expect(
      await screen.findByText(/couldn't reach the explainer/i)
    ).toBeInTheDocument();
  });

  it("renders an honest inline message on 400", async () => {
    setFetch(async () => errorResponse(400, "invalid_request"));
    const user = userEvent.setup();
    render(<ExplainerPanel topicId="dijkstra" step={STEP} />);
    await user.type(
      screen.getByLabelText(/question for the ai explainer/i),
      "Why a heap?"
    );
    await user.click(screen.getByRole("button", { name: /ask/i }));

    expect(await screen.findByText(/500 characters/i)).toBeInTheDocument();
  });

  it("never fabricates an answer on an error path", async () => {
    setFetch(async () => errorResponse(502, "provider_error"));
    const user = userEvent.setup();
    render(<ExplainerPanel topicId="dijkstra" step={STEP} />);
    await user.type(
      screen.getByLabelText(/question for the ai explainer/i),
      "Why a heap?"
    );
    await user.click(screen.getByRole("button", { name: /ask/i }));
    await screen.findByText(/couldn't reach the explainer/i);

    expect(screen.queryByTestId("explainer-answer")).not.toBeInTheDocument();
  });

  it("exposes an aria-live transcript region", () => {
    const { container } = render(
      <ExplainerPanel topicId="dijkstra" step={STEP} />
    );
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  it("clears the transcript when the topic changes (remount)", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ExplainerPanel key="dijkstra" topicId="dijkstra" step={STEP} />
    );
    await user.type(
      screen.getByLabelText(/question for the ai explainer/i),
      "Why a heap?"
    );
    await user.click(screen.getByRole("button", { name: /ask/i }));
    await screen.findByText(/because a heap pops the min/i);

    rerender(<ExplainerPanel key="tries" topicId="tries" step={STEP} />);

    await waitFor(() => {
      expect(
        screen.queryByText(/because a heap pops the min/i)
      ).not.toBeInTheDocument();
    });
  });

  it("discards an in-flight answer when the topic changes before it resolves", async () => {
    let resolve: (r: Response) => void = () => {};
    setFetch(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        })
    );
    const user = userEvent.setup();
    const { rerender } = render(
      <ExplainerPanel key="dijkstra" topicId="dijkstra" step={STEP} />
    );

    await user.type(
      screen.getByLabelText(/question for the ai explainer/i),
      "Why a heap?"
    );
    await user.click(screen.getByRole("button", { name: /ask/i }));
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();

    // Remount under a new topic (as TopicWorkbench does via key={topic.slug}),
    // then resolve the original fetch: it lands on the unmounted instance.
    rerender(<ExplainerPanel key="tries" topicId="tries" step={STEP} />);
    resolve(okResponse("stale answer from dijkstra"));

    await waitFor(() => {
      expect(screen.queryByText(/thinking/i)).not.toBeInTheDocument();
    });
    expect(
      screen.queryByText(/stale answer from dijkstra/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("explainer-entry")).not.toBeInTheDocument();
    expect(screen.getByText(/ask about this step/i)).toBeInTheDocument();
  });
});
