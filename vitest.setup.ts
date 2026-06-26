import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// jsdom has no layout engine, so HTMLElement.offsetParent is always null. The
// visibility gate (useElementDisplayed) reads offsetParent, which works in a
// real browser but never in jsdom. Approximate the browser closely enough for
// tests: a connected element reports its parent as the offset parent; a
// detached element reports null. This override only changes offsetParent inside
// the jsdom/Vitest environment so visibility-gated components are testable;
// production relies on the real browser offsetParent.
Object.defineProperty(HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get(this: HTMLElement) {
    return this.parentElement;
  },
});
