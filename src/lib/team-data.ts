import { cache } from "react";
import { findSeasonsWithData, getGzippedJson } from "@/lib/s3-json";
import { getKnownSeasons } from "@/lib/seasons";

export { TEAM_ABBREVIATIONS, isTeamAbbreviation } from "@/lib/teams";

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

export type TeamRecord = {
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

export type TeamSeasonSplit = {
  games: number;
  record: TeamRecord;
  averages: Omit<StatLine, "seconds" | "pm"> & {
    pointsFor: number;
    pointsAgainst: number;
  };
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
  bySeasonType?: Partial<Record<TeamGameSeasonType, TeamSeasonSplit>>;
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
