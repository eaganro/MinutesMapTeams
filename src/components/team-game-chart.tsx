"use client";

import Link from "next/link";
import { BoxTable } from "@/components/box-table";
import {
  MinutesChart,
  type ChartColumn,
  type ChartRow,
} from "@/components/chart/minutes-chart";
import { StatChips, useStatToggles } from "@/components/chart/stat-chips";
import { formatSigned, formatWholeMinutes, toNumber } from "@/lib/format";
import { getGamePageUrl } from "@/lib/game-url";
import {
  buildGamepackPlayerBox,
  getGamepackPlayerFlow,
  getGamepackPlayerName,
  getGamepackSide,
  getPlayerNameVariants,
  type Gamepack,
} from "@/lib/live";
import type { TeamGame } from "@/lib/team-data";
import { buildGameTimeline } from "@/lib/timeline";

const COLUMNS: ChartColumn[] = [
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS", primary: true, highlight: true },
  { key: "reb", label: "REB", highlight: true },
  { key: "ast", label: "AST", highlight: true },
  { key: "pm", label: "+/-" },
];

type TeamGameChartProps = {
  game: TeamGame;
  teamAbbr: string;
  gamepack: Gamepack | undefined;
  // "loading" and "error" describe the gamepack fetch.
  status: "ready" | "loading" | "error";
  seasonPathSuffix: string;
};

// One game for one team: every player's minutes and plays on the game clock,
// then the box score. The opponent and the full view live on the main site.
export function TeamGameChart({
  game,
  teamAbbr,
  gamepack,
  status,
  seasonPathSuffix,
}: TeamGameChartProps) {
  const toggles = useStatToggles();
  const side = getGamepackSide(gamepack, teamAbbr, game.homeAway);
  const gamepackPlayers = gamepack?.box?.teams?.[side]?.players ?? [];
  const players = gamepackPlayers
    .map((player) => {
      const first = String(player.first ?? "").trim();
      const last = String(player.last ?? "").trim();
      const playerId = toNumber(player.id);
      const nameVariants = getPlayerNameVariants(first, last, playerId);

      return {
        playerId,
        name: getGamepackPlayerName(player),
        nameVariants,
        box: buildGamepackPlayerBox(player),
        timeline: buildGameTimeline({
          ...getGamepackPlayerFlow(gamepack, side, nameVariants),
          nbaGameId: game.nbaGameId,
          season: game.season,
        }),
      };
    })
    .filter(
      (player) =>
        (player.box.seconds ?? 0) > 0 ||
        player.timeline.segments.length > 0 ||
        player.timeline.markers.length > 0,
    )
    .sort((left, right) => (right.box.seconds ?? 0) - (left.box.seconds ?? 0));

  const rows: ChartRow[] = players.map((player) => ({
    key: String(player.playerId || player.name),
    name: player.name,
    label: player.playerId ? (
      <Link
        href={`/players/${player.playerId}${seasonPathSuffix}`}
        className="hover:underline"
      >
        {player.name}
      </Link>
    ) : (
      player.name
    ),
    timeline: player.timeline,
    cells: [
      formatWholeMinutes(player.box),
      player.box.pts,
      player.box.reb,
      player.box.ast,
      formatSigned(player.box.pm),
    ],
    nameVariants: player.nameVariants,
    score: { side, teamAbbr, opponentAbbr: game.opponentAbbr },
  }));

  // The artifact's box score covers finished games even without a gamepack.
  const boxPlayers = players.length
    ? players
    : [...game.players].sort(
        (left, right) => (right.box.seconds ?? 0) - (left.box.seconds ?? 0),
      );
  const gameUrl = getGamePageUrl({
    date: game.date,
    homeAway: game.homeAway,
    teamAbbr,
    opponentAbbr: game.opponentAbbr,
  });

  return (
    <div className="space-y-3">
      {rows.length ? (
        <>
          <MinutesChart
            rows={rows}
            columns={COLUMNS}
            statOn={toggles.statOn}
            emphasized={toggles.emphasized}
            labelHeader="Player"
            ariaLabel={`${teamAbbr} minutes and plays, ${game.date}`}
            minPeriods={Math.max(4, toNumber(gamepack?.flow?.periods))}
          />
          <StatChips toggles={toggles} />
        </>
      ) : (
        <p className="rounded-xl bg-card-alt px-4 py-5 text-center text-[13px] text-muted">
          {status === "loading"
            ? "Loading play-by-play…"
            : "Play-by-play is not available for this game."}
        </p>
      )}

      {boxPlayers.length ? (
        <BoxTable
          ariaLabel={`${teamAbbr} box score, ${game.date}`}
          rows={boxPlayers.map((player) => ({
            key: player.playerId || player.name,
            name: player.name,
            href: player.playerId
              ? `/players/${player.playerId}${seasonPathSuffix}`
              : undefined,
            box: player.box,
          }))}
          total={
            game.teamStats.pts !== undefined ? game.teamStats : undefined
          }
        />
      ) : null}

      <p className="text-right text-[13px] font-semibold">
        <a href={gameUrl} className="text-link hover:underline">
          Both teams, lineups and score flow on MinutesMap →
        </a>
      </p>
    </div>
  );
}
