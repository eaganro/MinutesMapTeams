"use client";

import { useState } from "react";
import {
  SeasonTypeSelector,
  type SeasonTypeSelectorOption,
} from "@/components/season-type-selector";
import { TeamGameChart } from "@/components/team-game-chart";
import { TeamLogo } from "@/components/team-logo";
import { useGamepack, useLiveGames } from "@/hooks/use-live-games";
import {
  formatGameDate,
  formatSeasonTypeLabel,
  formatWeekday,
  getSeasonTypeGroup,
} from "@/lib/format";
import {
  getGamepackScore,
  getGamepackSide,
  getGamepackStatus,
  isCompletedGame,
  type Gamepack,
} from "@/lib/live";
import type { TeamGame } from "@/lib/team-data";
import { getTeamNickname } from "@/lib/teams";

const INITIAL_COMPLETED_COUNT = 10;
const INITIAL_UPCOMING_COUNT = 3;

type GameFilter = "all" | "regular" | "playoffs" | "other";

function getFilterOf(game: TeamGame) {
  return getSeasonTypeGroup(game.seasonType);
}

function getFilterOptions(games: TeamGame[]) {
  const count = (filter: GameFilter) =>
    games.filter((game) => getFilterOf(game) === filter).length;
  const options = [
    { value: "regular" as const, label: "Regular Season", count: count("regular") },
    { value: "playoffs" as const, label: "Playoffs", count: count("playoffs") },
    { value: "other" as const, label: "Preseason & Other", count: count("other") },
  ].filter((option) => option.count > 0);

  return options.length > 1
    ? [{ value: "all" as const, label: "All", count: games.length }, ...options]
    : options;
}

function getStartTime(game: TeamGame) {
  const start = Date.parse(game.start);
  return Number.isFinite(start) ? start : Date.parse(`${game.date}T12:00:00Z`) || 0;
}

function Matchup({ game }: { game: TeamGame }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="w-4 shrink-0 text-center text-xs text-muted">
        {game.homeAway === "home" ? "vs" : "@"}
      </span>
      <TeamLogo team={game.opponentAbbr} size={20} />
      <span className="truncate font-medium text-foreground">
        <span className="sm:hidden">{game.opponentAbbr}</span>
        <span className="hidden sm:inline">
          {getTeamNickname(game.opponentAbbr, game.opponentName || game.opponentAbbr)}
        </span>
      </span>
    </span>
  );
}

function GameDate({ game }: { game: TeamGame }) {
  return (
    <span className="flex shrink-0 items-baseline gap-1.5 tabular-nums sm:w-[84px]">
      <span className="hidden w-7 text-[11px] uppercase text-muted sm:inline">
        {formatWeekday(game.date)}
      </span>
      <span className="w-[46px] text-copy sm:w-auto">{formatGameDate(game.date)}</span>
    </span>
  );
}

function Leaders({ game }: { game: TeamGame }) {
  const entries = (["pts", "reb", "ast"] as const).flatMap((key) => {
    const leader = game.leaders[key];
    return leader?.name ? [{ key, leader }] : [];
  });

  if (!entries.length) {
    return null;
  }

  return (
    <span className="hidden min-w-0 flex-1 items-center justify-end gap-x-4 truncate text-xs text-muted lg:flex">
      {entries.map(({ key, leader }) => (
        <span key={key} className="truncate">
          <span className="font-semibold uppercase">{key}</span>{" "}
          <span className="text-copy">
            {leader.name.split(" ").slice(1).join(" ") || leader.name}
          </span>{" "}
          <span className="font-semibold tabular-nums text-heading">
            {leader.value}
          </span>
        </span>
      ))}
    </span>
  );
}

function GameRow({
  game,
  teamAbbr,
  seasonPathSuffix,
  isOpen,
  onToggle,
  showSeasonType,
}: {
  game: TeamGame;
  teamAbbr: string;
  seasonPathSuffix: string;
  isOpen: boolean;
  onToggle: () => void;
  showSeasonType: boolean;
}) {
  const { gamepack, status } = useGamepack(isOpen ? game.gameId : null);

  return (
    <li className={`rounded-xl ${isOpen ? "bg-card-alt" : ""}`}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex h-11 w-full items-center gap-2 rounded-xl sm:gap-3 border-0 bg-transparent px-2 text-left text-sm transition-colors hover:bg-hover sm:px-3"
      >
        <GameDate game={game} />
        <span className="flex w-[92px] shrink-0 items-center sm:w-[170px]">
          <Matchup game={game} />
        </span>
        <span className="flex shrink-0 items-baseline gap-1.5 tabular-nums sm:w-[92px]">
          <span
            className={`w-4 font-semibold ${
              game.result === "W" ? "result-w" : game.result === "L" ? "result-l" : ""
            }`}
          >
            {game.result}
          </span>
          <span className="font-semibold text-heading">
            {game.teamScore}-{game.oppScore}
          </span>
        </span>
        {showSeasonType && game.seasonType !== "regular" ? (
          <span className="hidden shrink-0 rounded-full bg-card-alt px-2 py-0.5 text-[11px] font-semibold text-muted sm:inline">
            {formatSeasonTypeLabel(game.seasonType)}
          </span>
        ) : null}
        <Leaders game={game} />
        <span
          className={`ml-auto flex shrink-0 items-center gap-1.5 text-xs font-semibold lg:ml-0 ${
            isOpen ? "text-foreground" : "text-link"
          }`}
        >
          <span className="hidden sm:inline">{isOpen ? "Close" : "Minutes map"}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden="true"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {isOpen ? (
        <div className="px-2 pb-3 pt-1 sm:px-3">
          <TeamGameChart
            game={game}
            teamAbbr={teamAbbr}
            gamepack={gamepack}
            status={status}
            seasonPathSuffix={seasonPathSuffix}
          />
        </div>
      ) : null}
    </li>
  );
}

function LiveGame({
  game,
  gamepack,
  teamAbbr,
  seasonPathSuffix,
}: {
  game: TeamGame;
  gamepack: Gamepack | undefined;
  teamAbbr: string;
  seasonPathSuffix: string;
}) {
  const side = getGamepackSide(gamepack, teamAbbr, game.homeAway);
  const teamScore = gamepack ? getGamepackScore(gamepack, side) : game.teamScore;
  const oppScore = gamepack
    ? getGamepackScore(gamepack, side === "home" ? "away" : "home")
    : game.oppScore;
  const status = getGamepackStatus(gamepack, game.status ?? "Live");

  return (
    <div className="mb-4 rounded-xl border border-border bg-card-alt px-2 py-3 sm:px-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pb-2 text-sm">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-heading">
          {status === "Final" ? null : <span className="live-dot" />}
          {status === "Final" ? "Final" : `Live · ${status}`}
        </span>
        <Matchup game={game} />
        <span className="text-lg font-semibold tabular-nums text-heading">
          {teamScore}-{oppScore}
        </span>
      </div>
      <TeamGameChart
        game={game}
        teamAbbr={teamAbbr}
        gamepack={gamepack}
        status={gamepack ? "ready" : "loading"}
        seasonPathSuffix={seasonPathSuffix}
      />
    </div>
  );
}

type TeamGamesProps = {
  // Every game in the season, oldest first.
  games: TeamGame[];
  teamAbbr: string;
  // Appended to player links so they stay in the season being viewed.
  seasonPathSuffix: string;
  // Only the season in progress has live status to layer on.
  liveEnabled: boolean;
};

export function TeamGames({
  games,
  teamAbbr,
  seasonPathSuffix,
  liveEnabled,
}: TeamGamesProps) {
  const [selectedFilter, setSelectedFilter] = useState<GameFilter | null>(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  // undefined: nothing chosen yet, so the latest game is open.
  const [openGameId, setOpenGameId] = useState<string | null | undefined>(undefined);
  const { liveGames, gamepacks } = useLiveGames({
    teamAbbrs: [teamAbbr],
    enabled: liveEnabled,
  });
  const liveGame = liveGames[0]?.game ?? null;

  const completed = games.filter(isCompletedGame);
  const options = getFilterOptions(completed);
  const defaultFilter: GameFilter =
    options.find((option) => option.value === "regular")?.value ??
    options[0]?.value ??
    "all";
  const filter =
    selectedFilter && options.some((option) => option.value === selectedFilter)
      ? selectedFilter
      : defaultFilter;
  const filteredCompleted = completed
    .filter((game) => filter === "all" || getFilterOf(game) === filter)
    .reverse();
  const upcoming = games
    .filter((game) => !isCompletedGame(game) && game.gameId !== liveGame?.gameId)
    .sort((left, right) => getStartTime(left) - getStartTime(right));
  const shownCompleted = showAllCompleted
    ? filteredCompleted
    : filteredCompleted.slice(0, INITIAL_COMPLETED_COUNT);
  const shownUpcoming = showAllUpcoming
    ? upcoming
    : upcoming.slice(0, INITIAL_UPCOMING_COUNT);
  const effectiveOpenId =
    openGameId === undefined
      ? liveGame
        ? null
        : (filteredCompleted[0]?.gameId ?? null)
      : openGameId;

  function selectFilter(option: SeasonTypeSelectorOption<GameFilter>) {
    setSelectedFilter(option.value);
    setShowAllCompleted(false);
    setOpenGameId(undefined);
  }

  return (
    <section className="card px-3 py-4 sm:px-5 sm:py-5" aria-labelledby="games-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2
            id="games-title"
            className="text-lg font-semibold tracking-[-0.01em] text-heading"
          >
            Games
          </h2>
          <p className="mt-0.5 max-w-[62ch] text-[13px] leading-snug text-muted">
            Open a game for its minutes map: who was on the floor when, and
            every play they made.
          </p>
        </div>
        <SeasonTypeSelector
          ariaLabel="Filter games by season type"
          options={options}
          selectedValue={filter}
          onSelect={selectFilter}
        />
      </div>

      <div className="mt-4">
        {liveGame ? (
          <LiveGame
            game={liveGame}
            gamepack={gamepacks[liveGame.gameId]}
            teamAbbr={teamAbbr}
            seasonPathSuffix={seasonPathSuffix}
          />
        ) : null}

        {upcoming.length ? (
          <div className="mb-4">
            <h3 className="eyebrow px-2 sm:px-3">Coming up</h3>
            <ul className="mt-1">
              {shownUpcoming.map((game) => (
                <li
                  key={game.gameId}
                  className="flex h-9 items-center gap-3 px-2 text-sm sm:px-3"
                >
                  <GameDate game={game} />
                  <span className="flex w-[92px] shrink-0 items-center sm:w-[170px]">
                    <Matchup game={game} />
                  </span>
                  <span className="text-xs text-muted">
                    {game.status || "Scheduled"}
                  </span>
                </li>
              ))}
            </ul>
            {upcoming.length > INITIAL_UPCOMING_COUNT ? (
              <button
                type="button"
                onClick={() => setShowAllUpcoming((current) => !current)}
                className="ml-2 mt-1 border-0 bg-transparent p-0 text-xs font-semibold text-link hover:underline sm:ml-3"
              >
                {showAllUpcoming
                  ? "Show fewer"
                  : `Show all ${upcoming.length} upcoming games`}
              </button>
            ) : null}
          </div>
        ) : null}

        {filteredCompleted.length ? (
          <>
            <h3 className="eyebrow px-2 sm:px-3">Results</h3>
            <ul className="mt-1 space-y-0.5">
              {shownCompleted.map((game) => (
                <GameRow
                  key={game.gameId}
                  game={game}
                  teamAbbr={teamAbbr}
                  seasonPathSuffix={seasonPathSuffix}
                  isOpen={effectiveOpenId === game.gameId}
                  onToggle={() =>
                    setOpenGameId(
                      effectiveOpenId === game.gameId ? null : game.gameId,
                    )
                  }
                  showSeasonType={filter === "all" || filter === "other"}
                />
              ))}
            </ul>
            {filteredCompleted.length > INITIAL_COMPLETED_COUNT ? (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  className="pill"
                  onClick={() => setShowAllCompleted((current) => !current)}
                >
                  {showAllCompleted
                    ? "Show fewer games"
                    : `Show all ${filteredCompleted.length} games`}
                </button>
              </div>
            ) : null}
          </>
        ) : liveGame || upcoming.length ? null : (
          <p className="rounded-xl bg-card-alt px-4 py-6 text-center text-sm text-muted">
            No games recorded for this season yet.
          </p>
        )}
      </div>
    </section>
  );
}
