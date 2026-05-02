"use client";

import { useState } from "react";
import type { PlayerGame, PlayerPageData } from "@/lib/player-data";
import {
  SeasonTypeSelector,
  type SeasonTypeSelectorOption,
} from "@/components/season-type-selector";
import { PlayerGameBoxscore } from "@/components/player-game-boxscore";
import {
  PlayerGameTimeline,
  PLAYER_TIMELINE_STAT_COUNT,
} from "@/components/player-game-timeline";

const INITIAL_GAME_COUNT = 5;
const GAME_PAGE_SIZE = 5;
const SEASON_TYPE_LABELS: Record<string, string> = {
  preseason: "Preseason",
  regular: "Regular Season",
  play_in: "Play-In",
  playoffs: "Playoffs",
};

type PlayerFilter = "all" | "regular" | "playoffs" | "other";

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

function getSeasonTypeCounts(games: PlayerGame[]) {
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

function getSeasonTypeOptions(playerPage: PlayerPageData) {
  const counts = getSeasonTypeCounts(playerPage.games);
  const options: Array<SeasonTypeSelectorOption<PlayerFilter>> = [
    {
      value: "all" as const,
      label: "All",
      count: playerPage.games.length,
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

function isGameInFilter(game: PlayerGame, filter: PlayerFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "other") {
    return game.seasonType !== "regular" && game.seasonType !== "playoffs";
  }

  return game.seasonType === filter;
}

function getGamesForFilter(games: PlayerGame[], filter: PlayerFilter) {
  const filteredGames = games.filter((game) => isGameInFilter(game, filter));

  return [...filteredGames].reverse();
}

type PlayerPageDetailsProps = {
  playerPage: PlayerPageData;
};

export function PlayerPageDetails({ playerPage }: PlayerPageDetailsProps) {
  const [selectedFilter, setSelectedFilter] = useState<PlayerFilter>("all");
  const [visibleGames, setVisibleGames] = useState(
    Math.min(INITIAL_GAME_COUNT, playerPage.games.length),
  );
  const [timelineStatOn, setTimelineStatOn] = useState(() =>
    Array.from({ length: PLAYER_TIMELINE_STAT_COUNT }, () => true),
  );

  const options = getSeasonTypeOptions(playerPage);
  const filteredGames = getGamesForFilter(playerPage.games, selectedFilter);
  const displayedGames = filteredGames.slice(0, visibleGames);
  const hasMoreGames = visibleGames < filteredGames.length;

  function selectFilter(option: SeasonTypeSelectorOption<PlayerFilter>) {
    setSelectedFilter(option.value);
    setVisibleGames(Math.min(INITIAL_GAME_COUNT, option.count));
  }

  function toggleTimelineStat(index: number) {
    setTimelineStatOn((currentStatOn) =>
      currentStatOn.map((isOn, currentIndex) =>
        currentIndex === index ? !isOn : isOn,
      ),
    );
  }

  return (
    <section>
      <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-heading">
            Player games
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SeasonTypeSelector
              ariaLabel="Filter player games by season type"
              options={options}
              selectedValue={selectedFilter}
              onSelect={selectFilter}
            />
            <p className="text-sm text-muted">
              {displayedGames.length} of {filteredGames.length}
            </p>
          </div>
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
                      {game.teamAbbr}{" "}
                      {formatOpponentLabel(game.homeAway, game.opponentAbbr)}
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

              <PlayerGameBoxscore
                playerName={playerPage.player.name}
                box={game.box}
              />

              <PlayerGameTimeline
                actions={game.detail?.actions}
                segments={game.detail?.segments}
                statOn={timelineStatOn}
                onToggleStat={toggleTimelineStat}
              />
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
