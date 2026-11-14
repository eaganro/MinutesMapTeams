<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Minutes Map Teams Agent Notes

This repo is the Next.js frontend for Minutes Map team and player pages. The data pipeline lives separately in `../MinutesMap`; do not edit that repo unless the user explicitly asks.

## Related Backend Repo

`../MinutesMap` owns the main MinutesMap product and backend. Its core user-facing feature is the live game experience: high-density live game pages, play-by-play visualization, schedule navigation, and real-time update signaling. It is also responsible for collection and artifact generation:

- polling NBA schedule, box score, and play-by-play feeds
- creating and updating `data/gamepack/{GAME_ID}.json.gz`
- serving/building the primary live game frontend and related visualization logic
- managing the serverless live-update path, including WebSocket notifications and S3/CloudFront-delivered game data
- defining much of the AWS infrastructure, IAM, Lambda, EventBridge, S3, CloudFront, DynamoDB, and API Gateway setup
- creating static page artifacts under `data/pages/teams/*` and `data/pages/players/*`
- creating compact live status artifacts under `data/pages/team-status/*`
- marking team-status games live at game start and clearing them after final page artifacts are written
- calling this app's `/api/revalidate` endpoint with affected team/player paths

This frontend is a companion app for team and player season pages. It should consume the artifacts and live gamepacks produced by `../MinutesMap` and avoid duplicating that repo's backend or primary live-game responsibilities. If a change requires different artifact contents, write timing, live-game processing, or infrastructure permissions, discuss or modify `../MinutesMap` explicitly rather than adding broad client-side workarounds here.

## Data Model And S3 Paths

The app reads compressed JSON artifacts from the `roryeagan.com-nba-processed-data` S3 bucket.

- Team page files: `data/pages/teams/{TEAM}/{SEASON}.json.gz`
- Player page files: `data/pages/players/{PLAYER_ID}/{SEASON}.json.gz`
- Team live status files: `data/pages/team-status/{TEAM}/{SEASON}.json.gz`
- Live gamepacks: `data/gamepack/{GAME_ID}.json.gz`

Team/player pages are primarily static. Live data is layered on in client components after page load.

## Seasons

Season labels look like `2026-27`. `src/lib/seasons.ts` derives the current season from the date the same way the backend does (a season starts in October), so there is no constant to bump each year. `EARLIEST_SEASON` is the oldest season with page artifacts; lower it if older seasons are backfilled.

- `/teams/{TEAM}` and `/players/{PLAYER_ID}` show the newest season that has an artifact. This is normally the current season; it falls back to an older one when there is no current artifact yet (early October, or a player who has not played this season).
- `/teams/{TEAM}/{SEASON}` and `/players/{PLAYER_ID}/{SEASON}` show a specific season.
- Links to the current season use the bare URL; links to older seasons carry the season suffix (`getSeasonPathSuffix`). Cross-links between team and player pages stay in the season being viewed.
- Each page lists the seasons that have an artifact for that team/player by probing S3 for every season from `EARLIEST_SEASON` to the current one.
- Live status and gamepack polling only run when the page shows the current season. `/api/team-status/{teamAbbr}` always reads the current season's status file.

## The Minutes Chart

The product's reason to exist is the minutes map: a line while a player is on the floor and a symbol for every play, on a shared game clock. Design decisions should serve it.

- `src/components/chart/minutes-chart.tsx` is the one chart. Player pages feed it one row per game (the season map); team pages feed it one row per player for a single game.
- `src/lib/timeline.ts` classifies play-by-play into symbols. It mirrors the main site's rules (`front/src/domain/events` and `front/src/ui/eventShapes.jsx` in `../MinutesMap`); keep the two in step so an event looks the same on both sites.
- Markers are positioned with percentages (nested `<svg x="…%">`), so the chart renders on the server and resizes without measuring. Do not reintroduce width measurement.
- Colours and tokens in `src/app/globals.css` mirror `front/src/theme.scss`; team colours in `src/lib/teams.ts` mirror `front/src/helpers/teamColors.js`. Team logos in `public/img/teams` are copies of the main site's.

## Live Game Strategy

The browser should not fetch S3 directly. Client components call app API routes:

- `/api/team-status/{teamAbbr}` proxies the team-status artifact.
- `/api/live-games/{gameId}` proxies `data/gamepack/{gameId}.json.gz`. Team pages also use it to load a finished game's gamepack when a game row is opened.
- `/api/search` serves the player directory for the header search box.

Keep the polling conservative. `src/hooks/use-live-games.ts` implements this for both page types:

- Fetch team-status once on initial page load.
- Only poll gamepacks if that initial status indicates a live game.
- For player pages, check the player artifact's known NBA teams, then narrow to the one game once the player is found in a live gamepack.
- Do not poll team-status.
- Stop gamepack polling when the gamepack indicates final.

The `gamepackKey` field is only a signal that a live gamepack exists. The client should request gamepacks by `gameId` through `/api/live-games/{gameId}`.

## Frontend Live Box Details

Current live gamepacks include player `stats.oreb` and `stats.dreb`, but may not include `stats.reb`. Derive live total rebounds as `oreb + dreb` when `reb` is missing.

Player pages only show a temporary live row if the player appears in the live box score. Do not show inactive/DNP placeholders unless the user asks for that behavior.

## Home Page, Game Days And Search

`src/lib/league-data.ts` reads all 30 team artifacts to build standings, a player directory and the current season's game dates, cached for an hour with `unstable_cache`. The home page and `/api/search` both use it. It is deliberately not tied to `/api/revalidate`.

`/days/{date}` shows a game day's best individual games by game score, each as a minutes map row (top 10, expandable to 30). The home page shows the latest day's top 6, one per team, and links to it. `src/lib/game-days.ts` builds a day from that season's team artifacts plus the day's gamepacks, and caches it forever once every game is final and every read succeeded; an incomplete build is shown but not cached. A day only counts once all of its games are final (`src/lib/game-dates.ts`), so today's slate is not shown while games are in progress. A live version is a possible later addition; it should poll one cached server aggregate, not every gamepack per viewer.

## Local Data Without AWS Credentials

Set `PAGE_DATA_BASE_URL=https://minutesmap.com` in `.env.local` to read the same artifacts over the public CDN instead of S3. Leave it unset in production.

## Revalidation

The backend pipeline calls `/api/revalidate` with affected teams/players after page artifacts change. The backend sends bare paths (`/teams/BOS`, `/players/123`); the route also revalidates each known season path under them, because every season page embeds the list of available seasons. Do not add broad revalidation or full-site refresh behavior unless specifically requested.

## Validation

For frontend code changes, prefer:

```bash
npm run typecheck
npm run lint
```

The user usually runs `npm run build` themselves unless they ask the agent to run it.
