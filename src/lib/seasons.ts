// Oldest season the pipeline has page artifacts for. Lower this if older
// seasons are backfilled under data/pages/.
export const EARLIEST_SEASON = "2025-26";

const SEASON_PATTERN = /^(\d{4})-(\d{2})$/;
const SEASON_START_MONTH = 10;

export function formatSeasonLabel(startYear: number) {
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

function getSeasonStartYear(season: string) {
  const match = SEASON_PATTERN.exec(season);
  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  return formatSeasonLabel(startYear) === season ? startYear : null;
}

// Mirrors the pipeline's season derivation: a season starts in October and is
// labelled by its start year, so the label holds through the following summer.
export function getCurrentSeason(now = new Date()) {
  const year = now.getUTCFullYear();
  const startYear = now.getUTCMonth() + 1 >= SEASON_START_MONTH ? year : year - 1;

  return formatSeasonLabel(startYear);
}

// Seasons that can have page artifacts, newest first.
export function getKnownSeasons(now = new Date()) {
  const earliestStartYear = getSeasonStartYear(EARLIEST_SEASON) ?? 0;
  const currentStartYear = getSeasonStartYear(getCurrentSeason(now)) ?? 0;
  const seasons: string[] = [];

  for (let year = currentStartYear; year >= earliestStartYear; year -= 1) {
    seasons.push(formatSeasonLabel(year));
  }

  return seasons;
}

export function isKnownSeason(value: string) {
  return getKnownSeasons().includes(value);
}

// The current season lives at the bare URL (/teams/BOS); older seasons get a
// suffix (/teams/BOS/2025-26).
export function getSeasonPathSuffix(season: string) {
  return season === getCurrentSeason() ? "" : `/${season}`;
}
