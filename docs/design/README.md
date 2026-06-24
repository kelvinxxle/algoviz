# Design references

UI/UX direction exports for AlgoViz. These are **reference artifacts**, not production code.
They capture the intended visual language and per-screen layout so implementation can match
the agreed look and feel. The PRD (`docs/prd.md`) remains the source of truth for scope;
these inform *how it should look*, not *what to build*.

## Shared visual language

- **`color-palette.md`** Theme "Deep Midnight" (dark surface, cyan primary, mint secondary).
  Use these tokens as the basis for the app's color system.

## Per-screen designs

Each folder contains a static `code.html` mockup, a `screen.png` render, and a `DESIGN.md`
with notes and the palette front matter.

| Folder | Screen | Maps to |
|--------|--------|---------|
| `topic-library/` | Flat browsable library landing | The 10-topic home grid |
| `dijkstra/` | A topic page with the walkthrough player | M1 reference vertical slice |
| `bloom-filter/` | A topic page (systems flavor) | Bloom Filters topic |
| `lru-cache/` | A topic page (systems flavor) | LRU Cache topic |

## Notes

- `code.html` files are Stitch-style static mockups for visual reference only. Do not wire
  them into the build directly; re-implement in the chosen stack.
- Screens reflect the "show then drive" model: a guided walkthrough first, then the same
  view driven by user input.
