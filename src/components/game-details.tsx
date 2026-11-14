import Link from "next/link";
import { BoxTable } from "@/components/box-table";
import { TeamLogo } from "@/components/team-logo";
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

// The opened row of a player's minutes map: the score, links and box line. The
// player's name and both teams link to their pages.
export function GameDetails({
  game,
  playerName,
  seasonPathSuffix,
  playerHref,
}: {
  game: GameDetailsGame;
  playerName: string;
  // Appended to the team links so they stay in the season being viewed.
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

  // Logo plus abbreviation, with the logo on the outside so the scoreline reads
  // like the main site's schedule: [logo] HOU 125–118 UTA [logo]. The padding,
  // cancelled by negative margins, gives a finger-sized tap area without
  // changing the line's layout.
  const teamLink = (abbr: string, logoSide: "left" | "right") =>
    isTeamAbbreviation(abbr) ? (
      <Link
        href={`/teams/${abbr}${seasonPathSuffix}`}
        className={`group -mx-1 -my-2 inline-flex items-center gap-1 rounded px-1 py-2 text-link ${
          logoSide === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <TeamLogo team={abbr} size={16} />
        <span className="self-baseline underline decoration-link/40 underline-offset-2 group-hover:decoration-link">
          {abbr}
        </span>
      </Link>
    ) : (
      abbr
    );

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
        <p className="text-copy">
          {playerHref ? (
            <>
              <Link
                href={playerHref}
                className="font-semibold text-link underline decoration-link/40 underline-offset-2 hover:decoration-link"
              >
                {playerName}
              </Link>{" "}
              ·{" "}
            </>
          ) : null}
          <span className="font-semibold text-foreground">
            {teamLink(game.teamAbbr, "left")}{" "}
            <span className="tabular-nums">
              {game.teamScore}–{game.oppScore}
            </span>{" "}
            {teamLink(game.opponentAbbr, "right")}
          </span>{" "}
          · {game.result ? "Final" : game.liveStatus} ·{" "}
          {formatLongGameDate(game.date)} · {formatSeasonTypeLabel(game.seasonType)}
        </p>
        <a href={gameUrl} className="text-[13px] font-semibold text-link hover:underline">
          Full game on MinutesMap →
        </a>
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
