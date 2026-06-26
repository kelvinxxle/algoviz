import type { ExplainConfig } from "./config";
import type { AssembledPrompt, LlmProvider } from "./types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Typed error thrown by every provider failure path (network, HTTP, parse, or
 * a response with no answer text). The handler maps it to `502 provider_error`.
 * A provider never returns a fabricated answer on failure: it throws this.
 */
export class ProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ProviderError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

function extractAnswer(data: GeminiResponse): string | null {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.trim().length > 0 ? text : null;
}

/** Build a Gemini provider bound to the resolved config. */
export function createGeminiProvider(config: ExplainConfig): LlmProvider {
  return {
    name: "gemini",
    async ask(prompt: AssembledPrompt): Promise<string> {
      const url = `${GEMINI_BASE}/${config.model}:generateContent`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": config.apiKey ?? "",
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: prompt.system }] },
            contents: [{ role: "user", parts: [{ text: prompt.user }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
          }),
        });
      } catch (cause) {
        throw new ProviderError("Network error contacting Gemini", { cause });
      }

      if (!response.ok) {
        throw new ProviderError(`Gemini returned HTTP ${response.status}`);
      }

      let data: GeminiResponse;
      try {
        data = (await response.json()) as GeminiResponse;
      } catch (cause) {
        throw new ProviderError("Could not parse the Gemini response", {
          cause,
        });
      }

      const answer = extractAnswer(data);
      if (answer === null) {
        throw new ProviderError("Gemini response contained no answer text");
      }
      return answer;
    },
  };
}

/**
 * Select the provider implementation named by the config. v1 ships `gemini`;
 * add an impl and a case here to support another provider.
 */
export function getProvider(config: ExplainConfig): LlmProvider {
  switch (config.provider) {
    case "gemini":
      return createGeminiProvider(config);
    default:
      throw new ProviderError(`Unknown explain provider: ${config.provider}`);
  }
}
