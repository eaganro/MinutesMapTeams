<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Minutes Map Teams Agent Notes

This repo is the Next.js frontend for Minutes Map team and player pages. The data pipeline lives separately in `../BasketballStats`; do not edit that repo unless the user explicitly asks.

## Related Backend Repo

`../BasketballStats` owns the main MinutesMap product and backend. Its core user-facing feature is the live game experience: high-density live game pages, play-by-play visualization, schedule navigation, and real-time update signaling. It is also responsible for collection and artifact generation:

- polling NBA schedule, box score, and play-by-play feeds
- creating and updating `data/gamepack/{GAME_ID}.json.gz`
- serving/building the primary live game frontend and related visualization logic
- managing the serverless live-update path, including WebSocket notifications and S3/CloudFront-delivered game data
- defining much of the AWS infrastructure, IAM, Lambda, EventBridge, S3, CloudFront, DynamoDB, and API Gateway setup
- creating static page artifacts under `data/pages/teams/*` and `data/pages/players/*`
- creating compact live status artifacts under `data/pages/team-status/*`
- marking team-status games live at game start and clearing them after final page artifacts are written
- calling this app's `/api/revalidate` endpoint with affected team/player paths

This frontend is a companion app for team and player season pages. It should consume the artifacts and live gamepacks produced by `../BasketballStats` and avoid duplicating that repo's backend or primary live-game responsibilities. If a change requires different artifact contents, write timing, live-game processing, or infrastructure permissions, discuss or modify `../BasketballStats` explicitly rather than adding broad client-side workarounds here.

## Data Model And S3 Paths

The app reads compressed JSON artifacts from the `roryeagan.com-nba-processed-data` S3 bucket.

- Team page files: `data/pages/teams/{TEAM}/{SEASON}.json.gz`
- Player page files: `data/pages/players/{PLAYER_ID}/{SEASON}.json.gz`
- Team live status files: `data/pages/team-status/{TEAM}/{SEASON}.json.gz`
- Live gamepacks: `data/gamepack/{GAME_ID}.json.gz`

Team/player pages are primarily static. Live data is layered on in client components after page load.

## Live Game Strategy

The browser should not fetch S3 directly. Client components call app API routes:

- `/api/team-status/{teamAbbr}` proxies the team-status artifact.
- `/api/live-games/{gameId}` proxies `data/gamepack/{gameId}.json.gz`.

Keep the polling conservative:

- Fetch team-status once on initial page load.
- Only poll if that initial status indicates a live game.
- For player pages, check the player artifact's known NBA teams, then narrow to the active team once the player is found in a live gamepack.
- Do not keep polling team-status once live gamepack polling is established.
- Stop gamepack polling when the gamepack indicates final.

The `gamepackKey` field is only a signal that a live gamepack exists. The client should request gamepacks by `gameId` through `/api/live-games/{gameId}`.

## Frontend Live Box Details

Current live gamepacks include player `stats.oreb` and `stats.dreb`, but may not include `stats.reb`. Derive live total rebounds as `oreb + dreb` when `reb` is missing.

Player pages only show a temporary live row if the player appears in the live box score. Do not show inactive/DNP placeholders unless the user asks for that behavior.

## Revalidation

The backend pipeline calls `/api/revalidate` with affected teams/players after page artifacts change. Do not add broad revalidation or full-site refresh behavior unless specifically requested.

## Validation

For frontend code changes, prefer:

```bash
npm run typecheck
npm run lint
```

The user usually runs `npm run build` themselves unless they ask the agent to run it.
