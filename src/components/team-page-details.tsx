"use client";

import { useState } from "react";
import type { TeamGame, TeamPlayerSeason } from "@/lib/team-data";

const INITIAL_PLAYER_COUNT = 12;
const PLAYER_PAGE_SIZE = 12;
const INITIAL_GAME_COUNT = 10;
const GAME_PAGE_SIZE = 10;

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

type TeamPageDetailsProps = {
  games: TeamGame[];
  players: TeamPlayerSeason[];
};

export function TeamPageDetails({
  games,
  players,
}: TeamPageDetailsProps) {
  const [visiblePlayers, setVisiblePlayers] = useState(
    Math.min(INITIAL_PLAYER_COUNT, players.length),
  );
  const [visibleGames, setVisibleGames] = useState(
    Math.min(INITIAL_GAME_COUNT, games.length),
  );

  const displayedPlayers = players.slice(0, visiblePlayers);
  const displayedGames = games.slice(0, visibleGames);
  const hasMorePlayers = visiblePlayers < players.length;
  const hasMoreGames = visibleGames < games.length;

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Player Table
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-heading">
              Full roster output
            </h2>
          </div>
          <p className="text-sm text-muted">
            {displayedPlayers.length} of {players.length}
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]">
                  Player
                </th>
                <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]">
                  GP
                </th>
                <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]">
                  MIN
                </th>
                <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]">
                  PTS
                </th>
                <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]">
                  REB
                </th>
                <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]">
                  AST
                </th>
                <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em]">
                  +/-
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedPlayers.map((player) => (
                <tr
                  key={player.playerId}
                  className="rounded-[16px] bg-card-alt text-copy"
                >
                  <td className="rounded-l-[16px] px-3 py-3 font-medium text-foreground">
                    {player.name}
                  </td>
                  <td className="px-3 py-3">{player.games}</td>
                  <td className="px-3 py-3">{player.averages.min}</td>
                  <td className="px-3 py-3">{player.averages.pts.toFixed(1)}</td>
                  <td className="px-3 py-3">{player.averages.reb.toFixed(1)}</td>
                  <td className="px-3 py-3">{player.averages.ast.toFixed(1)}</td>
                  <td className="rounded-r-[16px] px-3 py-3">
                    {player.averages.pm !== undefined
                      ? formatSignedNumber(Number(player.averages.pm.toFixed(1)))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMorePlayers ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setVisiblePlayers((currentValue) =>
                  Math.min(currentValue + PLAYER_PAGE_SIZE, players.length),
                )
              }
              className="rounded-full border border-border-strong bg-card-alt px-5 py-2 text-sm text-copy transition-colors hover:bg-hover hover:text-foreground"
            >
              Show More Players
            </button>
          </div>
        ) : null}
      </article>

      <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Game Log
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-heading">
              Full season results
            </h2>
          </div>
          <p className="text-sm text-muted">
            {displayedGames.length} of {games.length}
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
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${
                        game.result === "W"
                          ? "bg-[#dff3e4] text-[#166534] dark:bg-[#193126] dark:text-[#86efac]"
                          : "bg-[#f7e0e0] text-[#991b1b] dark:bg-[#341c1c] dark:text-[#fca5a5]"
                      }`}
                    >
                      {game.result}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatOpponentLabel(game.homeAway, game.opponentAbbr)}
                    </span>
                  </div>
                  <p className="mt-2 text-copy">{formatGameDate(game.date)}</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold tracking-[-0.02em] text-heading">
                    {game.teamScore} - {game.oppScore}
                  </p>
                  <p className="mt-1 text-muted">{game.opponentName}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-3">
                <p>
                  PTS:{" "}
                  <span className="font-medium text-copy">
                    {game.leaders.pts.name} ({game.leaders.pts.value})
                  </span>
                </p>
                <p>
                  REB:{" "}
                  <span className="font-medium text-copy">
                    {game.leaders.reb.name} ({game.leaders.reb.value})
                  </span>
                </p>
                <p>
                  AST:{" "}
                  <span className="font-medium text-copy">
                    {game.leaders.ast.name} ({game.leaders.ast.value})
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
                  Math.min(currentValue + GAME_PAGE_SIZE, games.length),
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
