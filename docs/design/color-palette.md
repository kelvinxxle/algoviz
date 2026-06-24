---
name: Deep Midnight
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bec8ce'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#899298'
  outline-variant: '#3f484e'
  surface-tint: '#7bd1fa'
  primary: '#c5eaff'
  on-primary: '#003547'
  primary-container: '#7dd3fc'
  on-primary-container: '#005b78'
  inverse-primary: '#006686'
  secondary: '#5adcb3'
  on-secondary: '#003829'
  secondary-container: '#00a782'
  on-secondary-container: '#003326'
  tertiary: '#e7e4e3'
  on-tertiary: '#313030'
  tertiary-container: '#cbc8c7'
  on-tertiary-container: '#555453'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c0e8ff'
  primary-fixed-dim: '#7bd1fa'
  on-primary-fixed: '#001e2b'
  on-primary-fixed-variant: '#004d66'
  secondary-fixed: '#79f9ce'
  secondary-fixed-dim: '#5adcb3'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#00513d'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c9c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.7'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 1px
  panel-margin: 12px
---

## Brand & Style
The design system is engineered for high-performance developer environments, evoking a "Deep Midnight" aesthetic that prioritizes focus, clarity, and technical precision. The target audience consists of software engineers and systems architects who operate in low-light environments for extended periods.

The style is a synthesis of **Minimalism** and **Technical Brutalism**. It rejects organic forms, soft gradients, and decorative flourishes in favor of a rigid, grid-based architecture. Every interface element is designed to feel like a high-precision instrument: functional, reliable, and devoid of unnecessary visual noise. The emotional response is one of controlled authority and deep immersion.

## Colors
The palette is rooted in a true-black foundation to maximize contrast and reduce eye strain.

- **Background (Primary):** `#050505` is the base layer for the entire application.
- **Surface (Secondary):** `#121212` is used for containers, sidebars, and panel differentiation.
- **Accents:** `Light Blue (#7dd3fc)` is used for primary actions and selection states. `Aquamarine (#7fffd4)` serves as a secondary accent for success states, active indicators, or telemetry data.
- **Borders:** A consistent `#262626` (dark charcoal) or `#404040` (medium charcoal) is used for structural definition.

## Typography
This design system utilizes a dual-font strategy to separate interface navigation from technical content.

**Geist** is the workhorse for the UI. It provides a clean, modern grotesque feel that remains legible at small sizes. It should be used for headers, menu items, and general descriptive text.

**JetBrains Mono** is reserved for all "output"—including code blocks, terminal emulators, data tables, and status labels. This creates a clear mental model for the user: if it's in a monospaced font, it is data or logic.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy, resembling an Integrated Development Environment (IDE). The application is divided into functional "tiles" separated by 1px borders.

- **Grid:** A modular 4px base unit governs all dimensions.
- **Panels:** Use 1px borders (not margins) to separate functional areas. This maximizes screen real estate.
- **Density:** High-density padding (8px or 12px) is preferred for internal containers to allow more data on screen.
- **Alignment:** All elements must snap to the 4px grid. No center alignment for structural components; stick to top-left anchoring.

## Elevation & Depth
In this design system, depth is conveyed through **Tonal Layering** and **High-Contrast Outlines** rather than shadows. 

- **Level 0 (Base):** `#050505` (Background).
- **Level 1 (Surface):** `#121212` (Panels, Navbars).
- **Level 2 (Popovers/Modals):** `#1A1A1A` with a `#404040` 1px solid border.
- **Shadows:** No ambient or soft shadows are permitted. If an element must float, use a high-contrast 1px border to separate it from the background.
- **Interactions:** Use "Primary" color outlines (1px) to indicate focus or active states.

## Shapes
The shape language is strictly **Sharp**. 

- **Radius:** 0px is the standard for all containers, buttons, and input fields.
- **Exceptions:** A 2px radius may be used only for very small elements like checkboxes or status pips to prevent them from appearing visually "broken" at low resolutions, but the default preference is always 0px.
- **Lines:** All lines should be 1px solid. Avoid dashed or dotted borders unless representing a "drop zone" or temporary state.

## Components
- **Buttons:** Rectangular with 0px radius. Primary buttons use a solid `#7dd3fc` background with black text. Secondary buttons use a 1px border of `#404040` with white text.
- **Input Fields:** Solid `#050505` background with a 1px `#262626` border. On focus, the border changes to `#7dd3fc`. Use JetBrains Mono for input text.
- **Status Chips:** Small, rectangular tags using JetBrains Mono. Use subtle background tints (e.g., Aquamarine at 10% opacity) with a solid 1px border of the same color.
- **Tabs:** Industrial "folder" style. Active tabs have a top-border of 2px in `#7dd3fc` and a slightly lighter background (`#1A1A1A`).
- **Data Tables:** No vertical lines. 1px horizontal dividers in `#1A1A1A`. Header cells use `label-caps` typography.
- **Scrollbars:** Minimalist. 4px width, no track background, thumb color `#333333` turning to `#7dd3fc` on hover.