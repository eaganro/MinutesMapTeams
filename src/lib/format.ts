import type { StatLine } from "@/lib/team-data";

const SEASON_TYPE_LABELS: Record<string, string> = {
  preseason: "Preseason",
  regular: "Regular Season",
  play_in: "Play-In",
  playoffs: "Playoffs",
};

export function formatSeasonTypeLabel(seasonType: string) {
  return (
    SEASON_TYPE_LABELS[seasonType] ??
    seasonType
      .split(/[_-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export type SeasonTypeGroup = "regular" | "playoffs" | "other";

// The three buckets the season-type filters offer.
export function getSeasonTypeGroup(seasonType: string): SeasonTypeGroup {
  return seasonType === "regular" || seasonType === "playoffs"
    ? seasonType
    : "other";
}

export function formatRecord(record: {
  wins: number;
  losses: number;
  ties?: number;
}) {
  return record.ties
    ? `${record.wins}-${record.losses}-${record.ties}`
    : `${record.wins}-${record.losses}`;
}

export function formatSigned(value: number | undefined, digits = 0) {
  if (value === undefined || !Number.isFinite(value)) {
    return "–";
  }

  const rounded = Number(value.toFixed(digits));
  const text = digits > 0 ? rounded.toFixed(digits) : String(rounded);
  return rounded > 0 ? `+${text}` : text;
}

export function formatAverage(value: number | undefined) {
  return value === undefined || !Number.isFinite(value) ? "–" : value.toFixed(1);
}

// Shooting percentage as "47.3"; "–" with no attempts.
export function formatPercentage(made: number, attempted: number) {
  if (!attempted) {
    return "–";
  }

  return ((made / attempted) * 100).toFixed(1);
}

// Game dates are calendar dates ("2026-11-11"); noon UTC keeps them on the
// same day in every US timezone.
function toCalendarDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

export function formatGameDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(toCalendarDate(value));
}

export function formatLongGameDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(toCalendarDate(value));
}

export function formatWeekday(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(toCalendarDate(value));
}

export function formatOpponentLabel(
  homeAway: "home" | "away",
  opponentAbbr: string,
) {
  return homeAway === "home" ? `vs ${opponentAbbr}` : `@ ${opponentAbbr}`;
}

export function parseMinutesToSeconds(value?: string | null) {
  if (!value) {
    return 0;
  }

  const [minutes, seconds] = value.split(":").map(Number);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return 0;
  }

  return minutes * 60 + seconds;
}

export function formatSecondsAsMinutes(seconds: number) {
  const roundedSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(roundedSeconds / 60);
  const remainderSeconds = roundedSeconds % 60;

  return `${minutes}:${remainderSeconds.toString().padStart(2, "0")}`;
}

// "37:45" -> "38"; box scores in dense rows show whole minutes.
export function formatWholeMinutes(box: Pick<StatLine, "min" | "seconds">) {
  const seconds = box.seconds ?? parseMinutesToSeconds(box.min);
  return String(Math.round(seconds / 60));
}

export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const STAT_NUMBER_KEYS = [
  "pts",
  "fgm",
  "fga",
  "tpm",
  "tpa",
  "ftm",
  "fta",
  "oreb",
  "dreb",
  "reb",
  "ast",
  "stl",
  "blk",
  "to",
  "pf",
  "pm",
] as const;

export type StatNumberKey = (typeof STAT_NUMBER_KEYS)[number];

export function createEmptyStatLine(): StatLine {
  return {
    min: "0:00",
    seconds: 0,
    pts: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    oreb: 0,
    dreb: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    to: 0,
    pf: 0,
    pm: 0,
  };
}

export function addBoxScore(total: StatLine, box: StatLine) {
  total.seconds =
    (total.seconds ?? 0) + (box.seconds ?? parseMinutesToSeconds(box.min));

  for (const key of STAT_NUMBER_KEYS) {
    total[key] = (total[key] ?? 0) + (box[key] ?? 0);
  }

  total.min = formatSecondsAsMinutes(total.seconds);
}

export function averageBoxScore(total: StatLine, games: number): StatLine {
  const averages = createEmptyStatLine();
  const divisor = Math.max(games, 1);

  for (const key of STAT_NUMBER_KEYS) {
    averages[key] = Number(((total[key] ?? 0) / divisor).toFixed(2));
  }

  averages.seconds = (total.seconds ?? 0) / divisor;
  averages.min = formatSecondsAsMinutes(averages.seconds);

  return averages;
}
