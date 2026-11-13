// Shapes and helpers for the live gamepack (data/gamepack/{GAME_ID}.json.gz)
// and the team-status artifact that points at it.

import {
  createEmptyStatLine,
  parseMinutesToSeconds,
  STAT_NUMBER_KEYS,
  toNumber,
  type StatNumberKey,
} from "@/lib/format";
import type { PlayerGameAction, PlayerGameSegment } from "@/lib/player-data";
import type { StatLine, TeamGame } from "@/lib/team-data";

export type TeamStatus = {
  currentGame?: TeamGame | null;
};

export type GamepackPlayer = {
  id?: number | string | null;
  first?: string | null;
  last?: string | null;
  stats?: Partial<Record<StatNumberKey | "min", number | string | null>>;
};

export type GamepackTeam = {
  id?: number | string | null;
  abbr?: string | null;
  name?: string | null;
  players?: GamepackPlayer[];
};

type Side = "home" | "away";

export type Gamepack = {
  box?: {
    status?: string | null;
    gameStatusText?: string | null;
    teams?: Partial<Record<Side, GamepackTeam>>;
  };
  flow?: {
    periods?: number;
    last?: {
      quarter?: number | string | null;
      time?: string | null;
      awayScore?: number | string | null;
      homeScore?: number | string | null;
      status?: string | null;
    };
    players?: Partial<Record<Side, Record<string, PlayerGameAction[]>>>;
    segments?: Partial<Record<Side, Record<string, PlayerGameSegment[]>>>;
  };
};

export function isCompletedGame(game: TeamGame) {
  return game.played !== false && game.result !== null;
}

function isPregameStatus(status?: string) {
  const normalized = (status ?? "").trim().toLowerCase();

  return (
    !normalized ||
    normalized.startsWith("scheduled") ||
    normalized.startsWith("pre") ||
    normalized.includes("tbd") ||
    /\b(?:am|pm|et)\b/.test(normalized)
  );
}

export function isLiveGame(game: TeamGame) {
  return (
    !isCompletedGame(game) &&
    Boolean(game.gamepackKey) &&
    !isPregameStatus(game.status)
  );
}

function isZeroClock(value?: string | null) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) {
    return false;
  }

  return /^(?:PT)?0*(?:M|:)?0{1,2}(?:\.0+)?S?$/.test(normalized);
}

export function isFinalGamepack(gamepack: Gamepack | undefined) {
  const status = String(
    gamepack?.box?.gameStatusText ??
      gamepack?.box?.status ??
      gamepack?.flow?.last?.status ??
      "",
  )
    .trim()
    .toLowerCase();
  if (status.startsWith("final")) {
    return true;
  }

  const last = gamepack?.flow?.last;

  return (
    toNumber(last?.quarter) >= 4 &&
    isZeroClock(last?.time) &&
    toNumber(last?.awayScore) !== toNumber(last?.homeScore)
  );
}

export function getGamepackScore(gamepack: Gamepack | undefined, side: Side) {
  const last = gamepack?.flow?.last;
  return toNumber(side === "home" ? last?.homeScore : last?.awayScore);
}

// "Q3 4:21" while live, "Final" once the gamepack says so.
export function getGamepackStatus(
  gamepack: Gamepack | undefined,
  fallback = "Live",
) {
  if (isFinalGamepack(gamepack)) {
    return "Final";
  }

  const last = gamepack?.flow?.last;
  const quarter = toNumber(last?.quarter);
  const time = String(last?.time ?? "").trim();

  if (quarter > 0 && time) {
    const match = time.match(/^(\d{2})(\d{2})(?:\.\d+)?$/);
    const clock = match ? `${Number(match[1])}:${match[2]}` : time;
    return `${quarter <= 4 ? `Q${quarter}` : quarter === 5 ? "OT" : `${quarter - 4}OT`} ${clock}`;
  }

  return fallback;
}

export function getGamepackPlayerName(player: GamepackPlayer) {
  const first = String(player.first ?? "").trim();
  const last = String(player.last ?? "").trim();
  return `${first} ${last}`.trim();
}

// Live gamepacks carry oreb/dreb but may omit reb.
export function buildGamepackPlayerBox(player: GamepackPlayer): StatLine {
  const stats = player.stats ?? {};
  const min = String(stats.min ?? "00:00");
  const box = createEmptyStatLine();

  box.min = min;
  box.seconds = parseMinutesToSeconds(min);

  for (const key of STAT_NUMBER_KEYS) {
    box[key] = toNumber(stats[key]);
  }
  box.reb = toNumber(stats.reb) || box.oreb + box.dreb;

  return box;
}

// The side a team is on in a gamepack, falling back when abbreviations are
// missing.
export function getGamepackSide(
  gamepack: Gamepack | undefined,
  teamAbbr: string,
  fallback: Side,
): Side {
  const teams = gamepack?.box?.teams;
  const normalized = teamAbbr.toUpperCase();

  if (String(teams?.home?.abbr ?? "").toUpperCase() === normalized) {
    return "home";
  }

  if (String(teams?.away?.abbr ?? "").toUpperCase() === normalized) {
    return "away";
  }

  return fallback;
}

// Names a player can be filed under in flow.players / flow.segments, and the
// prefixes play descriptions start with.
export function getPlayerNameVariants(first: string, last: string, id?: number) {
  const fullName = `${first} ${last}`.trim();
  const initialName = `${first.charAt(0)}. ${last}`.trim();
  const variants = [fullName, initialName];

  if (id) {
    variants.push(`${fullName}#${id}`, `${initialName}#${id}`);
  }

  return variants.filter(Boolean);
}

export function getGamepackPlayerFlow(
  gamepack: Gamepack | undefined,
  side: Side,
  nameVariants: string[],
) {
  const pick = <T,>(map: Record<string, T[]> | undefined) => {
    for (const key of nameVariants) {
      if (map?.[key]) {
        return map[key];
      }
    }
    return [];
  };

  return {
    actions: pick(gamepack?.flow?.players?.[side]),
    segments: pick(gamepack?.flow?.segments?.[side]),
  };
}
