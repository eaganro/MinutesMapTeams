"use client";

import { useState } from "react";
import type { TeamGameSeasonType } from "@/lib/team-data";
import type {
  PlayerGame,
  PlayerPageData,
  PlayerSeasonSplit,
} from "@/lib/player-data";
import {
  SeasonTypeSelector,
  type SeasonTypeSelectorOption,
} from "@/components/season-type-selector";

const INITIAL_GAME_COUNT = 10;
const GAME_PAGE_SIZE = 10;
const SEASON_TYPE_ORDER = ["preseason", "regular", "play_in", "playoffs"];
const SEASON_TYPE_LABELS: Record<string, string> = {
  preseason: "Preseason",
  regular: "Regular Season",
  play_in: "Play-In",
  playoffs: "Playoffs",
};

type PlayerFilter = "all" | TeamGameSeasonType;

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatSeasonRecord(wins: number, losses: number, ties = 0) {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
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

function getSeasonTypeOptions(playerPage: PlayerPageData) {
  const splitKeys = new Set(Object.keys(playerPage.bySeasonType ?? {}));
  const gameCounts = playerPage.games.reduce<Map<string, number>>(
    (counts, game) => {
      counts.set(game.seasonType, (counts.get(game.seasonType) ?? 0) + 1);
      return counts;
    },
    new Map(),
  );

  const orderedTypes = [
    ...SEASON_TYPE_ORDER.filter(
      (seasonType) => splitKeys.has(seasonType) || gameCounts.has(seasonType),
    ),
    ...[...new Set([...splitKeys, ...gameCounts.keys()])]
      .filter((seasonType) => !SEASON_TYPE_ORDER.includes(seasonType))
      .sort((left, right) =>
        formatSeasonTypeLabel(left).localeCompare(formatSeasonTypeLabel(right)),
      ),
  ];

  return [
    {
      value: "all" as const,
      label: "All",
      count: playerPage.totals.games,
    },
    ...orderedTypes.map((seasonType) => ({
      value: seasonType,
      label: formatSeasonTypeLabel(seasonType),
      count:
        playerPage.bySeasonType?.[seasonType]?.games ??
        gameCounts.get(seasonType) ??
        0,
    })),
  ];
}

function getSplitView(playerPage: PlayerPageData, filter: PlayerFilter) {
  if (filter === "all") {
    return {
      games: playerPage.totals.games,
      wins: playerPage.totals.wins,
      losses: playerPage.totals.losses,
      ties: playerPage.totals.ties,
      averages: playerPage.averages.box,
      totals: playerPage.totals.box,
    };
  }

  const split = playerPage.bySeasonType?.[filter] as
    | PlayerSeasonSplit
    | undefined;

  if (!split) {
    return null;
  }

  return {
    games: split.totals.games,
    wins: split.totals.wins,
    losses: split.totals.losses,
    ties: split.totals.ties,
    averages: split.averages.box,
    totals: split.totals.box,
  };
}

function getGamesForFilter(games: PlayerGame[], filter: PlayerFilter) {
  const filteredGames =
    filter === "all"
      ? games
      : games.filter((game) => game.seasonType === filter);

  return [...filteredGames].reverse();
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[18px] bg-card-alt p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
        {value}
      </p>
    </div>
  );
}

type PlayerPageDetailsProps = {
  playerPage: PlayerPageData;
};

export function PlayerPageDetails({ playerPage }: PlayerPageDetailsProps) {
  const [selectedFilter, setSelectedFilter] = useState<PlayerFilter>("all");
  const [visibleGames, setVisibleGames] = useState(
    Math.min(INITIAL_GAME_COUNT, playerPage.games.length),
  );

  const options = getSeasonTypeOptions(playerPage);
  const splitView = getSplitView(playerPage, selectedFilter);
  const filteredGames = getGamesForFilter(playerPage.games, selectedFilter);
  const displayedGames = filteredGames.slice(0, visibleGames);
  const hasMoreGames = visibleGames < filteredGames.length;

  function selectFilter(option: SeasonTypeSelectorOption<PlayerFilter>) {
    setSelectedFilter(option.value);
    setVisibleGames(Math.min(INITIAL_GAME_COUNT, option.count));
  }

  if (!splitView) {
    return null;
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Player Splits
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-heading">
              Per-game production
            </h2>
          </div>
          <SeasonTypeSelector
            ariaLabel="Filter player stats by season type"
            options={options}
            selectedValue={selectedFilter}
            onSelect={selectFilter}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <StatCard label="Games" value={splitView.games} />
          <StatCard
            label="Record"
            value={formatSeasonRecord(
              splitView.wins,
              splitView.losses,
              splitView.ties,
            )}
          />
          <StatCard label="PTS" value={splitView.averages.pts.toFixed(1)} />
          <StatCard label="REB" value={splitView.averages.reb.toFixed(1)} />
          <StatCard label="AST" value={splitView.averages.ast.toFixed(1)} />
          <StatCard
            label="+/-"
            value={
              splitView.averages.pm !== undefined
                ? formatSignedNumber(Number(splitView.averages.pm.toFixed(1)))
                : "-"
            }
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-muted">
                {["MIN", "FG", "3P", "FT", "STL", "BLK", "TO", "PF"].map(
                  (label) => (
                    <th
                      key={label}
                      className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="rounded-[16px] bg-card-alt text-copy">
                <td className="rounded-l-[16px] px-3 py-3">
                  {splitView.averages.min}
                </td>
                <td className="px-3 py-3">
                  {splitView.averages.fgm.toFixed(1)}-
                  {splitView.averages.fga.toFixed(1)}
                </td>
                <td className="px-3 py-3">
                  {splitView.averages.tpm.toFixed(1)}-
                  {splitView.averages.tpa.toFixed(1)}
                </td>
                <td className="px-3 py-3">
                  {splitView.averages.ftm.toFixed(1)}-
                  {splitView.averages.fta.toFixed(1)}
                </td>
                <td className="px-3 py-3">
                  {splitView.averages.stl.toFixed(1)}
                </td>
                <td className="px-3 py-3">
                  {splitView.averages.blk.toFixed(1)}
                </td>
                <td className="px-3 py-3">
                  {splitView.averages.to.toFixed(1)}
                </td>
                <td className="rounded-r-[16px] px-3 py-3">
                  {splitView.averages.pf.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-2 text-sm text-copy sm:grid-cols-2">
          <p>Total points: {splitView.totals.pts}</p>
          <p>Total rebounds: {splitView.totals.reb}</p>
          <p>Total assists: {splitView.totals.ast}</p>
          <p>Total minutes: {splitView.totals.min}</p>
        </div>
      </article>

      <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Game Log
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-heading">
              Player games
            </h2>
          </div>
          <p className="text-sm text-muted">
            {displayedGames.length} of {filteredGames.length}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {displayedGames.map((game) => (
            <div
              key={game.gameId}
              className="rounded-[18px] bg-card-alt p-4 text-sm text-copy"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${
                        game.result === "W"
                          ? "bg-[#dff3e4] text-[#166534] dark:bg-[#193126] dark:text-[#86efac]"
                          : "bg-[#f7e0e0] text-[#991b1b] dark:bg-[#341c1c] dark:text-[#fca5a5]"
                      }`}
                    >
                      {game.result}
                    </span>
                    <span className="rounded-full bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                      {formatSeasonTypeLabel(game.seasonType)}
                    </span>
                    <span className="font-medium text-foreground">
                      {game.teamAbbr} {formatOpponentLabel(game.homeAway, game.opponentAbbr)}
                    </span>
                  </div>
                  <p className="mt-2 text-copy">{formatGameDate(game.date)}</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold tracking-[-0.02em] text-heading">
                    {game.box.pts} PTS, {game.box.reb} REB, {game.box.ast} AST
                  </p>
                  <p className="mt-1 text-muted">
                    {game.teamScore} - {game.oppScore} {game.opponentName}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-4">
                <p>
                  MIN:{" "}
                  <span className="font-medium text-copy">{game.box.min}</span>
                </p>
                <p>
                  FG:{" "}
                  <span className="font-medium text-copy">
                    {game.box.fgm}-{game.box.fga}
                  </span>
                </p>
                <p>
                  3P:{" "}
                  <span className="font-medium text-copy">
                    {game.box.tpm}-{game.box.tpa}
                  </span>
                </p>
                <p>
                  +/-:{" "}
                  <span className="font-medium text-copy">
                    {game.box.pm !== undefined
                      ? formatSignedNumber(game.box.pm)
                      : "-"}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {hasMoreGames ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setVisibleGames((currentValue) =>
                  Math.min(currentValue + GAME_PAGE_SIZE, filteredGames.length),
                )
              }
              className="rounded-full border border-border-strong bg-card-alt px-5 py-2 text-sm text-copy transition-colors hover:bg-hover hover:text-foreground"
            >
              Show More Games
            </button>
          </div>
        ) : null}
      </article>
    </section>
  );
}
