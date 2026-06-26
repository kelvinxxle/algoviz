# Deploying AlgoViz to Vercel

AlgoViz is a standard Next.js App Router app with one dynamic Route Handler
(`/api/explain`) and statically generated topic pages. Vercel auto detects the
framework, so no `vercel.json` is required.

## 1. Import the repository

1. In the Vercel dashboard, choose "Add New" then "Project".
2. Import the `kelvinxxle/algoviz` GitHub repository.
3. Leave the framework preset as "Next.js" and the build command and output
   directory at their defaults.

## 2. Set environment variables

The app builds and runs with no environment variables. The AI explainer stays
in an honest "not configured" state (HTTP 503 with a calm notice) until you
provide a key. To enable it, set these in Project Settings then Environment
Variables (see `.env.example` for the full list):

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | To enable the explainer | Server side Google Gemini key. Unset or blank keeps the explainer in the honest 503 state. |
| `EXPLAIN_PROVIDER` | No | Provider implementation. Default `gemini`. |
| `EXPLAIN_MODEL` | No | Model id. Default `gemini-2.0-flash`. |
| `NEXT_PUBLIC_SITE_URL` | No | Pins canonical, sitemap, robots, and social URLs to your domain. Defaults to the Vercel production URL. |

`GEMINI_API_KEY` is read only on the server in `/api/explain`; it is never
exposed to the browser.

## 3. Deploy

Trigger the first deployment. Vercel builds the production bundle, prerenders
the topic pages, and serves `/api/explain` as a serverless function.

## 4. Verify

- Open the deployed URL: the topic library landing renders.
- Open a topic, for example `/topics/dijkstra`: the walkthrough plays and the
  page title reads "Dijkstra's Shortest Path | AlgoViz".
- Visit `/robots.txt` and `/sitemap.xml`: both resolve, and the sitemap lists
  every available topic.
- Check the AI explainer panel on a topic page:
  - With no `GEMINI_API_KEY`, it shows the honest "not configured" notice.
  - With a valid `GEMINI_API_KEY`, it answers scoped questions about the topic.
- Request an unknown topic, for example `/topics/does-not-exist`: the branded
  404 renders with an HTTP 404 status.

## Notes

- No live deploy is performed from the repository; you own the Vercel connection
  and the secret.
- To change the social preview image, edit `app/opengraph-image.tsx`.
