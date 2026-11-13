## Minutes Map Teams

Minutes Map Teams is a Next.js app for exploring NBA team and player performance through static season pages with lightweight live-game updates. It is part of a larger basketball data system that processes NBA game data into S3 artifacts, then serves those artifacts through fast, mostly static pages.

This repo is the frontend slice: team indexes, team season pages, player season pages, and the small API routes needed to bridge static page data with live game files.

## What It Shows

- Player pages built around a season map: one row per game, a line while the player was on the floor and a symbol for every shot, rebound, assist, turnover, block, steal and foul. Hover a play for the detail and the score at the time, pin it for the nba.com video link, open a game for its box score.
- A "typical rotation" strip on each player page showing how often the player is on the floor at each point of a game.
- Team pages with record splits, a results-by-game strip, upcoming games, sortable roster averages, and a minutes map for any game (every player on the game clock).
- A home page with conference standings, and a header search for any team or player (press `/`).
- Multiple seasons: `/teams/BOS` and `/players/{id}` show the latest season, `/teams/BOS/2025-26` a specific one, with a season switcher on each page.
- Live game overlays on team and player pages, polled only while a game is in progress.
- Static generation backed by compressed JSON artifacts in S3, with on-demand revalidation from the data pipeline.

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

Data is read from S3 with your AWS credentials. To work without them, create `.env.local` with `PAGE_DATA_BASE_URL=https://minutesmap.com` to read the same artifacts over the public CDN.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Repo Structure

- `src/app` Next.js routes, API routes, layouts, and pages.
- `src/components` team/player views, tables, filters, and shared UI; `src/components/chart` is the minutes chart.
- `src/hooks` live-game polling.
- `src/lib` S3 data loaders, data types, play-by-play classification, and team metadata.
- `public` static assets.
