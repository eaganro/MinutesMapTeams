"use client";

import Link from "next/link";
import { useState } from "react";
import { BoxTable } from "@/components/box-table";
import {
  buildRotationHeat,
  MinutesChart,
  type ChartColumn,
  type ChartRow,
} from "@/components/chart/minutes-chart";
import { StatChips, useStatToggles } from "@/components/chart/stat-chips";
import {
  SeasonTypeSelector,
  type SeasonTypeSelectorOption,
} from "@/components/season-type-selector";
import { TeamLogo } from "@/components/team-logo";
import { useLiveGames, type LiveTeamGame } from "@/hooks/use-live-games";
import {
  addBoxScore,
  averageBoxScore,
  createEmptyStatLine,
  formatAverage,
  formatGameDate,
  formatLongGameDate,
  formatSeasonTypeLabel,
  formatSigned,
  formatWholeMinutes,
  getSeasonTypeGroup,
  toNumber,
} from "@/lib/format";
import { getGamePageUrl } from "@/lib/game-url";
import {
  buildGamepackPlayerBox,
  getGamepackPlayerFlow,
  getGamepackScore,
  getGamepackStatus,
  getPlayerNameVariants,
  type Gamepack,
} from "@/lib/live";
import type { PlayerGame, PlayerPageData } from "@/lib/player-data";
import { isTeamAbbreviation } from "@/lib/teams";
import { buildGameTimeline } from "@/lib/timeline";

type PlayerFilter = "all" | "regular" | "playoffs" | "other";

// A game row: a finished game from the artifact, or the game in progress.
type MapGame = Omit<PlayerGame, "result" | "gamepackKey"> & {
  result: PlayerGame["result"] | null;
  liveStatus?: string;
};

const COLUMNS: ChartColumn[] = [
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS", primary: true, highlight: true },
  { key: "reb", label: "REB", highlight: true },
  { key: "ast", label: "AST", highlight: true },
  { key: "pm", label: "+/-" },
];

function getFilterOf(game: MapGame) {
  return getSeasonTypeGroup(game.seasonType);
}

function getFilterOptions(games: MapGame[]) {
  const count = (filter: PlayerFilter) =>
    games.filter((game) => getFilterOf(game) === filter).length;
  const options: Array<SeasonTypeSelectorOption<PlayerFilter>> = [
    { value: "regular", label: "Regular Season", count: count("regular") },
    { value: "playoffs", label: "Playoffs", count: count("playoffs") },
    { value: "other", label: "Preseason & Other", count: count("other") },
  ].filter((option) => option.count > 0) as Array<
    SeasonTypeSelectorOption<PlayerFilter>
  >;

  return options.length > 1
    ? [{ value: "all" as const, label: "All", count: games.length }, ...options]
    : options;
}

// The player's row in a live gamepack, or null when they are not in the box
// score (inactive players get no placeholder row).
function buildLiveGame(
  playerPage: PlayerPageData,
  { game }: LiveTeamGame,
  gamepack: Gamepack | undefined,
  nameVariants: string[],
): MapGame | null {
  const side = game.homeAway;
  const teams = gamepack?.box?.teams;
  const team = teams?.[side];
  const opponent = teams?.[side === "home" ? "away" : "home"];
  const livePlayer = (team?.players ?? []).find(
    (player) => toNumber(player.id) === playerPage.player.id,
  );

  if (!livePlayer) {
    return null;
  }

  return {
    gameId: game.gameId,
    nbaGameId: game.nbaGameId,
    date: game.date,
    start: game.start,
    season: game.season,
    seasonType: game.seasonType,
    homeAway: side,
    result: null,
    liveStatus: getGamepackStatus(gamepack, game.status ?? "Live"),
    teamScore: getGamepackScore(gamepack, side) || game.teamScore,
    oppScore:
      getGamepackScore(gamepack, side === "home" ? "away" : "home") ||
      game.oppScore,
    teamId: toNumber(team?.id),
    teamAbbr:
      String(team?.abbr ?? "").toUpperCase() || playerPage.teams[0]?.abbr || "",
    teamName: String(team?.name ?? ""),
    opponentId: toNumber(opponent?.id) || game.opponentId,
    opponentAbbr: String(opponent?.abbr ?? game.opponentAbbr),
    opponentName: String(opponent?.name ?? game.opponentName),
    box: buildGamepackPlayerBox(livePlayer),
    playerId: playerPage.player.id,
    playerKey: playerPage.player.key,
    detail: getGamepackPlayerFlow(gamepack, side, nameVariants),
  };
}

function GameLabel({ game }: { game: MapGame }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="w-[42px] shrink-0 tabular-nums">
        {formatGameDate(game.date)}
      </span>
      <span className="hidden w-3 shrink-0 text-center text-muted sm:inline">
        {game.homeAway === "home" ? "v" : "@"}
      </span>
      <TeamLogo team={game.opponentAbbr} size={14} className="hidden sm:block" />
      <span className="w-[30px] shrink-0 font-medium">{game.opponentAbbr}</span>
      {game.result ? (
        <span className="flex min-w-0 items-center gap-1 tabular-nums">
          <span
            className={`font-semibold ${
              game.result === "W" ? "result-w" : game.result === "L" ? "result-l" : ""
            }`}
          >
            {game.result}
          </span>
          <span className="hidden text-muted sm:inline">
            {game.teamScore}-{game.oppScore}
          </span>
        </span>
      ) : (
        <span className="flex min-w-0 items-center gap-1 text-heading">
          <span className="live-dot" />
          <span className="hidden truncate sm:inline">{game.liveStatus}</span>
        </span>
      )}
    </span>
  );
}

function GameDetails({
  game,
  playerName,
  seasonPathSuffix,
}: {
  game: MapGame;
  playerName: string;
  seasonPathSuffix: string;
}) {
  const gameUrl = getGamePageUrl({
    date: game.date,
    homeAway: game.homeAway,
    teamAbbr: game.teamAbbr,
    opponentAbbr: game.opponentAbbr,
  });

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
        <p className="text-copy">
          <span className="font-semibold text-foreground">
            {game.teamAbbr} {game.teamScore}, {game.opponentAbbr} {game.oppScore}
          </span>{" "}
          · {game.result ? "Final" : game.liveStatus} ·{" "}
          {formatLongGameDate(game.date)} · {formatSeasonTypeLabel(game.seasonType)}
        </p>
        <div className="flex items-center gap-3 font-semibold">
          {isTeamAbbreviation(game.teamAbbr) ? (
            <Link
              href={`/teams/${game.teamAbbr}${seasonPathSuffix}`}
              className="text-link hover:underline"
            >
              {game.teamAbbr} team page
            </Link>
          ) : null}
          <a href={gameUrl} className="text-link hover:underline">
            Full game on MinutesMap →
          </a>
        </div>
      </div>
      <BoxTable
        ariaLabel={`${playerName} box score`}
        firstColumnLabel="Game"
        rows={[
          {
            key: game.gameId,
            name: `${game.homeAway === "home" ? "vs" : "@"} ${game.opponentAbbr}`,
            box: game.box,
          },
        ]}
      />
    </div>
  );
}

type PlayerSeasonMapProps = {
  playerPage: PlayerPageData;
  // Appended to team links so they stay in the season being viewed.
  seasonPathSuffix: string;
  // Only the season in progress has live status to layer on.
  liveEnabled: boolean;
};

export function PlayerSeasonMap({
  playerPage,
  seasonPathSuffix,
  liveEnabled,
}: PlayerSeasonMapProps) {
  const toggles = useStatToggles();
  const [selectedFilter, setSelectedFilter] = useState<PlayerFilter | null>(null);
  const { player } = playerPage;
  const nameVariants = getPlayerNameVariants(player.first, player.last, player.id);
  if (!nameVariants.includes(player.name)) {
    nameVariants.unshift(player.name);
  }

  const teamAbbrs = liveEnabled
    ? [
        ...new Set(
          [
            ...playerPage.teams.map((team) => team.abbr),
            ...playerPage.games.map((game) => game.teamAbbr),
          ]
            .map((teamAbbr) => teamAbbr.toUpperCase())
            .filter(isTeamAbbreviation),
        ),
      ]
    : [];
  // Once the player turns up in one live box score, only that game is polled.
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const { liveGames, gamepacks } = useLiveGames({
    teamAbbrs,
    enabled: liveEnabled,
    onlyGameId: activeGameId,
  });
  const livePlayerGames = liveGames.flatMap((liveGame) => {
    const game = buildLiveGame(
      playerPage,
      liveGame,
      gamepacks[liveGame.game.gameId],
      nameVariants,
    );
    return game ? [game] : [];
  });
  const foundGameId = livePlayerGames[0]?.gameId ?? null;
  if (liveGames.length > 1 && foundGameId && activeGameId !== foundGameId) {
    setActiveGameId(foundGameId);
  }

  // Newest first; a live game replaces its finished twin if both exist.
  const liveIds = new Set(livePlayerGames.map((game) => game.gameId));
  const games: MapGame[] = [
    ...livePlayerGames,
    ...[...playerPage.games].reverse().filter((game) => !liveIds.has(game.gameId)),
  ];
  const options = getFilterOptions(games);
  const defaultFilter: PlayerFilter =
    options.find((option) => option.value === "regular")?.value ??
    options[0]?.value ??
    "all";
  const filter =
    selectedFilter && options.some((option) => option.value === selectedFilter)
      ? selectedFilter
      : defaultFilter;
  const filteredGames = games.filter(
    (game) => filter === "all" || getFilterOf(game) === filter,
  );

  const rows: ChartRow[] = filteredGames.map((game) => ({
    key: game.gameId,
    name: `${formatLongGameDate(game.date)} ${
      game.homeAway === "home" ? "vs" : "at"
    } ${game.opponentAbbr}`,
    label: <GameLabel game={game} />,
    timeline: buildGameTimeline({
      actions: game.detail?.actions,
      segments: game.detail?.segments,
      nbaGameId: game.nbaGameId,
      season: game.season,
    }),
    cells: [
      formatWholeMinutes(game.box),
      game.box.pts,
      game.box.reb,
      game.box.ast,
      formatSigned(game.box.pm),
    ],
    nameVariants,
    score: {
      side: game.homeAway,
      teamAbbr: game.teamAbbr,
      opponentAbbr: game.opponentAbbr,
    },
    details: (
      <GameDetails
        game={game}
        playerName={player.name}
        seasonPathSuffix={seasonPathSuffix}
      />
    ),
  }));

  const finishedGames = filteredGames.filter((game) => game.result !== null);
  const totals = createEmptyStatLine();
  for (const game of finishedGames) {
    addBoxScore(totals, game.box);
  }
  const averages = averageBoxScore(totals, finishedGames.length);
  const periodCount = Math.max(4, ...rows.map((row) => row.timeline.periodCount));
  const rotation = buildRotationHeat(
    rows
      .filter((_, index) => filteredGames[index].result !== null)
      .map((row) => row.timeline),
    periodCount,
  );

  return (
    <section className="card px-3 py-4 sm:px-5 sm:py-5" aria-labelledby="season-map-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2
            id="season-map-title"
            className="text-lg font-semibold tracking-[-0.01em] text-heading"
          >
            Season map
          </h2>
          <p className="mt-0.5 max-w-[62ch] text-[13px] leading-snug text-muted">
            One row per game. The line is when {player.last || player.name} was
            on the floor; each symbol is a play. Hover a play for the details,
            or open a game for its box score.
          </p>
        </div>
        <SeasonTypeSelector
          ariaLabel="Filter games by season type"
          options={options}
          selectedValue={filter}
          onSelect={(option) => setSelectedFilter(option.value)}
        />
      </div>

      {rows.length ? (
        <>
          <div className="mt-4">
            <MinutesChart
              key={filter}
              rows={rows}
              columns={COLUMNS}
              statOn={toggles.statOn}
              emphasized={toggles.emphasized}
              labelHeader="Game"
              ariaLabel={`${player.name} game-by-game minutes and plays`}
              defaultOpenKey={livePlayerGames[0]?.gameId ?? null}
              summary={
                rotation.games > 1
                  ? {
                      label: (
                        <span title="How often he is on the floor at each point of a game, and his per-game averages">
                          Typical rotation
                        </span>
                      ),
                      cells: [
                        formatWholeMinutes(averages),
                        formatAverage(averages.pts),
                        formatAverage(averages.reb),
                        formatAverage(averages.ast),
                        formatSigned(averages.pm, 1),
                      ],
                      ...rotation,
                    }
                  : undefined
              }
            />
          </div>
          <div className="mt-4">
            <StatChips toggles={toggles} />
          </div>
        </>
      ) : (
        <p className="mt-6 rounded-xl bg-card-alt px-4 py-6 text-center text-sm text-muted">
          No games recorded for this season yet.
        </p>
      )}
    </section>
  );
}
