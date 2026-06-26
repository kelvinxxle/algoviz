import type { ReactNode } from "react";

/** One row in the shortcuts list: the keys and what they do. */
function Row({ keys, label }: { keys: string; label: string }): ReactNode {
  return (
    <li className="flex items-center justify-between gap-md py-xs">
      <span className="text-on-surface-variant">{label}</span>
      <kbd className="font-code-md text-[11px] text-on-surface">{keys}</kbd>
    </li>
  );
}

/**
 * A native, state-free disclosure that lists the player keyboard shortcuts so a
 * keyboard user can learn and a screen reader can announce them. Pairs with the
 * aria-keyshortcuts attributes on the transport controls.
 */
export function KeyboardShortcuts(): ReactNode {
  return (
    <details
      data-testid="keyboard-shortcuts"
      aria-label="Keyboard shortcuts"
      className="border-t border-outline-variant pt-md"
    >
      <summary className="cursor-pointer list-none font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface">
        Keyboard shortcuts
      </summary>
      <ul className="mt-sm font-body-md text-body-md">
        <Row keys="Space / K" label="Play or pause" />
        <Row keys="Right / Left" label="Step forward or back" />
        <Row keys="Shift + Right / Left" label="Jump five steps" />
        <Row keys="Home / End" label="First or last step" />
        <Row keys="R" label="Reset" />
      </ul>
    </details>
  );
}
