import { describe, expect, it } from "vitest";
import { resolveConfig, isConfigured } from "./config";

describe("resolveConfig", () => {
  it("defaults provider and model and reports no key as not configured", () => {
    const config = resolveConfig({});
    expect(config.provider).toBe("gemini");
    expect(config.model).toBe("gemini-2.0-flash");
    expect(config.apiKey).toBeNull();
    expect(isConfigured(config)).toBe(false);
  });

  it("treats a present key as configured", () => {
    const config = resolveConfig({ GEMINI_API_KEY: "secret-key" });
    expect(config.apiKey).toBe("secret-key");
    expect(isConfigured(config)).toBe(true);
  });

  it("treats an empty or whitespace-only key as not configured", () => {
    expect(isConfigured(resolveConfig({ GEMINI_API_KEY: "" }))).toBe(false);
    expect(isConfigured(resolveConfig({ GEMINI_API_KEY: "   " }))).toBe(false);
  });

  it("honors the provider override", () => {
    expect(resolveConfig({ EXPLAIN_PROVIDER: "openai" }).provider).toBe(
      "openai"
    );
  });

  it("honors the model override", () => {
    expect(resolveConfig({ EXPLAIN_MODEL: "gemini-1.5-pro" }).model).toBe(
      "gemini-1.5-pro"
    );
  });

  it("trims surrounding whitespace from the key", () => {
    expect(resolveConfig({ GEMINI_API_KEY: "  key  " }).apiKey).toBe("key");
  });
});
