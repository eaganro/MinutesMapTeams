import { cache } from "react";
import { findSeasonsWithData, getGzippedJson } from "@/lib/s3-json";
import { getKnownSeasons } from "@/lib/seasons";

export const TEAM_ABBREVIATIONS = [
  "ATL",
  "BOS",
  "BKN",
  "CHA",
  "CHI",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GSW",
  "HOU",
  "IND",
  "LAC",
  "LAL",
  "MEM",
  "MIA",
  "MIL",
  "MIN",
  "NOP",
  "NYK",
  "OKC",
  "ORL",
  "PHI",
  "PHX",
  "POR",
  "SAC",
  "SAS",
  "TOR",
  "UTA",
  "WAS",
] as const;

export type StatLine = {
  seconds?: number;
  min: string;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  pf: number;
  pm?: number;
};

type Leader = {
  id: number;
  name: string;
  value: number;
};

export type TeamGameSeasonType =
  | "preseason"
  | "regular"
  | "play_in"
  | "playoffs"
  | (string & {});

type TeamRecord = {
  wins: number;
  losses: number;
  ties: number;
};

type TeamSummary = {
  id: number;
  abbr: string;
  name: string;
};

type PlayerSeasonTotals = TeamRecord & {
  games: number;
  box: StatLine;
};

type PlayerSeasonSplit = {
  games: number;
  teams?: TeamSummary[];
  record?: TeamRecord;
  totals: PlayerSeasonTotals;
  averages: {
    box: StatLine;
  };
};

export type TeamGame = {
  gameId: string;
  nbaGameId: string;
  date: string;
  start: string;
  homeAway: "home" | "away";
  season: string;
  seasonType: TeamGameSeasonType;
  opponentId: number;
  opponentAbbr: string;
  opponentName: string;
  status?: string;
  played?: boolean;
  result: "W" | "L" | "T" | null;
  teamScore: number;
  oppScore: number;
  teamStats: Partial<StatLine>;
  leaders: Partial<Record<"pts" | "reb" | "ast", Leader>>;
  players: Array<{
    playerId: number;
    name: string;
    box: StatLine;
  }>;
  playerCount: number;
  gamepackKey: string | null;
  recordAfter: {
    wins: number;
    losses: number;
    ties: number;
  };
  recordAfterBySeasonType?: TeamRecord | null;
};

export type TeamPlayerSeason = {
  playerId: number;
  name: string;
  games?: number;
  box?: StatLine;
  averages?: StatLine | {
    box: StatLine;
  };
  totals?: PlayerSeasonTotals;
  bySeasonType?: Partial<Record<TeamGameSeasonType, PlayerSeasonSplit>>;
};

export type TeamPageData = {
  schemaVersion: number;
  updatedAt: string;
  season: string;
  team: {
    id: number;
    abbr: string;
    name: string;
  };
  games: TeamGame[];
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  totals: StatLine & {
    pointsFor: number;
    pointsAgainst: number;
  };
  averages: Omit<StatLine, "seconds" | "pm"> & {
    pointsFor: number;
    pointsAgainst: number;
  };
  players: TeamPlayerSeason[];
};

function getTeamDataKey(teamAbbr: string, season: string) {
  return `data/pages/teams/${teamAbbr}/${season}.json.gz`;
}

export const getTeamPageData = cache((teamAbbr: string, season: string) =>
  getGzippedJson<TeamPageData>(getTeamDataKey(teamAbbr, season)),
);

// Seasons this team has a page artifact for, newest first.
export const getTeamSeasons = cache((teamAbbr: string) =>
  findSeasonsWithData(getKnownSeasons(), (season) =>
    getTeamDataKey(teamAbbr, season),
  ),
);

export function isTeamAbbreviation(value: string): value is (typeof TEAM_ABBREVIATIONS)[number] {
  return TEAM_ABBREVIATIONS.includes(
    value as (typeof TEAM_ABBREVIATIONS)[number],
  );
}
