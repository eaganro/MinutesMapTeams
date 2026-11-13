import { formatGameDate, formatOpponentLabel } from "@/lib/format";
import { getGamePageUrl } from "@/lib/game-url";
import type { TeamGame } from "@/lib/team-data";

// Margins beyond this fill the full bar height.
const MAX_MARGIN = 30;

// The season as a row of bars: up for a win, down for a loss, height is the
// margin. Each bar opens that game on the main MinutesMap site.
export function TeamResultsStrip({
  games,
  teamAbbr,
}: {
  // Finished games, oldest first.
  games: TeamGame[];
  teamAbbr: string;
}) {
  if (games.length < 2) {
    return null;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="eyebrow">Results by game</h2>
        <p className="flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-[var(--win-fill)]" />
            Win
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-[var(--loss-fill)]" />
            Loss
          </span>
          <span className="hidden sm:inline">Bar height is the margin</span>
        </p>
      </div>
      <ol className="results-strip mt-2" aria-label="Game results, oldest to newest">
        {games.map((game, index) => {
          const margin = game.teamScore - game.oppScore;
          const isWin = margin > 0;
          const height = Math.max(
            8,
            (Math.min(Math.abs(margin), MAX_MARGIN) / MAX_MARGIN) * 100,
          );
          const position = games.length > 1 ? index / (games.length - 1) : 0.5;
          const align = position < 0.15 ? "start" : position > 0.85 ? "end" : "center";
          const label = `${formatGameDate(game.date)} ${formatOpponentLabel(
            game.homeAway,
            game.opponentAbbr,
          )}`;

          return (
            <li key={game.gameId} className="results-strip__item">
              <a
                href={getGamePageUrl({
                  date: game.date,
                  homeAway: game.homeAway,
                  teamAbbr,
                  opponentAbbr: game.opponentAbbr,
                })}
                className="results-strip__link"
                aria-label={`${label}: ${isWin ? "won" : "lost"} ${game.teamScore}-${game.oppScore}`}
              >
                <span
                  className={`results-strip__bar ${
                    isWin ? "results-strip__bar--win" : "results-strip__bar--loss"
                  }`}
                  style={{ height: `${height / 2}%` }}
                />
                <span className={`results-strip__tip results-strip__tip--${align}`}>
                  <span className="text-muted">{label}</span>{" "}
                  <span className={`font-semibold ${isWin ? "result-w" : "result-l"}`}>
                    {isWin ? "W" : "L"}
                  </span>{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {game.teamScore}-{game.oppScore}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
