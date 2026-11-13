// Play-by-play classification and time maths for the minutes chart. The rules
// mirror the main MinutesMap site so an event gets the same symbol on both.

import type { PlayerGameAction, PlayerGameSegment } from "@/lib/player-data";

const REGULATION_PERIOD_SECONDS = 12 * 60;
const OVERTIME_PERIOD_SECONDS = 5 * 60;
const REGULATION_SECONDS = REGULATION_PERIOD_SECONDS * 4;
const NBA_EVENT_BASE_URL = "https://www.nba.com/stats/events";

export type EventType =
  | "point"
  | "miss"
  | "rebound"
  | "assist"
  | "turnover"
  | "block"
  | "steal"
  | "foul";

// Order of the legend toggles; an event's index here is its toggle slot.
export const EVENT_TYPES: EventType[] = [
  "point",
  "miss",
  "rebound",
  "assist",
  "turnover",
  "block",
  "steal",
  "foul",
];

export const EVENT_LABELS: Record<EventType, string> = {
  point: "Point",
  miss: "Miss",
  rebound: "Rebound",
  assist: "Assist",
  turnover: "Turnover",
  block: "Block",
  steal: "Steal",
  foul: "Foul",
};

export type TimelineAction = {
  period: number;
  clock: string;
  // Seconds since tip-off.
  elapsed: number;
  actionType: string;
  description: string;
  subType: string;
  actionNumber: string | number | null;
  result: string;
  awayScore: number | null;
  homeScore: number | null;
};

export type TimelineSegment = {
  period: number;
  startElapsed: number;
  endElapsed: number;
};

// An action that draws a marker.
export type TimelineMarker = {
  action: TimelineAction;
  eventType: EventType;
  statIndex: number;
  isFreeThrow: boolean;
  isThree: boolean;
  // Free throws only: ring radius as a multiple of the marker size.
  ringRatio: number;
  // A made basket with an and-one free throw at the same clock.
  isAnd1Point: boolean;
  videoUrl: string | null;
};

function timeToSeconds(time?: string) {
  if (!time) {
    return 0;
  }

  const normalized = time.toString().trim();
  const match =
    normalized.match(/^(?:PT)?(\d+)M(\d+)(?:\.(\d+))?S?$/) ??
    normalized.match(/^(\d+):(\d+)(?:\.(\d+))?$/) ??
    normalized.match(/^(\d+)(\d{2})(?:\.(\d+))?$/);

  if (!match) {
    return 0;
  }

  return (
    Number.parseInt(match[1] ?? "0", 10) * 60 +
    Number.parseInt(match[2] ?? "0", 10)
  );
}

export function getPeriodDurationSeconds(period: number) {
  return period <= 4 ? REGULATION_PERIOD_SECONDS : OVERTIME_PERIOD_SECONDS;
}

export function getPeriodStartSeconds(period: number) {
  if (period <= 1) {
    return 0;
  }

  if (period <= 4) {
    return (period - 1) * REGULATION_PERIOD_SECONDS;
  }

  return REGULATION_SECONDS + (period - 5) * OVERTIME_PERIOD_SECONDS;
}

export function getGameTotalSeconds(periodCount: number) {
  if (periodCount <= 4) {
    return periodCount * REGULATION_PERIOD_SECONDS;
  }

  return REGULATION_SECONDS + (periodCount - 4) * OVERTIME_PERIOD_SECONDS;
}

function getSecondsElapsed(period: number, clock: string) {
  const periodDuration = getPeriodDurationSeconds(period);
  const remaining = Math.min(timeToSeconds(clock), periodDuration);

  return getPeriodStartSeconds(period) + (periodDuration - remaining);
}

export function formatPeriodLabel(period: number) {
  if (period <= 4) {
    return `Q${period}`;
  }

  const overtime = period - 4;
  return overtime === 1 ? "OT" : `${overtime}OT`;
}

export function formatClock(clock: string) {
  const seconds = timeToSeconds(clock);
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;

  return `${minutes}:${remainderSeconds.toString().padStart(2, "0")}`;
}

function toScore(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAction(action: PlayerGameAction): TimelineAction | null {
  const period = Number(action.quarter ?? action.period);
  const clock = action.time ?? action.clock;
  const rawActionNumber = action.seq ?? action.actionNumber;

  if (!Number.isFinite(period) || period <= 0 || !clock) {
    return null;
  }

  return {
    period,
    clock,
    elapsed: getSecondsElapsed(period, clock),
    actionType: String(action.type ?? action.actionType ?? ""),
    description: String(action.text ?? action.description ?? ""),
    subType: String(action.detail ?? action.subType ?? ""),
    actionNumber:
      rawActionNumber !== undefined && rawActionNumber !== null
        ? rawActionNumber
        : null,
    result: String(action.r ?? action.result ?? ""),
    awayScore: toScore(action.awayScore ?? action.scoreAway),
    homeScore: toScore(action.homeScore ?? action.scoreHome),
  };
}

export function normalizeSegments(
  segments: PlayerGameSegment[] | undefined,
): TimelineSegment[] {
  return (segments ?? []).flatMap((segment) => {
    const period = Number(segment.quarter ?? segment.period);

    if (
      !Number.isFinite(period) ||
      period <= 0 ||
      !segment.start ||
      !segment.end
    ) {
      return [];
    }

    return [
      {
        period,
        startElapsed: getSecondsElapsed(period, segment.start),
        endElapsed: getSecondsElapsed(period, segment.end),
      },
    ];
  });
}

function isRenderableAction(action: TimelineAction) {
  const actionType = action.actionType.toLowerCase();

  return (
    actionType !== "substitution" &&
    actionType !== "jump ball" &&
    actionType !== "jumpball" &&
    actionType !== "violation"
  );
}

function hasMissToken(value: string) {
  return /\bmiss(?:ed|es)?\b/i.test(value);
}

function isFreeThrowAction(action: TimelineAction) {
  const actionType = action.actionType.toLowerCase();
  const description = action.description.toLowerCase();

  if (actionType.includes("foul")) {
    return false;
  }

  return (
    actionType === "freethrow" ||
    actionType.includes("free throw") ||
    description.includes("free throw") ||
    /\bft\b/i.test(description)
  );
}

function isThreePointAction(action: TimelineAction) {
  return (
    action.actionType.toLowerCase() === "3pt" ||
    action.description.toLowerCase().includes("3pt")
  );
}

function getFreeThrowAttempt(action: TimelineAction) {
  const text = `${action.subType || ""} ${action.description || ""}`;
  const match = text.match(/\b(?:ft|free throw)\b\s*(\d+)\s*(?:of|\/)\s*(\d+)/i);

  if (!match) {
    const subTypeMatch = action.subType.match(/^(\d+)\s*of\s*(\d+)$/i);
    return subTypeMatch
      ? { attempt: Number(subTypeMatch[1]), total: Number(subTypeMatch[2]) }
      : { attempt: 1, total: 1 };
  }

  return { attempt: Number(match[1]), total: Number(match[2]) };
}

function getFreeThrowRingRatio(attempt: number, total: number) {
  if (total <= 1) {
    return 0.8;
  }

  if (attempt === 1) {
    // 0.6 less half the ring's stroke, so it nests inside the second ring.
    return 0.5;
  }

  if (attempt === 2) {
    return 0.8;
  }

  return 1.1;
}

function getEventType(action: TimelineAction): EventType | null {
  const description = action.description.toLowerCase();
  const actionType = action.actionType.toLowerCase();
  const result = action.result.toLowerCase();
  const isMiss =
    result === "x" ||
    result === "miss" ||
    hasMissToken(description) ||
    actionType.includes("miss");
  const isShot =
    actionType === "2pt" ||
    actionType === "3pt" ||
    actionType === "freethrow" ||
    actionType === "free throw" ||
    actionType.includes("shot") ||
    description.includes("free throw") ||
    /\bft\b/i.test(description);

  if (isMiss) {
    return "miss";
  }

  if (isShot) {
    return "point";
  }

  if (actionType.includes("rebound") || description.includes("reb")) {
    return "rebound";
  }

  if (actionType.includes("assist") || description.includes("assist")) {
    return "assist";
  }

  if (actionType.includes("turnover") || description.includes("turnover")) {
    return "turnover";
  }

  if (actionType.includes("block") || description.includes("block")) {
    return "block";
  }

  if (actionType.includes("steal") || description.includes("steal")) {
    return "steal";
  }

  if (actionType.includes("foul") || description.includes("foul")) {
    return "foul";
  }

  return null;
}

function normalizeEventId(actionNumber: string | number | null) {
  if (actionNumber === null) {
    return null;
  }

  const match = String(actionNumber).trim().match(/\d+/);
  return match ? match[0] : null;
}

function buildNbaEventUrl(
  gameId: string | undefined,
  actionNumber: string | number | null,
  description: string,
  season: string | undefined,
) {
  const eventId = normalizeEventId(actionNumber);
  if (!gameId || !eventId || !season) {
    return null;
  }

  const params = new URLSearchParams({
    GameEventID: eventId,
    GameID: String(gameId).padStart(10, "0"),
    Season: season,
    flag: "1",
    title: description || "",
  });

  return `${NBA_EVENT_BASE_URL}?${params.toString()}`;
}

// nba.com files the clip under the shot or turnover, not under the free
// throw, block or steal that came with it.
function resolveVideoAction(
  action: TimelineAction,
  eventType: EventType,
  isFreeThrow: boolean,
  allActions: TimelineAction[],
): TimelineAction {
  const findAtSameClock = (wanted: EventType) =>
    allActions.find(
      (entry) =>
        entry.clock === action.clock &&
        entry.period === action.period &&
        entry !== action &&
        getEventType(entry) === wanted,
    );

  if (isFreeThrow) {
    return findAtSameClock("point") ?? action;
  }

  if (eventType === "block") {
    return findAtSameClock("miss") ?? action;
  }

  if (eventType === "steal") {
    const turnover = findAtSameClock("turnover");
    if (turnover) {
      return turnover;
    }

    const eventId = normalizeEventId(action.actionNumber);
    const previous = eventId ? Number.parseInt(eventId, 10) - 1 : 0;
    return previous > 0 ? { ...action, actionNumber: previous } : action;
  }

  return action;
}

export type GameTimeline = {
  markers: TimelineMarker[];
  segments: TimelineSegment[];
  periodCount: number;
};

// Turns one player's raw actions and stints for a game into drawable markers.
export function buildGameTimeline({
  actions,
  segments,
  nbaGameId,
  season,
}: {
  actions?: PlayerGameAction[];
  segments?: PlayerGameSegment[];
  nbaGameId?: string;
  season?: string;
}): GameTimeline {
  const normalized = (actions ?? []).flatMap((action) => {
    const result = normalizeAction(action);
    return result ? [result] : [];
  });
  const renderable = normalized.filter(isRenderableAction);
  const timelineSegments = normalizeSegments(segments);
  const pointAtTime = new Set<string>();
  const freeThrowOneOfOneAtTime = new Set<string>();
  const timeKey = (action: TimelineAction) => `${action.period}|${action.clock}`;

  for (const action of renderable) {
    if (isFreeThrowAction(action)) {
      const { attempt, total } = getFreeThrowAttempt(action);
      if (attempt === 1 && total === 1) {
        freeThrowOneOfOneAtTime.add(timeKey(action));
      }
    } else if (getEventType(action) === "point") {
      pointAtTime.add(timeKey(action));
    }
  }

  const markers = renderable.flatMap((action): TimelineMarker[] => {
    const isFreeThrow = isFreeThrowAction(action);
    const eventType = getEventType(action);

    if (!eventType) {
      return [];
    }

    let ringRatio = 0;
    if (isFreeThrow) {
      const { attempt, total } = getFreeThrowAttempt(action);
      const isAnd1 = attempt === 1 && total === 1 && pointAtTime.has(timeKey(action));
      ringRatio = isAnd1 ? 1.15 : getFreeThrowRingRatio(attempt, total);
    }

    const videoAction = resolveVideoAction(
      action,
      eventType,
      isFreeThrow,
      normalized,
    );

    return [
      {
        action,
        eventType,
        statIndex: EVENT_TYPES.indexOf(eventType),
        isFreeThrow,
        isThree: !isFreeThrow && isThreePointAction(action),
        ringRatio,
        isAnd1Point:
          !isFreeThrow &&
          eventType === "point" &&
          freeThrowOneOfOneAtTime.has(timeKey(action)),
        videoUrl: buildNbaEventUrl(
          nbaGameId,
          videoAction.actionNumber ?? action.actionNumber,
          videoAction.description || action.description,
          season,
        ),
      },
    ];
  });

  const periodCount = Math.max(
    4,
    ...normalized.map((action) => action.period),
    ...timelineSegments.map((segment) => segment.period),
  );

  return { markers, segments: timelineSegments, periodCount };
}

// "J. Tatum make 2pt layup 1ft" -> "Make 2pt layup 1ft": the row already says
// who the player is.
export function describeAction(description: string, nameVariants: string[]) {
  let text = description.trim();

  for (const name of nameVariants) {
    if (name && text.toLowerCase().startsWith(name.toLowerCase())) {
      text = text.slice(name.length).trim();
      break;
    }
  }

  return text ? text.charAt(0).toUpperCase() + text.slice(1) : description;
}
