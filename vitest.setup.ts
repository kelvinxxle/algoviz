import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// jsdom has no layout engine, so HTMLElement.offsetParent is always null. The
// visibility gate (useElementDisplayed) relies on it, so approximate the browser
// closely enough for tests: a connected element reports its parent as the offset
// parent; a detached element reports null. No production code path reads
// offsetParent, so this only affects the test environment.
Object.defineProperty(HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get(this: HTMLElement) {
    return this.parentElement;
  },
});
