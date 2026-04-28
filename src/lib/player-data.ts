import { GetObjectCommand, NoSuchKey, S3Client } from "@aws-sdk/client-s3";
import { gunzipSync } from "node:zlib";
import { cache } from "react";
import {
  CURRENT_SEASON,
  TEAM_DATA_BUCKET,
  type StatLine,
  type TeamGameSeasonType,
} from "@/lib/team-data";

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
});

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
  seq?: number;
  actionNumber?: number;
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

export const getPlayerPageData = cache(
  async (playerId: string, season = CURRENT_SEASON) => {
    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: TEAM_DATA_BUCKET,
          Key: getPlayerDataKey(playerId, season),
        }),
      );

      if (!response.Body) {
        return null;
      }

      const compressedBytes = await response.Body.transformToByteArray();
      const jsonText = gunzipSync(Buffer.from(compressedBytes)).toString("utf8");
      return JSON.parse(jsonText) as PlayerPageData;
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
