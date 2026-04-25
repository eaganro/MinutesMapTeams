import { GetObjectCommand, NoSuchKey, S3Client } from "@aws-sdk/client-s3";
import { cache } from "react";
import { gunzipSync } from "node:zlib";

export const CURRENT_SEASON = "2025-26";
export const TEAM_DATA_BUCKET = "roryeagan.com-nba-processed-data";
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

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
});

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
  result: "W" | "L" | "T";
  teamScore: number;
  oppScore: number;
  teamStats: StatLine;
  leaders: {
    pts: Leader;
    reb: Leader;
    ast: Leader;
  };
  players: Array<{
    playerId: number;
    name: string;
    box: StatLine;
  }>;
  playerCount: number;
  gamepackKey: string;
  recordAfter: {
    wins: number;
    losses: number;
    ties: number;
  };
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

export const getTeamPageData = cache(
  async (teamAbbr: string, season = CURRENT_SEASON) => {
    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: TEAM_DATA_BUCKET,
          Key: getTeamDataKey(teamAbbr, season),
        }),
      );

      if (!response.Body) {
        return null;
      }

      const compressedBytes = await response.Body.transformToByteArray();
      const jsonText = gunzipSync(Buffer.from(compressedBytes)).toString("utf8");
      return JSON.parse(jsonText) as TeamPageData;
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return null;
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "$metadata" in error &&
        "name" in error &&
        (error as { name?: string }).name === "NoSuchKey"
      ) {
        return null;
      }

      throw error;
    }
  },
);

export function isTeamAbbreviation(value: string): value is (typeof TEAM_ABBREVIATIONS)[number] {
  return TEAM_ABBREVIATIONS.includes(
    value as (typeof TEAM_ABBREVIATIONS)[number],
  );
}
