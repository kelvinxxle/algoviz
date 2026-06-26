import { describe, expect, it, vi } from "vitest";
import type { Topic } from "@/data/topics";
import { getAvailableTopic } from "@/data/topics";
import type { ExplainConfig } from "./config";
import type { LlmProvider } from "./types";
import { ProviderError } from "./provider";
import { handleExplain, type HandlerDeps } from "./handler";

const CONFIGURED: ExplainConfig = {
  provider: "gemini",
  model: "gemini-2.0-flash",
  apiKey: "test-key",
};
const NOT_CONFIGURED: ExplainConfig = { ...CONFIGURED, apiKey: null };

const VALID_BODY = {
  topicId: "dijkstra",
  question: "Why use a heap here?",
  step: {
    index: 1,
    total: 5,
    narration: "Relax the edge from A to B.",
    caption: "Relax A to B",
    activeLine: 3,
    counters: { visited: 2 },
  },
};

function fakeProvider(answer = "canned answer"): LlmProvider {
  return { name: "fake", ask: vi.fn(async () => answer) };
}

function throwingProvider(): LlmProvider {
  return {
    name: "fake",
    ask: vi.fn(async () => {
      throw new ProviderError("upstream down");
    }),
  };
}

function deps(overrides: Partial<HandlerDeps> = {}): HandlerDeps {
  return {
    config: CONFIGURED,
    resolveTopic: getAvailableTopic,
    getProvider: () => fakeProvider(),
    ...overrides,
  };
}

describe("handleExplain", () => {
  it("returns 200 with the provider answer for a valid request", async () => {
    const result = await handleExplain(VALID_BODY, deps());
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ answer: "canned answer" });
  });

  it("passes the resolved topic and step into the provider prompt", async () => {
    const provider = fakeProvider("ok");
    await handleExplain(VALID_BODY, deps({ getProvider: () => provider }));
    const prompt = (provider.ask as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(prompt.system).toContain("Dijkstra's Shortest Path");
    expect(prompt.user).toContain("Why use a heap here?");
  });

  it("returns 503 not_configured when no key is set", async () => {
    const result = await handleExplain(
      VALID_BODY,
      deps({ config: NOT_CONFIGURED })
    );
    expect(result.status).toBe(503);
    expect(result.body).toEqual({ error: "not_configured" });
  });

  it("never calls the provider when not configured", async () => {
    const provider = fakeProvider();
    await handleExplain(
      VALID_BODY,
      deps({ config: NOT_CONFIGURED, getProvider: () => provider })
    );
    expect(provider.ask).not.toHaveBeenCalled();
  });

  it("returns 502 provider_error when the provider throws", async () => {
    const result = await handleExplain(
      VALID_BODY,
      deps({ getProvider: () => throwingProvider() })
    );
    expect(result.status).toBe(502);
    expect(result.body).toEqual({ error: "provider_error" });
  });

  it("returns 400 when the body is not an object", async () => {
    for (const body of [null, "nope", 42, undefined]) {
      const result = await handleExplain(body, deps());
      expect(result.status).toBe(400);
      expect(result.body).toEqual({ error: "invalid_request" });
    }
  });

  it("returns 400 when topicId is missing or blank", async () => {
    for (const topicId of [undefined, "", "   "]) {
      const result = await handleExplain({ ...VALID_BODY, topicId }, deps());
      expect(result.status).toBe(400);
    }
  });

  it("returns 400 when question is missing or blank", async () => {
    for (const question of [undefined, "", "   "]) {
      const result = await handleExplain({ ...VALID_BODY, question }, deps());
      expect(result.status).toBe(400);
    }
  });

  it("returns 400 when the question exceeds 500 chars", async () => {
    const result = await handleExplain(
      { ...VALID_BODY, question: "q".repeat(501) },
      deps()
    );
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: "invalid_request" });
  });

  it("returns 400 when the step is missing or malformed", async () => {
    const noStep = await handleExplain(
      { topicId: "dijkstra", question: "Why?" },
      deps()
    );
    expect(noStep.status).toBe(400);

    const badStep = await handleExplain(
      { ...VALID_BODY, step: { index: 1, total: 5 } },
      deps()
    );
    expect(badStep.status).toBe(400);
  });

  it("returns 400 for an unknown topic slug", async () => {
    const result = await handleExplain(
      { ...VALID_BODY, topicId: "does-not-exist" },
      deps()
    );
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: "invalid_request" });
  });

  it("returns 400 for a coming-soon topic (resolver yields undefined)", async () => {
    const comingSoonResolver = (slug: string): Topic | undefined =>
      slug === "future-topic" ? undefined : getAvailableTopic(slug);
    const result = await handleExplain(
      { ...VALID_BODY, topicId: "future-topic" },
      deps({ resolveTopic: comingSoonResolver })
    );
    expect(result.status).toBe(400);
  });
});
