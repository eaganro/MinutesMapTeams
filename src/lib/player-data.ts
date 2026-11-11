import { cache } from "react";
import { findSeasonsWithData, getGzippedJson } from "@/lib/s3-json";
import { getKnownSeasons } from "@/lib/seasons";
import type { StatLine, TeamGameSeasonType } from "@/lib/team-data";

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

export type PlayerSeasonTotals = TeamRecord & {
  games: number;
  box: StatLine;
};

export type PlayerSeasonSplit = {
  games: number;
  teams: TeamSummary[];
  record: TeamRecord;
  totals: PlayerSeasonTotals;
  averages: {
    box: StatLine;
  };
};

export type PlayerGameAction = {
  quarter?: number;
  period?: number;
  time?: string;
  clock?: string;
  type?: string;
  actionType?: string;
  text?: string;
  description?: string;
  detail?: string;
  subType?: string;
  seq?: string | number;
  actionNumber?: string | number;
  r?: string;
  result?: string;
  awayScore?: string | number;
  homeScore?: string | number;
  scoreAway?: string | number;
  scoreHome?: string | number;
};

export type PlayerGameSegment = {
  quarter?: number;
  period?: number;
  start?: string;
  end?: string;
};

export type PlayerGameDetail = {
  actions: PlayerGameAction[];
  segments: PlayerGameSegment[];
};

export type PlayerGame = {
  gameId: string;
  nbaGameId: string;
  date: string;
  start: string;
  season: string;
  seasonType: TeamGameSeasonType;
  homeAway: "home" | "away";
  result: "W" | "L" | "T";
  teamScore: number;
  oppScore: number;
  teamId: number;
  teamAbbr: string;
  teamName: string;
  opponentId: number;
  opponentAbbr: string;
  opponentName: string;
  box: StatLine;
  gamepackKey: string;
  playerId: number;
  playerKey: string;
  detail?: PlayerGameDetail;
};

export type PlayerPageData = {
  schemaVersion: number;
  updatedAt: string;
  season: string;
  player: {
    id: number;
    key: string;
    first: string;
    last: string;
    name: string;
  };
  teams: TeamSummary[];
  games: PlayerGame[];
  record: TeamRecord;
  totals: PlayerSeasonTotals;
  averages: {
    box: StatLine;
  };
  bySeasonType: Partial<Record<TeamGameSeasonType, PlayerSeasonSplit>>;
};

function getPlayerDataKey(playerId: string, season: string) {
  return `data/pages/players/${playerId}/${season}.json.gz`;
}

export function isPlayerId(value: string) {
  return /^\d+$/.test(value);
}

export const getPlayerPageData = cache((playerId: string, season: string) =>
  getGzippedJson<PlayerPageData>(getPlayerDataKey(playerId, season)),
);

// Seasons this player has a page artifact for, newest first.
export const getPlayerSeasons = cache((playerId: string) =>
  findSeasonsWithData(getKnownSeasons(), (season) =>
    getPlayerDataKey(playerId, season),
  ),
);
