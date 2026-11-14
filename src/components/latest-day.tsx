import Link from "next/link";
import { DayChart } from "@/components/day-chart";
import { formatLongGameDate } from "@/lib/format";
import type { GameDay } from "@/lib/game-days";

const HOME_PLAYER_COUNT = 6;

// The home page's pick from a day: the best game from each team, so a
// single blowout cannot fill the list.
function pickOnePerTeam(day: GameDay) {
  const seen = new Set<string>();
  return day.players
    .filter((player) => {
      if (seen.has(player.teamAbbr)) {
        return false;
      }
      seen.add(player.teamAbbr);
      return true;
    })
    .slice(0, HOME_PLAYER_COUNT);
}

export function LatestDay({ day }: { day: GameDay }) {
  return (
    <section className="card px-3 py-4 sm:px-5 sm:py-5" aria-labelledby="latest-day-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h1
            id="latest-day-title"
            className="text-lg font-semibold tracking-[-0.01em] text-heading"
          >
            Top performances{" "}
            <span className="font-normal text-muted">· {formatLongGameDate(day.date)}</span>
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Each line is a player&apos;s time on the floor; each symbol a play.
            Open a row for the game.
          </p>
        </div>
        <Link
          href={`/days/${day.date}`}
          className="text-xs font-semibold text-link hover:underline"
        >
          More players and other days →
        </Link>
      </div>
      <div className="mt-3">
        <DayChart
          players={pickOnePerTeam(day)}
          ariaLabel={`Top performances, ${day.date}`}
        />
      </div>
    </section>
  );
}
