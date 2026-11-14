"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { EventIcon, MarkerShape } from "@/components/chart/event-shapes";
import {
  describeAction,
  formatClock,
  formatPeriodLabel,
  getGameTotalSeconds,
  getPeriodDurationSeconds,
  getPeriodStartSeconds,
  type GameTimeline,
  type TimelineMarker,
} from "@/lib/timeline";

const ROW_HEIGHT = 28;
const ROW_MID = ROW_HEIGHT / 2;
// The rotation area runs from HEAT_BASE (no games) up to HEAT_TOP (every game).
const HEAT_BASE = ROW_HEIGHT - 3;
const HEAT_TOP = 3;
const MARKER_SIZE = 4;
const ACTIVE_MARKER_SIZE = 7;
// How far (px) the pointer may be from a play and still pick it.
const PICK_RADIUS = 14;
const REGULATION_PERIODS = 4;

export type ChartColumn = {
  key: string;
  label: string;
  // Kept on narrow screens; the rest are hidden there.
  primary?: boolean;
  // Tinted like the PTS/REB/AST columns of the main box score.
  highlight?: boolean;
};

export type ChartRow = {
  key: string;
  label: ReactNode;
  // Plain-text version of the label for screen readers.
  name: string;
  timeline: GameTimeline;
  // One entry per column.
  cells: ReactNode[];
  // Prefixes stripped from play descriptions ("J. Tatum").
  nameVariants: string[];
  // Lets the tooltip print the score at the time of a play.
  score?: { side: "home" | "away"; teamAbbr: string; opponentAbbr: string };
  // Content revealed when the row is opened.
  details?: ReactNode;
};

export type ChartSummary = {
  label: ReactNode;
  cells: ReactNode[];
  // Share of games (0-1) the player was on court in each bucket.
  heat: number[];
  // Games that reached each bucket's period: all games in regulation, only
  // the games that went that far in overtime.
  bucketGames: number[];
  bucketSeconds: number;
  games: number;
};

type ActivePlay = {
  // Elapsed seconds of the picked play; every play at that instant is shown.
  elapsed: number;
  pinned: boolean;
};

function percent(seconds: number, totalSeconds: number) {
  return `${((Math.max(0, Math.min(seconds, totalSeconds)) / totalSeconds) * 100).toFixed(3)}%`;
}

function PlayTooltip({
  markers,
  row,
  pinned,
  position,
}: {
  markers: TimelineMarker[];
  row: ChartRow;
  pinned: boolean;
  position: number;
}) {
  const first = markers[0].action;
  const last = markers[markers.length - 1].action;
  const score = row.score;
  const hasScore = score && last.awayScore !== null && last.homeScore !== null;
  const teamScore = score?.side === "home" ? last.homeScore : last.awayScore;
  const opponentScore = score?.side === "home" ? last.awayScore : last.homeScore;
  const align = position < 0.22 ? "start" : position > 0.78 ? "end" : "center";

  return (
    <div
      className={`mm-tooltip mm-tooltip--${align} ${pinned ? "mm-tooltip--pinned" : ""}`}
      style={{ left: `${(position * 100).toFixed(3)}%` }}
      role={pinned ? "dialog" : undefined}
      aria-label={pinned ? "Play details" : undefined}
    >
      <div className="flex items-baseline justify-between gap-4 text-[11px] text-muted">
        <span className="font-semibold text-heading">
          {formatPeriodLabel(first.period)} {formatClock(first.clock)}
        </span>
        {hasScore ? (
          <span className="tabular-nums">
            {score.teamAbbr} {teamScore} – {opponentScore} {score.opponentAbbr}
          </span>
        ) : null}
      </div>
      <ul className="mt-1 space-y-1">
        {markers.map((marker, index) => (
          <li key={index} className="flex items-center gap-1.5 text-[12px] text-foreground">
            <EventIcon
              eventType={marker.eventType}
              isThree={marker.isThree}
              freeThrow={marker.isFreeThrow}
              size={14}
            />
            <span className="min-w-0 flex-1">
              {describeAction(marker.action.description, row.nameVariants)}
            </span>
            {pinned && marker.videoUrl ? (
              <a
                href={marker.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-semibold text-link hover:underline"
              >
                Video ↗
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      {!pinned && markers.some((marker) => marker.videoUrl) ? (
        <p className="mm-tooltip__hint">Click to pin and get the video link</p>
      ) : null}
    </div>
  );
}

function SummaryRowView({
  summary,
  columns,
  totalSeconds,
}: {
  summary: ChartSummary;
  columns: ChartColumn[];
  totalSeconds: number;
}) {
  const [hover, setHover] = useState<{
    elapsed: number;
    share: number;
    games: number;
  } | null>(null);

  // Follow the pointer with no hover delay, unlike a native <title> tooltip.
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const svg = event.currentTarget.querySelector("svg");
    const rect = (svg ?? event.currentTarget).getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const elapsed = Math.min(Math.floor(fraction * totalSeconds), totalSeconds - 1);
    const bucket = Math.floor(elapsed / summary.bucketSeconds);
    setHover({
      elapsed,
      share: summary.heat[bucket] ?? 0,
      games: summary.bucketGames[bucket] ?? 0,
    });
  }

  return (
    <div className="mm-row mm-row--summary" role="row">
      <div className="mm-label" role="rowheader">
        {summary.label}
      </div>
      <div
        className="mm-track"
        role="cell"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          width="100%"
          height={ROW_HEIGHT}
          role="img"
          aria-label={`Share of ${summary.games} games on court at each point of the game, as an area chart`}
        >
          <svg
            x="0"
            y="0"
            width="100%"
            height={ROW_HEIGHT}
            viewBox={`0 0 ${totalSeconds} ${ROW_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              className="mm-heat-base"
              x1={0}
              x2={totalSeconds}
              y1={HEAT_BASE}
              y2={HEAT_BASE}
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="mm-heat-area"
              fill="currentColor"
              fillOpacity={0.35}
              d={heatPath(summary, totalSeconds, true)}
            />
            <path
              className="mm-heat-edge"
              fill="none"
              stroke="currentColor"
              d={heatPath(summary, totalSeconds, false)}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {hover ? (
            <line
              className="mm-heat-cursor"
              x1={percent(hover.elapsed, totalSeconds)}
              x2={percent(hover.elapsed, totalSeconds)}
              y1={HEAT_TOP - 2}
              y2={HEAT_BASE}
            />
          ) : null}
        </svg>
        {hover ? (
          <div
            className={`mm-tooltip mm-tooltip--${
              hover.elapsed / totalSeconds < 0.22
                ? "start"
                : hover.elapsed / totalSeconds > 0.78
                  ? "end"
                  : "center"
            }`}
            style={{ left: percent(hover.elapsed, totalSeconds) }}
          >
            <div className="text-[11px] font-semibold text-heading">
              {formatBucket(hover.elapsed)}
            </div>
            <div className="mt-0.5 text-[12px] text-foreground">
              On court in {Math.round(hover.share * 100)}% of {hover.games}{" "}
              {hover.games === 1 ? "game" : "games"}
            </div>
          </div>
        ) : null}
      </div>
      <div className="mm-cells">
        {summary.cells.map((cell, index) => (
          <span
            key={columns[index]?.key ?? index}
            role="cell"
            className={`mm-cell ${columns[index]?.primary ? "mm-cell--primary" : ""} ${
              columns[index]?.highlight ? "mm-cell--highlight" : ""
            }`}
          >
            {cell}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartRowView({
  row,
  columns,
  totalSeconds,
  statOn,
  isOpen,
  onToggle,
}: {
  row: ChartRow;
  columns: ChartColumn[];
  totalSeconds: number;
  statOn: boolean[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [active, setActive] = useState<ActivePlay | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // With overtime hidden, plays past the end of regulation are left out.
  const markers = row.timeline.markers.filter(
    (marker) =>
      statOn[marker.statIndex] !== false && marker.action.elapsed <= totalSeconds,
  );
  const isPinned = active?.pinned ?? false;

  useEffect(() => {
    if (!isPinned) {
      return;
    }

    function handlePointerDown(event: globalThis.PointerEvent) {
      if (!trackRef.current?.contains(event.target as Node)) {
        setActive(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPinned]);

  function pickPlay(clientX: number, element: HTMLElement) {
    const svg = element.querySelector("svg");
    const rect = (svg ?? element).getBoundingClientRect();
    if (rect.width <= 0) {
      return null;
    }

    let best: TimelineMarker | null = null;
    let bestDistance = PICK_RADIUS;

    for (const marker of markers) {
      const x = rect.left + (marker.action.elapsed / totalSeconds) * rect.width;
      const distance = Math.abs(x - clientX);
      if (distance <= bestDistance) {
        best = marker;
        bestDistance = distance;
      }
    }

    return best ? best.action.elapsed : null;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (isPinned || event.pointerType !== "mouse") {
      return;
    }

    const elapsed = pickPlay(event.clientX, event.currentTarget);
    setActive((current) => {
      if (elapsed === null) {
        return null;
      }
      return current?.elapsed === elapsed ? current : { elapsed, pinned: false };
    });
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) {
      return;
    }

    const elapsed = pickPlay(event.clientX, event.currentTarget);
    setActive((current) => {
      if (elapsed === null) {
        return null;
      }
      return current?.pinned && current.elapsed === elapsed
        ? null
        : { elapsed, pinned: true };
    });
  }

  const activeMarkers = active
    ? markers.filter((marker) => marker.action.elapsed === active.elapsed)
    : [];
  const hasDetails = row.details !== undefined;

  return (
    <div className={`mm-row-group ${isOpen ? "mm-row-group--open" : ""}`} role="row">
      <div className="mm-row">
        <div className="mm-label" role="rowheader">
          {hasDetails ? (
            <button
              type="button"
              className="mm-label__button"
              aria-expanded={isOpen}
              onClick={onToggle}
            >
              <span className="mm-chevron" aria-hidden="true" />
              {row.label}
            </button>
          ) : (
            row.label
          )}
        </div>
        <div
          ref={trackRef}
          className="mm-track"
          role="cell"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => {
            if (!isPinned) {
              setActive(null);
            }
          }}
          onClick={handleClick}
        >
          <svg
            width="100%"
            height={ROW_HEIGHT}
            role="img"
            aria-label={`Minutes and plays for ${row.name}`}
          >
            {row.timeline.segments
              .filter((segment) => segment.startElapsed < totalSeconds)
              .map((segment, index) => (
                <line
                  key={index}
                  className="mm-line"
                  x1={percent(segment.startElapsed, totalSeconds)}
                  x2={percent(segment.endElapsed, totalSeconds)}
                  y1={ROW_MID}
                  y2={ROW_MID}
                />
              ))}
            {markers.map((marker, index) => {
              const isActive = active?.elapsed === marker.action.elapsed;

              return (
                <svg
                  key={index}
                  x={percent(marker.action.elapsed, totalSeconds)}
                  y={ROW_MID}
                  width={1}
                  height={1}
                  overflow="visible"
                  className={`mm-marker ${isActive ? "mm-marker--active" : ""}`}
                  data-stat={marker.statIndex}
                >
                  <MarkerShape
                    marker={marker}
                    size={isActive ? ACTIVE_MARKER_SIZE : MARKER_SIZE}
                  />
                </svg>
              );
            })}
          </svg>
          {activeMarkers.length ? (
            <PlayTooltip
              markers={activeMarkers}
              row={row}
              pinned={isPinned}
              position={activeMarkers[0].action.elapsed / totalSeconds}
            />
          ) : null}
        </div>
        <div
          className="mm-cells"
          onClick={hasDetails ? onToggle : undefined}
          style={hasDetails ? { cursor: "pointer" } : undefined}
        >
          {row.cells.map((cell, index) => (
            <span
              key={columns[index]?.key ?? index}
              role="cell"
              className={`mm-cell ${columns[index]?.primary ? "mm-cell--primary" : ""} ${
                columns[index]?.highlight ? "mm-cell--highlight" : ""
              }`}
            >
              {cell}
            </span>
          ))}
        </div>
      </div>
      {isOpen && hasDetails ? <div className="mm-details">{row.details}</div> : null}
    </div>
  );
}

// The MinutesMap chart: one row per game (or per player), a line while the
// player is on court and a symbol for every play, on a shared game clock.
export function MinutesChart({
  rows,
  columns,
  statOn,
  emphasized = null,
  labelHeader,
  summary,
  ariaLabel,
  defaultOpenKey = null,
  minPeriods = 4,
  compactLabels = false,
  collapsibleOvertime = false,
}: {
  rows: ChartRow[];
  columns: ChartColumn[];
  statOn: boolean[];
  emphasized?: number | null;
  labelHeader: string;
  summary?: ChartSummary;
  ariaLabel: string;
  defaultOpenKey?: string | null;
  minPeriods?: number;
  // A narrower label column on wide screens, for short labels.
  compactLabels?: boolean;
  // Rows from different games: when only some went to overtime, show
  // regulation by default so the rest are not squeezed.
  collapsibleOvertime?: boolean;
}) {
  const [openKeys, setOpenKeys] = useState<ReadonlySet<string>>(
    () => new Set(defaultOpenKey ? [defaultOpenKey] : []),
  );
  const [showOvertime, setShowOvertime] = useState(false);
  const fullPeriodCount = Math.max(
    minPeriods,
    ...rows.map((row) => row.timeline.periodCount),
  );
  const overtimeRows = rows.filter(
    (row) => row.timeline.periodCount > REGULATION_PERIODS,
  ).length;
  const canCollapseOvertime =
    collapsibleOvertime && overtimeRows > 0 && overtimeRows < rows.length;
  const periodCount =
    canCollapseOvertime && !showOvertime ? REGULATION_PERIODS : fullPeriodCount;
  const totalSeconds = getGameTotalSeconds(periodCount);
  const periods = Array.from({ length: periodCount }, (_, index) => index + 1);
  const primaryCount = columns.filter((column) => column.primary).length;
  const style = {
    "--mm-n": columns.length,
    "--mm-n-sm": primaryCount,
  } as CSSProperties;

  function toggleRow(key: string) {
    setOpenKeys((current) => {
      const next = new Set(current);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <>
      {canCollapseOvertime ? (
        <div className="mb-1.5 flex justify-end">
          <button
            type="button"
            aria-pressed={showOvertime}
            onClick={() => setShowOvertime((current) => !current)}
            className="border-0 bg-transparent p-0 text-xs font-semibold text-link hover:underline"
          >
            {showOvertime
              ? "Hide overtime"
              : `Show overtime (${overtimeRows} ${overtimeRows === 1 ? "row" : "rows"})`}
          </button>
        </div>
      ) : null}
      <div
        className="mm-chart"
        style={style}
        role="table"
        aria-label={ariaLabel}
        data-emph={emphasized ?? undefined}
        data-label={compactLabels ? "compact" : undefined}
      >
        <div className="mm-grid" aria-hidden="true">
          {periods.map((period) => (
            <span
              key={period}
              className="mm-grid__line"
              style={{ left: percent(getPeriodStartSeconds(period), totalSeconds) }}
            />
          ))}
          <span className="mm-grid__line" style={{ left: "100%" }} />
        </div>

        <div className="mm-row mm-row--header" role="row">
          <div className="mm-label mm-header-text" role="columnheader">
            {labelHeader}
          </div>
          <div className="mm-track" role="columnheader" aria-label="Game clock">
            {periods.map((period) => (
              <span
                key={period}
                className="mm-period"
                style={{
                  left: percent(
                    getPeriodStartSeconds(period) + getPeriodDurationSeconds(period) / 2,
                    totalSeconds,
                  ),
                }}
              >
                {formatPeriodLabel(period)}
              </span>
            ))}
          </div>
          <div className="mm-cells">
            {columns.map((column) => (
              <span
                key={column.key}
                role="columnheader"
                className={`mm-cell mm-header-text ${column.primary ? "mm-cell--primary" : ""} ${
                  column.highlight ? "mm-cell--highlight" : ""
                }`}
              >
                {column.label}
              </span>
            ))}
          </div>
        </div>

        {summary ? (
          <SummaryRowView summary={summary} columns={columns} totalSeconds={totalSeconds} />
        ) : null}

        {rows.map((row) => (
          <ChartRowView
            key={row.key}
            row={row}
            columns={columns}
            totalSeconds={totalSeconds}
            statOn={statOn}
            isOpen={openKeys.has(row.key)}
            onToggle={() => toggleRow(row.key)}
          />
        ))}
      </div>
    </>
  );
}

// "Q2 7:30" for a number of seconds since tip-off.
function formatBucket(elapsed: number) {
  let period = 1;
  while (elapsed >= getPeriodStartSeconds(period) + getPeriodDurationSeconds(period)) {
    period += 1;
  }

  const remaining =
    getPeriodDurationSeconds(period) - (elapsed - getPeriodStartSeconds(period));
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.round(remaining % 60);

  return `${formatPeriodLabel(period)} ${minutes}:${String(seconds).padStart(2, "0")}`;
}

// SVG path (in seconds by pixels) through the bucket centres; closed down to
// the baseline for the fill, open for the top edge.
function heatPath(summary: ChartSummary, totalSeconds: number, closed: boolean) {
  const { heat, bucketSeconds } = summary;
  const points: string[] = [];
  const y = (share: number) => (HEAT_BASE - share * (HEAT_BASE - HEAT_TOP)).toFixed(2);

  for (let index = 0; index < heat.length; index += 1) {
    const start = index * bucketSeconds;
    if (start >= totalSeconds) {
      break;
    }
    if (index === 0) {
      points.push(`0,${y(heat[0])}`);
    }
    points.push(`${Math.min(start + bucketSeconds / 2, totalSeconds)},${y(heat[index])}`);
  }

  const last = heat[Math.min(heat.length, Math.ceil(totalSeconds / bucketSeconds)) - 1] ?? 0;
  points.push(`${totalSeconds},${y(last)}`);

  const line = `M${points.join("L")}`;
  return closed ? `${line}L${totalSeconds},${HEAT_BASE}L0,${HEAT_BASE}Z` : line;
}

// Share of games on court per time bucket, for the summary row. Uses exact
// on-court time per bucket, lightly smoothed within each period.
export function buildRotationHeat(
  timelines: GameTimeline[],
  periodCount: number,
  bucketSeconds = 15,
  smoothBuckets = 1,
) {
  const totalSeconds = getGameTotalSeconds(periodCount);
  const bucketCount = Math.ceil(totalSeconds / bucketSeconds);
  const covered = new Array<number>(bucketCount).fill(0);
  const played = timelines.filter((timeline) => timeline.segments.length > 0);

  for (const timeline of played) {
    for (const segment of timeline.segments) {
      const first = Math.max(0, Math.floor(segment.startElapsed / bucketSeconds));
      const last = Math.min(bucketCount - 1, Math.ceil(segment.endElapsed / bucketSeconds) - 1);

      for (let bucket = first; bucket <= last; bucket += 1) {
        const bucketStart = bucket * bucketSeconds;
        const overlap =
          Math.min(segment.endElapsed, bucketStart + bucketSeconds) -
          Math.max(segment.startElapsed, bucketStart);
        if (overlap > 0) {
          covered[bucket] += overlap / bucketSeconds;
        }
      }
    }
  }

  const periods = covered.map((_, bucket) => {
    let period = 1;
    while (
      bucket * bucketSeconds >=
      getPeriodStartSeconds(period) + getPeriodDurationSeconds(period)
    ) {
      period += 1;
    }
    return period;
  });
  const bucketGames = periods.map(
    (period) => played.filter((timeline) => timeline.periodCount >= period).length,
  );
  const raw = covered.map((value, bucket) =>
    bucketGames[bucket] ? Math.min(1, value / bucketGames[bucket]) : 0,
  );
  const heat = raw.map((_, bucket) => {
    let sum = 0;
    let count = 0;
    for (let offset = -smoothBuckets; offset <= smoothBuckets; offset += 1) {
      const other = bucket + offset;
      if (other >= 0 && other < bucketCount && periods[other] === periods[bucket]) {
        sum += raw[other];
        count += 1;
      }
    }
    return count ? sum / count : 0;
  });

  return { heat, bucketGames, bucketSeconds, games: played.length };
}
