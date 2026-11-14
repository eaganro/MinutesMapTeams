import type { TeamGame, TeamPageData } from "@/lib/team-data";

export function isFinished(game: TeamGame) {
  return game.played !== false && game.result !== null;
}

// Today's calendar date where NBA game dates are kept.
export function getTodayInEastern() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());
}

// Dates with results, oldest first. Today only counts once all of its games
// are final, so a date never stands for half a slate.
export function getCompleteGameDates(
  teamPages: (TeamPageData | null | undefined)[],
) {
  const finishedDates = new Set<string>();
  const unfinishedDates = new Set<string>();

  for (const teamPage of teamPages) {
    for (const game of teamPage?.games ?? []) {
      (isFinished(game) ? finishedDates : unfinishedDates).add(game.date);
    }
  }

  const today = getTodayInEastern();
  return [...finishedDates]
    .filter((date) => date < today || (date === today && !unfinishedDates.has(date)))
    .sort();
}
