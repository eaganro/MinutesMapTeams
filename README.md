## Minutes Map Teams

Minutes Map Teams is a Next.js app for exploring NBA team and player performance through static season pages with lightweight live-game updates. It is part of a larger basketball data system that processes NBA game data into S3 artifacts, then serves those artifacts through fast, mostly static pages.

This repo is the frontend slice: team indexes, team season pages, player season pages, and the small API routes needed to bridge static page data with live game files.

## What It Shows

- Team pages with schedule/results, roster output, season-type filters, and live game overlays.
- Player pages with season splits, per-game box scores, event timelines, and live game insertion when the player appears in the active box score.
- Static generation for team and player pages backed by compressed JSON artifacts in S3.
- On-demand revalidation endpoints so the data pipeline can refresh affected pages after games finalize.
- Live game reads scoped to active games, avoiding constant polling across every team or player page.

## Technical Notes

- Built with Next.js App Router, React, TypeScript, and Tailwind CSS.
- Uses S3 page artifacts as the primary data source rather than a database at request time.
- Keeps completed-game data static and only fetches live gamepack data on the client when a page initially detects an active game.
- Shares live-game discovery through compact `team-status` artifacts so team and player pages can avoid rewriting many page files during live games.

## Local Development

```bash
npm install
npm run dev
```

The dev server runs on [http://localhost:4000](http://localhost:4000).

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Repo Structure

- `src/app` Next.js routes, API routes, layouts, and pages.
- `src/components` team/player views, tables, filters, timelines, and shared UI.
- `src/lib` S3 data loaders, data types, and URL helpers.
- `public` static assets.
