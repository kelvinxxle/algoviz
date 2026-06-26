import { describe, expect, it } from "vitest";
import { rootMetadata } from "./metadata";

describe("rootMetadata", () => {
  it("sets an absolute metadataBase", () => {
    const base = rootMetadata().metadataBase;
    expect(base).toBeInstanceOf(URL);
    expect((base as URL).protocol).toMatch(/^https?:$/);
  });

  it("uses a title template so child pages append the brand", () => {
    const title = rootMetadata().title as {
      default: string;
      template: string;
    };
    expect(title.default).toContain("AlgoViz");
    expect(title.template).toBe("%s | AlgoViz");
  });

  it("declares Open Graph and a large summary Twitter card", () => {
    const meta = rootMetadata();
    const og = meta.openGraph as { type?: string; siteName?: string };
    expect(og?.type).toBe("website");
    expect(og?.siteName).toBe("AlgoViz");
    expect((meta.twitter as { card?: string })?.card).toBe(
      "summary_large_image"
    );
  });
});
