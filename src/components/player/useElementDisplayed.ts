"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True when the element currently resolves to a visible box. An element hidden
 * by a display:none ancestor (for example the workbench below the md breakpoint)
 * reports offsetParent === null. This reads the real, CSS-driven layout state; it
 * never queries a media query or a breakpoint, so it honors the CSS-only
 * responsive-gating non-goal while letting client logic react to what is on
 * screen.
 */
export function isElementDisplayed(el: HTMLElement | null): boolean {
  return el != null && el.offsetParent != null;
}

/**
 * Track whether the referenced element is displayed. Starts false so the server
 * render and the first client render agree (hydration-safe); a post-mount effect
 * reads the real layout, and a window resize listener re-checks when a breakpoint
 * crossing changes what the CSS shows.
 */
export function useElementDisplayed(
  ref: RefObject<HTMLElement | null>
): boolean {
  const [displayed, setDisplayed] = useState(false);
  useEffect(() => {
    const update = () => setDisplayed(isElementDisplayed(ref.current));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);
  return displayed;
}
