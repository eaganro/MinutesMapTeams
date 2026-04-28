"use client";

import type { PlayerGameAction, PlayerGameSegment } from "@/lib/player-data";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const REGULATION_PERIOD_SECONDS = 12 * 60;
const OVERTIME_PERIOD_SECONDS = 5 * 60;
const REGULATION_SECONDS = REGULATION_PERIOD_SECONDS * 4;
const SVG_HEIGHT = 76;
const ROW_Y = 42;
const CHART_LEFT = 14;
const CHART_RIGHT = 14;

type NormalizedAction = {
  period: number;
  clock: string;
  actionType: string;
  description: string;
  subType: string;
  actionNumber: number | null;
  result: string;
};

type NormalizedSegment = {
  period: number;
  start: string;
  end: string;
};

type PlayerGameTimelineProps = {
  actions?: PlayerGameAction[];
  segments?: PlayerGameSegment[];
};

type EventType =
  | "point"
  | "miss"
  | "rebound"
  | "assist"
  | "turnover"
  | "block"
  | "steal"
  | "foul";

type EventConfig = {
  colorVar: string;
  fallback: string;
  label: string;
};

const EVENT_CONFIGS: Record<EventType, EventConfig> = {
  point: {
    colorVar: "--event-point",
    fallback: "#f59e0b",
    label: "Point",
  },
  miss: {
    colorVar: "--event-miss",
    fallback: "#475569",
    label: "Miss",
  },
  rebound: {
    colorVar: "--event-rebound",
    fallback: "#2563eb",
    label: "Rebound",
  },
  assist: {
    colorVar: "--event-assist",
    fallback: "#059669",
    label: "Assist",
  },
  turnover: {
    colorVar: "--event-turnover",
    fallback: "#dc2626",
    label: "Turnover",
  },
  block: {
    colorVar: "--event-block",
    fallback: "#7c3aed",
    label: "Block",
  },
  steal: {
    colorVar: "--event-steal",
    fallback: "#0891b2",
    label: "Steal",
  },
  foul: {
    colorVar: "--event-foul",
    fallback: "#111827",
    label: "Foul",
  },
};

function timeToSeconds(time?: string) {
  if (!time) {
    return 0;
  }

  const normalized = time.toString().trim();
  const isoMatch = normalized.match(/^(?:PT)?(\d+)M(\d+)(?:\.(\d+))?S?$/);
  if (isoMatch) {
    return (
      Number.parseInt(isoMatch[1] ?? "0", 10) * 60 +
      Number.parseInt(isoMatch[2] ?? "0", 10)
    );
  }

  const colonMatch = normalized.match(/^(\d+):(\d+)(?:\.(\d+))?$/);
  if (colonMatch) {
    return (
      Number.parseInt(colonMatch[1] ?? "0", 10) * 60 +
      Number.parseInt(colonMatch[2] ?? "0", 10)
    );
  }

  const compactMatch = normalized.match(/^(\d+)(\d{2})(?:\.(\d+))?$/);
  if (compactMatch) {
    return (
      Number.parseInt(compactMatch[1] ?? "0", 10) * 60 +
      Number.parseInt(compactMatch[2] ?? "0", 10)
    );
  }

  return 0;
}

function getPeriodDurationSeconds(period: number) {
  return period <= 4 ? REGULATION_PERIOD_SECONDS : OVERTIME_PERIOD_SECONDS;
}

function getPeriodStartSeconds(period: number) {
  if (period <= 1) {
    return 0;
  }

  if (period <= 4) {
    return (period - 1) * REGULATION_PERIOD_SECONDS;
  }

  return REGULATION_SECONDS + (period - 5) * OVERTIME_PERIOD_SECONDS;
}

function getGameTotalSeconds(periodCount: number) {
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

function formatPeriodLabel(period: number) {
  if (period <= 4) {
    return `Q${period}`;
  }

  const overtime = period - 4;
  return overtime === 1 ? "OT" : `${overtime}OT`;
}

function formatClock(clock: string) {
  const seconds = timeToSeconds(clock);
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;

  return `${minutes}:${remainderSeconds.toString().padStart(2, "0")}`;
}

function normalizeAction(action: PlayerGameAction): NormalizedAction | null {
  const period = Number(action.quarter ?? action.period);
  const clock = action.time ?? action.clock;
  const actionNumber = Number(action.seq ?? action.actionNumber);

  if (!Number.isFinite(period) || period <= 0 || !clock) {
    return null;
  }

  return {
    period,
    clock,
    actionType: String(action.type ?? action.actionType ?? ""),
    description: String(action.text ?? action.description ?? ""),
    subType: String(action.detail ?? action.subType ?? ""),
    actionNumber: Number.isFinite(actionNumber) ? actionNumber : null,
    result: String(action.r ?? action.result ?? ""),
  };
}

function normalizeSegment(segment: PlayerGameSegment): NormalizedSegment | null {
  const period = Number(segment.quarter ?? segment.period);

  if (
    !Number.isFinite(period) ||
    period <= 0 ||
    !segment.start ||
    !segment.end
  ) {
    return null;
  }

  return {
    period,
    start: segment.start,
    end: segment.end,
  };
}

function isRenderableAction(action: NormalizedAction) {
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

function isFreeThrowAction(action: NormalizedAction) {
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

function isThreePointAction(action: NormalizedAction) {
  const actionType = action.actionType.toLowerCase();
  const description = action.description.toLowerCase();

  return actionType === "3pt" || description.includes("3pt");
}

function getFreeThrowAttempt(action: NormalizedAction) {
  const text = `${action.subType || ""} ${action.description || ""}`;
  const match = text.match(
    /\b(?:ft|free throw)\b\s*(\d+)\s*(?:of|\/)\s*(\d+)/i,
  );

  if (!match) {
    return { attempt: 1, total: 1 };
  }

  return { attempt: Number(match[1]), total: Number(match[2]) };
}

function getFreeThrowRingRatio(attempt: number, total: number) {
  if (total <= 1) {
    return 0.8;
  }

  if (attempt === 1) {
    return 0.6;
  }

  if (attempt === 2) {
    return 0.8;
  }

  return 1.1;
}

function isOneOfOneFreeThrow(action: NormalizedAction) {
  const text = `${action.subType || ""} ${action.description || ""}`;

  return /\b(?:ft|free throw)\b\s*1\s*(?:of|\/)\s*1/i.test(text);
}

function getEventType(action: NormalizedAction): EventType | null {
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

function getEventColor(config: EventConfig) {
  return `var(${config.colorVar}, ${config.fallback})`;
}

function getActionKey(action: NormalizedAction, index: number) {
  return action.actionNumber !== null ? `${action.actionNumber}-${index}` : `${index}`;
}

function getActionTitle(action: NormalizedAction, eventType: EventType | "free-throw") {
  const label =
    eventType === "free-throw" ? "Free Throw" : EVENT_CONFIGS[eventType].label;

  return `${formatPeriodLabel(action.period)} ${formatClock(action.clock)} - ${label}${
    action.description ? `: ${action.description}` : ""
  }`;
}

function renderEventMarker(
  action: NormalizedAction,
  eventType: EventType,
  x: number,
  index: number,
  and1AtTime: Set<string>,
) {
  const baseSize = 4;
  const timeKey = `${action.period}|${action.clock}`;
  const isAnd1Point = eventType === "point" && and1AtTime.has(timeKey);
  const size = isAnd1Point ? baseSize * 0.88 : baseSize;
  const color = getEventColor(EVENT_CONFIGS[eventType]);
  const isThree = isThreePointAction(action);
  const key = getActionKey(action, index);
  const title = getActionTitle(action, eventType);
  let shape: ReactNode;

  if (eventType === "point") {
    shape = <circle cx={x} cy={ROW_Y} r={size} fill={color} />;
  } else if (eventType === "miss") {
    const thickness = size * 0.35;
    shape = (
      <path
        d={`M ${x - size} ${ROW_Y - size + thickness} L ${x - thickness} ${ROW_Y} L ${x - size} ${ROW_Y + size - thickness} L ${x - size + thickness} ${ROW_Y + size} L ${x} ${ROW_Y + thickness} L ${x + size - thickness} ${ROW_Y + size} L ${x + size} ${ROW_Y + size - thickness} L ${x + thickness} ${ROW_Y} L ${x + size} ${ROW_Y - size + thickness} L ${x + size - thickness} ${ROW_Y - size} L ${x} ${ROW_Y - thickness} L ${x - size + thickness} ${ROW_Y - size} Z`}
        fill={color}
      />
    );
  } else if (eventType === "rebound") {
    shape = (
      <polygon
        points={`${x},${ROW_Y - size} ${x + size},${ROW_Y} ${x},${ROW_Y + size} ${x - size},${ROW_Y}`}
        fill={color}
      />
    );
  } else if (eventType === "assist") {
    shape = (
      <polygon
        points={`${x - size * 0.6},${ROW_Y - size} ${x + size},${ROW_Y} ${x - size * 0.6},${ROW_Y + size}`}
        fill={color}
      />
    );
  } else if (eventType === "turnover") {
    shape = (
      <polygon
        points={`${x},${ROW_Y + size} ${x - size},${ROW_Y - size * 0.7} ${x + size},${ROW_Y - size * 0.7}`}
        fill={color}
      />
    );
  } else if (eventType === "block") {
    shape = (
      <rect
        x={x - size * 0.8}
        y={ROW_Y - size * 0.8}
        width={size * 1.6}
        height={size * 1.6}
        fill={color}
      />
    );
  } else if (eventType === "steal") {
    shape = (
      <polygon
        points={`${x},${ROW_Y - size} ${x - size},${ROW_Y + size * 0.7} ${x + size},${ROW_Y + size * 0.7}`}
        fill={color}
      />
    );
  } else {
    const angleStep = Math.PI / 3;
    const points = Array.from({ length: 6 }, (_, pointIndex) => {
      const angle = angleStep * pointIndex - Math.PI / 2;
      return `${x + Math.cos(angle) * size},${ROW_Y + Math.sin(angle) * size}`;
    }).join(" ");
    shape = <polygon points={points} fill={color} />;
  }

  return (
    <g key={`action-${key}`} className="player-game-timeline__event">
      <title>{title}</title>
      {shape}
      {isThree ? (
        <circle
          cx={x}
          cy={ROW_Y}
          r={size * (isAnd1Point ? 0.5 : 0.6)}
          fill="var(--event-3pt-marker, #dc2626)"
        />
      ) : null}
    </g>
  );
}

function renderFreeThrowMarker(
  action: NormalizedAction,
  x: number,
  index: number,
  pointAtTime: Set<string>,
) {
  const isMiss = hasMissToken(action.description) || action.result.toLowerCase() === "x";
  const color = isMiss
    ? "var(--event-miss, #475569)"
    : "var(--event-point, #f59e0b)";
  const size = 4;
  const strokeWidth = Math.max(1, size * 0.2);
  const { attempt, total } = getFreeThrowAttempt(action);
  const isAnd1 =
    isOneOfOneFreeThrow(action) && pointAtTime.has(`${action.period}|${action.clock}`);
  let ringRadius = size * (isAnd1 ? 1.15 : getFreeThrowRingRatio(attempt, total));

  if (!isAnd1 && total > 1 && attempt === 1) {
    ringRadius = Math.max(0.5, ringRadius - strokeWidth / 2);
  }

  const key = getActionKey(action, index);

  return (
    <circle
      key={`free-throw-${key}`}
      className="player-game-timeline__event"
      cx={x}
      cy={ROW_Y}
      r={ringRadius}
      fill="transparent"
      stroke={color}
      strokeWidth={strokeWidth}
    >
      <title>{getActionTitle(action, "free-throw")}</title>
    </circle>
  );
}

function inferPeriodCount(
  actions: NormalizedAction[],
  segments: NormalizedSegment[],
) {
  return Math.max(
    4,
    ...actions.map((action) => action.period),
    ...segments.map((segment) => segment.period),
  );
}

export function PlayerGameTimeline({
  actions = [],
  segments = [],
}: PlayerGameTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const normalizedActions = actions
    .map(normalizeAction)
    .filter((action): action is NormalizedAction => Boolean(action));
  const normalizedSegments = segments
    .map(normalizeSegment)
    .filter((segment): segment is NormalizedSegment => Boolean(segment));

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(element.getBoundingClientRect().width);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  if (!normalizedActions.length && !normalizedSegments.length) {
    return null;
  }

  const periodCount = inferPeriodCount(normalizedActions, normalizedSegments);
  const totalSeconds = getGameTotalSeconds(periodCount);
  const svgWidth = Math.max(320, Math.round(containerWidth));
  const chartWidth = svgWidth - CHART_LEFT - CHART_RIGHT;
  const getXForSeconds = (seconds: number) =>
    CHART_LEFT + (Math.max(0, Math.min(seconds, totalSeconds)) / totalSeconds) * chartWidth;
  const getXForClock = (period: number, clock: string) =>
    getXForSeconds(getSecondsElapsed(period, clock));
  const periods = Array.from({ length: periodCount }, (_, index) => index + 1);
  const renderableActions = normalizedActions.filter(isRenderableAction);
  const pointAtTime = new Set<string>();
  const freeThrowOneAtTime = new Set<string>();

  renderableActions.forEach((action) => {
    const timeKey = `${action.period}|${action.clock}`;

    if (isFreeThrowAction(action)) {
      if (isOneOfOneFreeThrow(action)) {
        freeThrowOneAtTime.add(timeKey);
      }
      return;
    }

    if (getEventType(action) === "point") {
      pointAtTime.add(timeKey);
    }
  });

  const and1AtTime = new Set(
    [...pointAtTime].filter((timeKey) => freeThrowOneAtTime.has(timeKey)),
  );

  return (
    <div
      ref={containerRef}
      className="mt-4 rounded-[14px] border border-border bg-card px-3 py-3"
    >
      <svg
        className="block h-[76px] w-full overflow-visible"
        viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
        role="img"
        aria-label="Player minutes timeline for this game"
        preserveAspectRatio="none"
      >
        {periods.map((period) => {
          const periodStart = getPeriodStartSeconds(period);
          const periodEnd = periodStart + getPeriodDurationSeconds(period);
          const x1 = getXForSeconds(periodStart);
          const x2 = getXForSeconds(periodEnd);
          const labelX = x1 + (x2 - x1) / 2;

          return (
            <g key={period}>
              <line
                x1={x1}
                y1={22}
                x2={x1}
                y2={58}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={labelX}
                y={13}
                fill="var(--muted)"
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
              >
                {formatPeriodLabel(period)}
              </text>
            </g>
          );
        })}

        <line
          x1={CHART_LEFT}
          y1={ROW_Y}
          x2={svgWidth - CHART_RIGHT}
          y2={ROW_Y}
          stroke="var(--border-strong)"
          strokeWidth={1}
        />

        {normalizedSegments.map((segment, index) => {
          const x1 = getXForClock(segment.period, segment.start);
          const x2 = getXForClock(segment.period, segment.end);

          return (
            <line
              key={`${segment.period}-${segment.start}-${segment.end}-${index}`}
              x1={x1}
              y1={ROW_Y}
              x2={x2}
              y2={ROW_Y}
              stroke="var(--line-color-light, var(--timeline-player-line, #334155))"
              strokeWidth={1.5}
            >
              <title>{`${formatPeriodLabel(segment.period)} ${formatClock(segment.start)} - ${formatClock(segment.end)}`}</title>
            </line>
          );
        })}

        {renderableActions.map((action, index) => {
          const x = getXForClock(action.period, action.clock);

          if (isFreeThrowAction(action)) {
            return renderFreeThrowMarker(action, x, index, pointAtTime);
          }

          const eventType = getEventType(action);
          if (!eventType) {
            return null;
          }

          return renderEventMarker(action, eventType, x, index, and1AtTime);
        })}

        <line
          x1={svgWidth - CHART_RIGHT}
          y1={22}
          x2={svgWidth - CHART_RIGHT}
          y2={58}
          stroke="var(--border)"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
