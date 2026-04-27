"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  StatLine,
  TeamGame,
  TeamGameSeasonType,
  TeamPlayerSeason,
} from "@/lib/team-data";
import {
  SeasonTypeSelector,
  type SeasonTypeSelectorOption,
} from "@/components/season-type-selector";

const INITIAL_GAME_COUNT = 10;
const GAME_PAGE_SIZE = 10;
const SEASON_TYPE_LABELS: Record<string, string> = {
  preseason: "Preseason",
  regular: "Regular Season",
  play_in: "Play-In",
  playoffs: "Playoffs",
};

type GameFilter = "all" | "regular" | "playoffs" | "other";
type SeasonTypeOption = SeasonTypeSelectorOption<GameFilter>;
type PlayerTableRow = {
  playerId: number;
  name: string;
  games: number;
  averages: StatLine;
  totalSeconds: number;
};
type PlayerSortKey = "name" | "games" | "min" | "pts" | "reb" | "ast" | "pm";
type SortDirection = "asc" | "desc";
type StatNumberKey =
  | "pts"
  | "fgm"
  | "fga"
  | "tpm"
  | "tpa"
  | "ftm"
  | "fta"
  | "oreb"
  | "dreb"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "to"
  | "pf"
  | "pm";

const STAT_NUMBER_KEYS: StatNumberKey[] = [
  "pts",
  "fgm",
  "fga",
  "tpm",
  "tpa",
  "ftm",
  "fta",
  "oreb",
  "dreb",
  "reb",
  "ast",
  "stl",
  "blk",
  "to",
  "pf",
  "pm",
];
const PLAYER_SORT_COLUMNS: Array<{
  key: PlayerSortKey;
  label: string;
}> = [
  { key: "name", label: "Player" },
  { key: "games", label: "GP" },
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "pm", label: "+/-" },
];

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatOpponentLabel(homeAway: "home" | "away", opponentAbbr: string) {
  return homeAway === "home" ? `vs ${opponentAbbr}` : `@ ${opponentAbbr}`;
}

function formatGameDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatSecondsAsMinutes(seconds: number) {
  const roundedSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(roundedSeconds / 60);
  const remainderSeconds = roundedSeconds % 60;

  return `${minutes}:${remainderSeconds.toString().padStart(2, "0")}`;
}

function parseMinutesToSeconds(value?: string) {
  if (!value) {
    return 0;
  }

  const [minutes, seconds] = value.split(":").map(Number);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return 0;
  }

  return minutes * 60 + seconds;
}

function formatSeasonTypeLabel(seasonType: string) {
  return (
    SEASON_TYPE_LABELS[seasonType] ??
    seasonType
      .split(/[_-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function isCompletedGame(game: TeamGame) {
  return game.played !== false && game.result !== null;
}

function getResultBadgeClass(game: TeamGame) {
  if (!isCompletedGame(game)) {
    return "bg-card text-muted";
  }

  if (game.result === "W") {
    return "bg-[#dff3e4] text-[#166534] dark:bg-[#193126] dark:text-[#86efac]";
  }

  if (game.result === "T") {
    return "bg-card text-muted";
  }

  return "bg-[#f7e0e0] text-[#991b1b] dark:bg-[#341c1c] dark:text-[#fca5a5]";
}

function getResultBadgeLabel(game: TeamGame) {
  return isCompletedGame(game) ? (game.result ?? "Scheduled") : "Scheduled";
}

function getGameScoreLabel(game: TeamGame) {
  return isCompletedGame(game)
    ? `${game.teamScore} - ${game.oppScore}`
    : (game.status ?? "Scheduled");
}

function formatLeaderLabel(leader?: { name: string; value: number }) {
  return leader ? `${leader.name} (${leader.value})` : "—";
}

function getSeasonTypeCounts(games: TeamGame[]) {
  return games.reduce(
    (counts, game) => {
      if (game.seasonType === "regular") {
        counts.regular += 1;
      } else if (game.seasonType === "playoffs") {
        counts.playoffs += 1;
      } else {
        counts.other += 1;
      }

      return counts;
    },
    {
      regular: 0,
      playoffs: 0,
      other: 0,
    },
  );
}

function getSeasonTypeOptions(games: TeamGame[]): SeasonTypeOption[] {
  const counts = getSeasonTypeCounts(games);
  const options: SeasonTypeOption[] = [
    {
      value: "all" as const,
      label: "All",
      count: games.length,
    },
  ];

  if (counts.regular > 0) {
    options.push({
      value: "regular",
      label: "Regular Season",
      count: counts.regular,
    });
  }

  if (counts.playoffs > 0) {
    options.push({
      value: "playoffs",
      label: "Playoffs",
      count: counts.playoffs,
    });
  }

  if (counts.other > 0) {
    options.push({
      value: "other",
      label: "Other",
      count: counts.other,
    });
  }

  return options;
}

function getPlayerSeasonTypeOptions(
  players: TeamPlayerSeason[],
  games: TeamGame[],
  seasonTypeOptions: SeasonTypeOption[],
) {
  return seasonTypeOptions
    .map((option) => ({
      ...option,
      count: getPlayerRowsForFilter(players, games, option.value).length,
    }))
    .filter((option) => option.value === "all" || option.count > 0);
}

function isGameInFilter(game: TeamGame, filter: GameFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "other") {
    return game.seasonType !== "regular" && game.seasonType !== "playoffs";
  }

  return game.seasonType === filter;
}

function getPlayerAverageBox(player: TeamPlayerSeason) {
  if (!player.averages) {
    return null;
  }

  if ("box" in player.averages) {
    return player.averages.box;
  }

  return player.averages;
}

function getPlayerAllRow(player: TeamPlayerSeason): PlayerTableRow | null {
  const games = player.totals?.games ?? player.games ?? 0;
  const averages = getPlayerAverageBox(player);
  const totalBox = player.totals?.box ?? player.box;
  const totalSeconds =
    totalBox?.seconds ?? parseMinutesToSeconds(totalBox?.min);

  if (!games || !averages) {
    return null;
  }

  return {
    playerId: player.playerId,
    name: player.name,
    games,
    averages,
    totalSeconds,
  };
}

function getPlayerSeasonTypeRow(
  player: TeamPlayerSeason,
  seasonType: TeamGameSeasonType,
): PlayerTableRow | null {
  const split = player.bySeasonType?.[seasonType];

  if (!split?.games) {
    return null;
  }

  return {
    playerId: player.playerId,
    name: player.name,
    games: split.games,
    averages: split.averages.box,
    totalSeconds:
      split.totals.box.seconds ?? parseMinutesToSeconds(split.totals.box.min),
  };
}

function createEmptyStatLine(): StatLine {
  return {
    min: "0:00",
    pts: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    oreb: 0,
    dreb: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    to: 0,
    pf: 0,
    pm: 0,
  };
}

function addBoxScore(total: StatLine, box: StatLine) {
  total.seconds =
    (total.seconds ?? 0) + (box.seconds ?? parseMinutesToSeconds(box.min));

  for (const key of STAT_NUMBER_KEYS) {
    total[key] = (total[key] ?? 0) + (box[key] ?? 0);
  }
}

function averageBoxScore(total: StatLine, games: number): StatLine {
  const averages = createEmptyStatLine();
  const divisor = Math.max(games, 1);

  for (const key of STAT_NUMBER_KEYS) {
    averages[key] = Number(((total[key] ?? 0) / divisor).toFixed(2));
  }

  averages.min = formatSecondsAsMinutes((total.seconds ?? 0) / divisor);

  return averages;
}

function getRowsFromGameBoxes(games: TeamGame[]) {
  const rowsByPlayer = new Map<
    number,
    {
      playerId: number;
      name: string;
      games: number;
      totals: StatLine;
    }
  >();

  for (const game of games) {
    for (const player of game.players) {
      const current = rowsByPlayer.get(player.playerId) ?? {
        playerId: player.playerId,
        name: player.name,
        games: 0,
        totals: createEmptyStatLine(),
      };

      current.games += 1;
      addBoxScore(current.totals, player.box);
      rowsByPlayer.set(player.playerId, current);
    }
  }

  return [...rowsByPlayer.values()].map((player) => ({
    playerId: player.playerId,
    name: player.name,
    games: player.games,
    averages: averageBoxScore(player.totals, player.games),
    totalSeconds: player.totals.seconds ?? 0,
  }));
}

function sortPlayerRows(rows: PlayerTableRow[]) {
  return [...rows].sort(
    (left, right) => right.totalSeconds - left.totalSeconds,
  );
}

function getPlayerSortValue(player: PlayerTableRow, sortKey: PlayerSortKey) {
  if (sortKey === "name") {
    return player.name;
  }

  if (sortKey === "games") {
    return player.games;
  }

  if (sortKey === "min") {
    return parseMinutesToSeconds(player.averages.min);
  }

  return player.averages[sortKey] ?? 0;
}

function sortPlayerRowsByColumn(
  rows: PlayerTableRow[],
  sortKey: PlayerSortKey,
  sortDirection: SortDirection,
) {
  return [...rows].sort((left, right) => {
    const leftValue = getPlayerSortValue(left, sortKey);
    const rightValue = getPlayerSortValue(right, sortKey);

    const comparison =
      typeof leftValue === "string" && typeof rightValue === "string"
        ? leftValue.localeCompare(rightValue)
        : Number(leftValue) - Number(rightValue);

    if (comparison === 0) {
      return right.totalSeconds - left.totalSeconds;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });
}

function getNextSortDirection(
  currentKey: PlayerSortKey,
  nextKey: PlayerSortKey,
  currentDirection: SortDirection,
) {
  if (currentKey === nextKey) {
    return currentDirection === "asc" ? "desc" : "asc";
  }

  return nextKey === "name" ? "asc" : "desc";
}

function getPlayerRowsForFilter(
  players: TeamPlayerSeason[],
  games: TeamGame[],
  filter: GameFilter,
) {
  if (filter === "all") {
    const rows = players
      .map((player) => getPlayerAllRow(player))
      .filter((player): player is PlayerTableRow => Boolean(player));

    return sortPlayerRows(rows);
  }

  if (filter === "other") {
    return sortPlayerRows(
      getRowsFromGameBoxes(games.filter((game) => isGameInFilter(game, filter))),
    );
  }

  const splitRows = players
    .map((player) => getPlayerSeasonTypeRow(player, filter))
    .filter((player): player is PlayerTableRow => Boolean(player));

  if (splitRows.length) {
    return sortPlayerRows(splitRows);
  }

  return sortPlayerRows(
    getRowsFromGameBoxes(games.filter((game) => isGameInFilter(game, filter))),
  );
}

type TeamPageDetailsProps = {
  games: TeamGame[];
  players: TeamPlayerSeason[];
};

export function TeamPageDetails({
  games,
  players,
}: TeamPageDetailsProps) {
  const [visibleGames, setVisibleGames] = useState(
    Math.min(INITIAL_GAME_COUNT, games.length),
  );
  const [selectedPlayerFilter, setSelectedPlayerFilter] =
    useState<GameFilter>("all");
  const [selectedGameFilter, setSelectedGameFilter] =
    useState<GameFilter>("all");
  const [playerSortKey, setPlayerSortKey] = useState<PlayerSortKey>("min");
  const [playerSortDirection, setPlayerSortDirection] =
    useState<SortDirection>("desc");

  const seasonTypeOptions = getSeasonTypeOptions(games);
  const playerSeasonTypeOptions = getPlayerSeasonTypeOptions(
    players,
    games,
    seasonTypeOptions,
  );
  const filteredPlayers = getPlayerRowsForFilter(
    players,
    games,
    selectedPlayerFilter,
  );
  const sortedPlayers = sortPlayerRowsByColumn(
    filteredPlayers,
    playerSortKey,
    playerSortDirection,
  );
  const filteredGames =
    selectedGameFilter === "all"
      ? games
      : games.filter((game) => isGameInFilter(game, selectedGameFilter));
  const displayedGames = filteredGames.slice(0, visibleGames);
  const hasMoreGames = visibleGames < filteredGames.length;

  function selectPlayerFilter(option: SeasonTypeOption) {
    setSelectedPlayerFilter(option.value);
  }

  function selectPlayerSort(nextSortKey: PlayerSortKey) {
    setPlayerSortDirection((currentDirection) =>
      getNextSortDirection(playerSortKey, nextSortKey, currentDirection),
    );
    setPlayerSortKey(nextSortKey);
  }

  function selectGameFilter(nextFilter: GameFilter, nextCount: number) {
    setSelectedGameFilter(nextFilter);
    setVisibleGames(Math.min(INITIAL_GAME_COUNT, nextCount));
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <article className="flex max-h-[760px] flex-col rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-heading">
            Full roster output
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SeasonTypeSelector
              ariaLabel="Filter players by season type"
              options={playerSeasonTypeOptions}
              selectedValue={selectedPlayerFilter}
              onSelect={selectPlayerFilter}
            />
            <p className="text-sm text-muted">
              {filteredPlayers.length} players
            </p>
          </div>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-muted">
                  {PLAYER_SORT_COLUMNS.map((column) => {
                    const isSelected = playerSortKey === column.key;

                    return (
                      <th
                        key={column.key}
                        className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]"
                        aria-sort={
                          isSelected
                            ? playerSortDirection === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-1 rounded border-0 bg-transparent px-0 py-2 text-left text-inherit transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                          onClick={() => selectPlayerSort(column.key)}
                        >
                          {column.label}
                          {isSelected ? (
                            <span
                              className="text-[10px] leading-none"
                              aria-hidden="true"
                            >
                              {playerSortDirection === "asc" ? "^" : "v"}
                            </span>
                          ) : null}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr
                    key={player.playerId}
                    className="rounded-[16px] bg-card-alt text-copy"
                  >
                    <td className="rounded-l-[16px] px-3 py-3 font-medium text-foreground">
                      <Link
                        href={`/players/${player.playerId}`}
                        className="transition-colors hover:text-accent-strong"
                      >
                        {player.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{player.games}</td>
                    <td className="px-3 py-3">{player.averages.min}</td>
                    <td className="px-3 py-3">
                      {player.averages.pts.toFixed(1)}
                    </td>
                    <td className="px-3 py-3">
                      {player.averages.reb.toFixed(1)}
                    </td>
                    <td className="px-3 py-3">
                      {player.averages.ast.toFixed(1)}
                    </td>
                    <td className="rounded-r-[16px] px-3 py-3">
                      {player.averages.pm !== undefined
                        ? formatSignedNumber(
                            Number(player.averages.pm.toFixed(1)),
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <article className="flex max-h-[760px] flex-col rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-heading">
            Game results
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SeasonTypeSelector
              ariaLabel="Filter games by season type"
              options={seasonTypeOptions}
              selectedValue={selectedGameFilter}
              onSelect={(option) =>
                selectGameFilter(option.value, option.count)
              }
            />
            <p className="text-sm text-muted">
              {displayedGames.length} of {filteredGames.length}
            </p>
          </div>
        </div>

        <div className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {displayedGames.map((game) => (
            <div
              key={game.gameId}
              className="rounded-[18px] bg-card-alt p-4 text-sm text-copy"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${getResultBadgeClass(game)}`}
                    >
                      {getResultBadgeLabel(game)}
                    </span>
                    <span className="rounded-full bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                      {formatSeasonTypeLabel(game.seasonType)}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatOpponentLabel(game.homeAway, game.opponentAbbr)}
                    </span>
                  </div>
                  <p className="mt-2 text-copy">{formatGameDate(game.date)}</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold tracking-[-0.02em] text-heading">
                    {getGameScoreLabel(game)}
                  </p>
                  <p className="mt-1 text-muted">
                    {game.opponentName || game.opponentAbbr}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-3">
                <p>
                  PTS:{" "}
                  <span className="font-medium text-copy">
                    {formatLeaderLabel(game.leaders.pts)}
                  </span>
                </p>
                <p>
                  REB:{" "}
                  <span className="font-medium text-copy">
                    {formatLeaderLabel(game.leaders.reb)}
                  </span>
                </p>
                <p>
                  AST:{" "}
                  <span className="font-medium text-copy">
                    {formatLeaderLabel(game.leaders.ast)}
                  </span>
                </p>
              </div>
            </div>
          ))}

          {hasMoreGames ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  setVisibleGames((currentValue) =>
                    Math.min(
                      currentValue + GAME_PAGE_SIZE,
                      filteredGames.length,
                    ),
                  )
                }
                className="rounded-full border border-border-strong bg-card-alt px-5 py-2 text-sm text-copy transition-colors hover:bg-hover hover:text-foreground"
              >
                Show More Games
              </button>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
