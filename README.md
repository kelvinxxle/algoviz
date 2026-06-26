# AlgoViz

Make invisible algorithms visible. AlgoViz is a small, curated library where each
intermediate-to-advanced algorithm is something you watch happen, then make your own by
feeding it your own input.

AlgoViz ships ten interactive algorithm explainers: a guided walkthrough, a
custom input sandbox, and a scoped AI explainer per topic. The app is
responsive (tablet and up for the workbench), accessible (keyboard operable
player, focus rings, reduced motion), and deploy ready for Vercel.

## Status

| Area                  | State                                   |
| --------------------- | --------------------------------------- |
| Topic library landing | Done (10 topics, all available)         |
| Topic visualizations  | Done (guided walkthrough plus sandbox)  |
| AI explainer          | Done (scoped, honest 503 without a key) |

There are no accounts, no progress tracking, and no persistence by design (see the PRD
non-goals).

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS with the Deep Midnight palette as CSS-variable theme tokens
- Geist (UI) and JetBrains Mono (code/data) fonts
- Vitest + React Testing Library for unit and component tests
- Playwright for end-to-end tests
- ESLint + Prettier
- GitHub Actions CI

See [`docs/tech-stack.md`](docs/tech-stack.md) for the rationale.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Script                 | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the dev server                     |
| `npm run build`        | Production build                         |
| `npm run start`        | Serve the production build               |
| `npm run lint`         | ESLint                                   |
| `npm run format:check` | Prettier check (`npm run format` to fix) |
| `npm run typecheck`    | TypeScript, no emit                      |
| `npm test`             | Vitest unit and component tests          |
| `npm run test:e2e`     | Playwright end-to-end tests              |

## Design system

The "Deep Midnight" palette (true-black surfaces, cyan primary, mint secondary), 0px
border radius, and 1px borders are defined in [`docs/design/`](docs/design/) and wired
into `tailwind.config.ts` and `app/globals.css`.

## Deploy

AlgoViz deploys to Vercel with zero config. See [`docs/deploy.md`](docs/deploy.md)
for the import, environment variable, and verification steps. The AI explainer
needs a `GEMINI_API_KEY`; without one the app still builds and runs and the
explainer shows an honest "not configured" notice.

## References

- [Product brief](docs/prd.md)
- [Tech stack](docs/tech-stack.md)
- [Design references](docs/design/)
- [Deploy guide](docs/deploy.md)
