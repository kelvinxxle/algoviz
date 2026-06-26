import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExplainConfig } from "./config";
import type { AssembledPrompt } from "./types";
import {
  ProviderError,
  createGeminiProvider,
  getProvider,
} from "./provider";

const CONFIG: ExplainConfig = {
  provider: "gemini",
  model: "gemini-2.0-flash",
  apiKey: "test-key",
};

const PROMPT: AssembledPrompt = {
  system: "You are scoped to Dijkstra.",
  user: "Why a heap?",
};

function mockFetch(impl: typeof fetch): void {
  vi.stubGlobal("fetch", vi.fn(impl));
}

function fetchMock(): ReturnType<typeof vi.fn> {
  return globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
}

function jsonResponse(body: unknown, init?: { ok?: boolean; status?: number }) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createGeminiProvider", () => {
  beforeEach(() => {
    mockFetch(async () =>
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "Because the heap..." }] } }],
      })
    );
  });

  it("returns the candidate answer text on success", async () => {
    const provider = createGeminiProvider(CONFIG);
    await expect(provider.ask(PROMPT)).resolves.toBe("Because the heap...");
  });

  it("posts to the model endpoint with the api-key header and request body", async () => {
    const provider = createGeminiProvider(CONFIG);
    await provider.ask(PROMPT);

    const [url, init] = fetchMock().mock.calls[0];
    expect(url).toContain(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    );
    expect(init.method).toBe("POST");
    expect(init.headers["x-goog-api-key"]).toBe("test-key");

    const sent = JSON.parse(init.body);
    expect(sent.system_instruction.parts[0].text).toBe(PROMPT.system);
    expect(sent.contents[0].parts[0].text).toBe(PROMPT.user);
    expect(sent.generationConfig.temperature).toBe(0.2);
    expect(sent.generationConfig.maxOutputTokens).toBe(800);
  });

  it("exposes its provider name", () => {
    expect(createGeminiProvider(CONFIG).name).toBe("gemini");
  });
});

describe("createGeminiProvider failures never return a string", () => {
  it("throws a ProviderError on a non-ok HTTP status", async () => {
    mockFetch(async () => jsonResponse({}, { ok: false, status: 500 }));
    await expect(createGeminiProvider(CONFIG).ask(PROMPT)).rejects.toBeInstanceOf(
      ProviderError
    );
  });

  it("throws a ProviderError on a network failure", async () => {
    mockFetch(async () => {
      throw new Error("ECONNRESET");
    });
    await expect(createGeminiProvider(CONFIG).ask(PROMPT)).rejects.toBeInstanceOf(
      ProviderError
    );
  });

  it("throws a ProviderError when the body cannot be parsed", async () => {
    mockFetch(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error("bad json");
          },
        }) as unknown as Response
    );
    await expect(createGeminiProvider(CONFIG).ask(PROMPT)).rejects.toBeInstanceOf(
      ProviderError
    );
  });

  it("throws a ProviderError when the response has no answer text", async () => {
    mockFetch(async () => jsonResponse({ candidates: [] }));
    await expect(createGeminiProvider(CONFIG).ask(PROMPT)).rejects.toBeInstanceOf(
      ProviderError
    );
  });
});

describe("getProvider", () => {
  it("returns the gemini implementation for the gemini provider", () => {
    expect(getProvider(CONFIG).name).toBe("gemini");
  });

  it("throws a ProviderError for an unknown provider", () => {
    expect(() => getProvider({ ...CONFIG, provider: "unknown" })).toThrow(
      ProviderError
    );
  });
});
