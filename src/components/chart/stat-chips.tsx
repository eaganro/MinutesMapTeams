"use client";

import { useState, type ReactNode } from "react";
import { EventIcon } from "@/components/chart/event-shapes";
import { EVENT_TYPES, type EventType } from "@/lib/timeline";

export type StatToggles = {
  statOn: boolean[];
  // Index of the stat whose chip is hovered, or null.
  emphasized: number | null;
  toggle: (index: number) => void;
  setEmphasized: (index: number | null) => void;
};

export function useStatToggles(): StatToggles {
  const [statOn, setStatOn] = useState(() => EVENT_TYPES.map(() => true));
  const [emphasized, setEmphasized] = useState<number | null>(null);

  return {
    statOn,
    emphasized,
    setEmphasized,
    toggle: (index) =>
      setStatOn((current) =>
        current.map((isOn, currentIndex) =>
          currentIndex === index ? !isOn : isOn,
        ),
      ),
  };
}

const CHIPS: Array<{ eventType: EventType; content: ReactNode; name: string }> = [
  {
    eventType: "point",
    name: "made shots",
    content: (
      <>
        <EventIcon eventType="point" /> 2PT
        <EventIcon eventType="point" isThree /> 3PT
        <EventIcon eventType="point" freeThrow /> FT
      </>
    ),
  },
  {
    eventType: "miss",
    name: "missed shots",
    content: (
      <>
        <EventIcon eventType="miss" /> Miss
        <EventIcon eventType="miss" isThree /> 3PT
        <EventIcon eventType="miss" freeThrow /> FT
      </>
    ),
  },
  {
    eventType: "rebound",
    name: "rebounds",
    content: (
      <>
        <EventIcon eventType="rebound" /> Rebound
      </>
    ),
  },
  {
    eventType: "assist",
    name: "assists",
    content: (
      <>
        <EventIcon eventType="assist" /> Assist
      </>
    ),
  },
  {
    eventType: "turnover",
    name: "turnovers",
    content: (
      <>
        <EventIcon eventType="turnover" /> Turnover
      </>
    ),
  },
  {
    eventType: "block",
    name: "blocks",
    content: (
      <>
        <EventIcon eventType="block" /> Block
      </>
    ),
  },
  {
    eventType: "steal",
    name: "steals",
    content: (
      <>
        <EventIcon eventType="steal" /> Steal
      </>
    ),
  },
  {
    eventType: "foul",
    name: "fouls",
    content: (
      <>
        <EventIcon eventType="foul" /> Foul
      </>
    ),
  },
];

// The chart legend. Each chip doubles as a filter (click) and a spotlight
// (hover), like the stat buttons under the main MinutesMap chart.
export function StatChips({ toggles }: { toggles: StatToggles }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5"
      role="group"
      aria-label="Show or hide play types"
    >
      {CHIPS.map((chip) => {
        const index = EVENT_TYPES.indexOf(chip.eventType);
        const isOn = toggles.statOn[index];

        return (
          <button
            key={chip.eventType}
            type="button"
            aria-pressed={isOn}
            aria-label={`${isOn ? "Hide" : "Show"} ${chip.name}`}
            onClick={() => toggles.toggle(index)}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse" && isOn) {
                toggles.setEmphasized(index);
              }
            }}
            onPointerLeave={() => toggles.setEmphasized(null)}
            className={`stat-chip ${isOn ? "" : "stat-chip--off"}`}
          >
            {chip.content}
          </button>
        );
      })}
    </div>
  );
}
