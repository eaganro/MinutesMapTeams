import type { ReactNode } from "react";
import type { EventType, TimelineMarker } from "@/lib/timeline";

const EVENT_COLORS: Record<EventType, string> = {
  point: "var(--event-point)",
  miss: "var(--event-miss)",
  rebound: "var(--event-rebound)",
  assist: "var(--event-assist)",
  turnover: "var(--event-turnover)",
  block: "var(--event-block)",
  steal: "var(--event-steal)",
  foul: "var(--event-foul)",
};

// The event symbols of the main MinutesMap chart, drawn around the origin so
// the caller can place them with a transform or a nested <svg x="…%">.
export function EventShape({
  eventType,
  size,
  isThree = false,
  threeScale = 0.6,
}: {
  eventType: EventType;
  size: number;
  isThree?: boolean;
  threeScale?: number;
}) {
  const s = size;
  const fill = EVENT_COLORS[eventType];
  let shape: ReactNode;

  switch (eventType) {
    case "point":
      shape = <circle r={s} fill={fill} />;
      break;
    case "miss": {
      const t = s * 0.35;
      shape = (
        <path
          d={`M ${-s} ${-s + t} L ${-t} 0 L ${-s} ${s - t} L ${-s + t} ${s} L 0 ${t} L ${s - t} ${s} L ${s} ${s - t} L ${t} 0 L ${s} ${-s + t} L ${s - t} ${-s} L 0 ${-t} L ${-s + t} ${-s} Z`}
          fill={fill}
        />
      );
      break;
    }
    case "rebound":
      shape = <polygon points={`0,${-s} ${s},0 0,${s} ${-s},0`} fill={fill} />;
      break;
    case "assist":
      shape = (
        <polygon points={`${-s * 0.6},${-s} ${s},0 ${-s * 0.6},${s}`} fill={fill} />
      );
      break;
    case "turnover":
      shape = (
        <polygon points={`0,${s} ${-s},${-s * 0.7} ${s},${-s * 0.7}`} fill={fill} />
      );
      break;
    case "block":
      shape = (
        <rect x={-s * 0.8} y={-s * 0.8} width={s * 1.6} height={s * 1.6} fill={fill} />
      );
      break;
    case "steal":
      shape = (
        <polygon points={`0,${-s} ${-s},${s * 0.7} ${s},${s * 0.7}`} fill={fill} />
      );
      break;
    default: {
      const points = Array.from({ length: 6 }, (_, index) => {
        const angle = (index * 60 - 90) * (Math.PI / 180);
        return `${(s * Math.cos(angle)).toFixed(2)},${(s * Math.sin(angle)).toFixed(2)}`;
      }).join(" ");
      shape = <polygon points={points} fill={fill} />;
    }
  }

  if (!isThree) {
    return shape;
  }

  return (
    <>
      {shape}
      <circle r={s * threeScale} fill="var(--event-3pt-marker)" />
    </>
  );
}

export function FreeThrowRing({
  size,
  ringRatio,
  isMiss,
}: {
  size: number;
  ringRatio: number;
  isMiss: boolean;
}) {
  return (
    <circle
      r={size * ringRatio}
      fill="none"
      stroke={isMiss ? EVENT_COLORS.miss : EVENT_COLORS.point}
      strokeWidth={Math.max(1, size * 0.2)}
    />
  );
}

// One play-by-play marker, drawn around the origin.
export function MarkerShape({
  marker,
  size,
}: {
  marker: TimelineMarker;
  size: number;
}) {
  if (marker.isFreeThrow) {
    return (
      <FreeThrowRing
        size={size}
        ringRatio={marker.ringRatio}
        isMiss={marker.eventType === "miss"}
      />
    );
  }

  return (
    <EventShape
      eventType={marker.eventType}
      size={marker.isAnd1Point ? size * 0.88 : size}
      isThree={marker.isThree}
      threeScale={marker.isAnd1Point ? 0.5 : 0.6}
    />
  );
}

// A symbol on its own, for legends and tooltips.
export function EventIcon({
  eventType,
  isThree = false,
  freeThrow = false,
  size = 16,
}: {
  eventType: EventType;
  isThree?: boolean;
  freeThrow?: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-8 -8 16 16"
      aria-hidden="true"
      className="shrink-0"
    >
      {freeThrow ? (
        <FreeThrowRing size={5} ringRatio={0.8} isMiss={eventType === "miss"} />
      ) : (
        <EventShape eventType={eventType} size={5.5} isThree={isThree} />
      )}
    </svg>
  );
}
