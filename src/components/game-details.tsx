import Link from "next/link";
import { BoxTable } from "@/components/box-table";
import { formatLongGameDate, formatSeasonTypeLabel } from "@/lib/format";
import { getGamePageUrl } from "@/lib/game-url";
import type { StatLine } from "@/lib/team-data";
import { isTeamAbbreviation } from "@/lib/teams";

export type GameDetailsGame = {
  gameId: string;
  date: string;
  seasonType: string;
  homeAway: "home" | "away";
  teamAbbr: string;
  opponentAbbr: string;
  teamScore: number;
  oppScore: number;
  result: "W" | "L" | "T" | null;
  liveStatus?: string;
  box: StatLine;
};

// The opened row of a player's minutes map: the score, links and box line.
export function GameDetails({
  game,
  playerName,
  seasonPathSuffix,
  playerHref,
}: {
  game: GameDetailsGame;
  playerName: string;
  // Appended to the team link so it stays in the season being viewed.
  seasonPathSuffix: string;
  // Shown where the row is not already on the player's own page.
  playerHref?: string;
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
          {playerHref ? (
            <Link href={playerHref} className="text-link hover:underline">
              Player page
            </Link>
          ) : null}
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
