"use client";

import { useEffect } from "react";
import type { PlayerStore } from "@/engine/store";

/** How many frames a Shift+Arrow scrub jumps. */
const SCRUB_STEP = 5;

/** True when focus sits in an element that consumes typed keys itself. */
function isFormField(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/** True for elements that natively activate on Space (avoid double toggle). */
function isClickable(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.tagName === "BUTTON" || el.tagName === "A";
}

/**
 * Global player keyboard shortcuts for the workbench. Bindings dispatch the same
 * store actions the on-screen controls do, so keyboard and pointer stay in sync.
 * Shortcuts are suppressed while focus is in a form field (the sandbox textarea
 * and the scrubber included), and Space is suppressed on a focused button or
 * link so it does not double-fire with the element's native activation.
 */
export function useKeyboardShortcuts(store: PlayerStore): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement;
      if (isFormField(active)) return;

      const state = store.getState();
      const last = state.steps.length > 0 ? state.steps.length - 1 : 0;

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          if (event.key === " " && isClickable(active)) return;
          event.preventDefault();
          state.toggle();
          break;
        case "ArrowRight":
          event.preventDefault();
          if (event.shiftKey) state.seek(state.index + SCRUB_STEP);
          else state.next();
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (event.shiftKey) state.seek(state.index - SCRUB_STEP);
          else state.prev();
          break;
        case "Home":
          event.preventDefault();
          state.seek(0);
          break;
        case "End":
          event.preventDefault();
          state.seek(last);
          break;
        case "r":
        case "R":
          event.preventDefault();
          state.reset();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store]);
}
