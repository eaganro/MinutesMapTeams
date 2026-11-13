"use client";

import Link from "next/link";
import { useState } from "react";
import {
  SeasonTypeSelector,
  type SeasonTypeSelectorOption,
} from "@/components/season-type-selector";
import {
  addBoxScore,
  averageBoxScore,
  createEmptyStatLine,
  formatAverage,
  formatPercentage,
  formatSigned,
  getSeasonTypeGroup,
  parseMinutesToSeconds,
} from "@/lib/format";
import { isCompletedGame } from "@/lib/live";
import type {
  StatLine,
  TeamGame,
  TeamGameSeasonType,
  TeamPlayerSeason,
} from "@/lib/team-data";

type RosterFilter = "all" | "regular" | "playoffs" | "other";
type RosterRow = {
  playerId: number;
  name: string;
  games: number;
  averages: StatLine;
  totalSeconds: number;
};
type SortKey =
  | "name"
  | "games"
  | "min"
  | "pts"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "to"
  | "fg"
  | "tp"
  | "ft"
  | "pm";
type SortDirection = "asc" | "desc";

const COLUMNS: Array<{ key: SortKey; label: string; highlight?: boolean }> = [
  { key: "name", label: "Player" },
  { key: "games", label: "GP" },
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS", highlight: true },
  { key: "reb", label: "REB", highlight: true },
  { key: "ast", label: "AST", highlight: true },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "to", label: "TO" },
  { key: "fg", label: "FG%" },
  { key: "tp", label: "3P%" },
  { key: "ft", label: "FT%" },
  { key: "pm", label: "+/-" },
];

function ratio(made: number, attempted: number) {
  return attempted ? made / attempted : -1;
}

function getSortValue(row: RosterRow, key: SortKey): number | string {
  const box = row.averages;

  switch (key) {
    case "name":
      return row.name;
    case "games":
      return row.games;
    case "min":
      return box.seconds ?? parseMinutesToSeconds(box.min);
    case "fg":
      return ratio(box.fgm, box.fga);
    case "tp":
      return ratio(box.tpm, box.tpa);
    case "ft":
      return ratio(box.ftm, box.fta);
    case "pm":
      return box.pm ?? 0;
    default:
      return box[key] ?? 0;
  }
}

function compareByGamesThenMinutes(left: RosterRow, right: RosterRow) {
  return (
    right.games - left.games ||
    right.totalSeconds - left.totalSeconds ||
    left.name.localeCompare(right.name)
  );
}

function getAllRow(player: TeamPlayerSeason): RosterRow | null {
  const games = player.totals?.games ?? player.games ?? 0;
  const averages =
    player.averages && "box" in player.averages
      ? player.averages.box
      : player.averages;
  const totalBox = player.totals?.box ?? player.box;

  if (!games || !averages) {
    return null;
  }

  return {
    playerId: player.playerId,
    name: player.name,
    games,
    averages,
    totalSeconds: totalBox?.seconds ?? parseMinutesToSeconds(totalBox?.min),
  };
}

function getSplitRow(
  player: TeamPlayerSeason,
  seasonType: TeamGameSeasonType,
): RosterRow | null {
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

// Averages rebuilt from per-game box scores, for splits the artifact does not
// pre-compute per player.
function getRowsFromGames(games: TeamGame[]): RosterRow[] {
  const byPlayer = new Map<
    number,
    { name: string; games: number; totals: StatLine }
  >();

  for (const game of games) {
    for (const player of game.players) {
      const current = byPlayer.get(player.playerId) ?? {
        name: player.name,
        games: 0,
        totals: createEmptyStatLine(),
      };

      current.games += 1;
      addBoxScore(current.totals, player.box);
      byPlayer.set(player.playerId, current);
    }
  }

  return [...byPlayer.entries()].map(([playerId, player]) => ({
    playerId,
    name: player.name,
    games: player.games,
    averages: averageBoxScore(player.totals, player.games),
    totalSeconds: player.totals.seconds ?? 0,
  }));
}

function getRows(
  players: TeamPlayerSeason[],
  games: TeamGame[],
  filter: RosterFilter,
) {
  if (filter === "all") {
    return players.flatMap((player) => getAllRow(player) ?? []);
  }

  const filterGames = games.filter(
    (game) => isCompletedGame(game) && getSeasonTypeGroup(game.seasonType) === filter,
  );

  if (filter !== "other") {
    const splitRows = players.flatMap(
      (player) => getSplitRow(player, filter) ?? [],
    );
    if (splitRows.length) {
      return splitRows;
    }
  }

  return getRowsFromGames(filterGames);
}

type RosterTableProps = {
  players: TeamPlayerSeason[];
  games: TeamGame[];
  // Appended to player links so they stay in the season being viewed.
  seasonPathSuffix: string;
};

export function RosterTable({
  players,
  games,
  seasonPathSuffix,
}: RosterTableProps) {
  const [selectedFilter, setSelectedFilter] = useState<RosterFilter | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("min");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const options = (
    [
      { value: "regular", label: "Regular Season" },
      { value: "playoffs", label: "Playoffs" },
      { value: "other", label: "Preseason & Other" },
    ] as const
  )
    .map((option) => ({
      ...option,
      count: getRows(players, games, option.value).length,
    }))
    .filter((option) => option.count > 0);
  const allOptions: Array<SeasonTypeSelectorOption<RosterFilter>> =
    options.length > 1
      ? [
          {
            value: "all",
            label: "All",
            count: getRows(players, games, "all").length,
          },
          ...options,
        ]
      : options;
  const defaultFilter: RosterFilter =
    allOptions.find((option) => option.value === "regular")?.value ??
    allOptions[0]?.value ??
    "all";
  const filter =
    selectedFilter && allOptions.some((option) => option.value === selectedFilter)
      ? selectedFilter
      : defaultFilter;
  const rows = getRows(players, games, filter).sort((left, right) => {
    const leftValue = getSortValue(left, sortKey);
    const rightValue = getSortValue(right, sortKey);
    const comparison =
      typeof leftValue === "string" && typeof rightValue === "string"
        ? leftValue.localeCompare(rightValue)
        : Number(leftValue) - Number(rightValue);

    if (comparison === 0) {
      return compareByGamesThenMinutes(left, right);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  function selectSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "name" ? "asc" : "desc");
  }

  return (
    <section className="card px-3 py-4 sm:px-5 sm:py-5" aria-labelledby="roster-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2
            id="roster-title"
            className="text-lg font-semibold tracking-[-0.01em] text-heading"
          >
            Roster
          </h2>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">
            Per-game averages. Open a player for their season map.
          </p>
        </div>
        <SeasonTypeSelector
          ariaLabel="Filter roster by season type"
          options={allOptions}
          selectedValue={filter}
          onSelect={(option) => setSelectedFilter(option.value)}
        />
      </div>

      {rows.length ? (
        <div className="mt-4 overflow-x-auto rounded-lg">
          <table className="box-table" aria-label="Roster averages">
            <thead>
              <tr>
                {COLUMNS.map((column) => {
                  const isSorted = sortKey === column.key;

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      className={column.highlight ? "box-hl" : undefined}
                      aria-sort={
                        isSorted
                          ? sortDirection === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        className="box-sort"
                        onClick={() => selectSort(column.key)}
                      >
                        {column.label}
                        <span
                          className="w-2 text-[9px]"
                          aria-hidden="true"
                        >
                          {isSorted ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const box = row.averages;

                return (
                  <tr key={row.playerId}>
                    <td>
                      <Link
                        href={`/players/${row.playerId}${seasonPathSuffix}`}
                        className="font-medium hover:underline"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td>{row.games}</td>
                    <td>{box.min}</td>
                    <td className="box-hl">{formatAverage(box.pts)}</td>
                    <td className="box-hl">{formatAverage(box.reb)}</td>
                    <td className="box-hl">{formatAverage(box.ast)}</td>
                    <td>{formatAverage(box.stl)}</td>
                    <td>{formatAverage(box.blk)}</td>
                    <td>{formatAverage(box.to)}</td>
                    <td>{formatPercentage(box.fgm, box.fga)}</td>
                    <td>{formatPercentage(box.tpm, box.tpa)}</td>
                    <td>{formatPercentage(box.ftm, box.fta)}</td>
                    <td>{formatSigned(box.pm, 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-card-alt px-4 py-6 text-center text-sm text-muted">
          No player stats recorded for this season yet.
        </p>
      )}
    </section>
  );
}
