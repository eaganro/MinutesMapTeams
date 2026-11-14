"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatPickerDate } from "@/lib/format";

type DayNavProps = {
  date: string;
  // Every date with results, across seasons, oldest first.
  dates: string[];
};

// Material icon paths, as the main site's MUI icons draw them.
const ICON_PATHS = {
  prev: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  next: "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  calendar:
    "M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 18H4V10h16zm0-13H4V5h16z",
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function Icon({ path, className, size = 24 }: { path: string; className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d={path} />
    </svg>
  );
}

function StepButton({ href, direction }: { href: string | null; direction: "prev" | "next" }) {
  const label = direction === "prev" ? "Previous game day" : "Next game day";
  const icon = <Icon path={ICON_PATHS[direction]} />;

  return href ? (
    <Link href={href} className="date-pick__button" aria-label={label} title={label}>
      {icon}
    </Link>
  ) : (
    <span className="date-pick__button date-pick__button--disabled" aria-hidden="true">
      {icon}
    </span>
  );
}

// Months are "YYYY-MM"; dates "YYYY-MM-DD".
function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthIndex - 1 + offset, 1));
  return shifted.toISOString().slice(0, 7);
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
}

// The month's days laid out by week, with nulls before the 1st.
function getMonthCells(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const leading = new Date(Date.UTC(year, monthIndex - 1, 1)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();

  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from(
      { length: dayCount },
      (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
    ),
  ];
}

function Calendar({
  id,
  date,
  dates,
  onPick,
  onClose,
}: {
  id: string;
  date: string;
  dates: string[];
  onPick: (date: string) => void;
  onClose: () => void;
}) {
  // Changing month only moves the calendar; nothing loads until a day is picked.
  const [month, setMonth] = useState(date.slice(0, 7));
  const gameDates = new Set(dates);
  const firstMonth = dates[0]?.slice(0, 7) ?? month;
  const lastMonth = dates[dates.length - 1]?.slice(0, 7) ?? month;
  const cells = getMonthCells(month);

  return (
    <div
      id={id}
      className="day-calendar"
      role="dialog"
      aria-label="Choose a game day"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="day-calendar__header">
        <button
          type="button"
          className="day-calendar__nav"
          aria-label="Previous month"
          disabled={month <= firstMonth}
          onClick={() => setMonth((current) => shiftMonth(current, -1))}
        >
          <Icon path={ICON_PATHS.prev} size={20} />
        </button>
        <span className="day-calendar__month" aria-live="polite">
          {formatMonth(month)}
        </span>
        <button
          type="button"
          className="day-calendar__nav"
          aria-label="Next month"
          disabled={month >= lastMonth}
          onClick={() => setMonth((current) => shiftMonth(current, 1))}
        >
          <Icon path={ICON_PATHS.next} size={20} />
        </button>
      </div>
      <div className="day-calendar__grid">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="day-calendar__weekday" aria-hidden="true">
            {weekday}
          </span>
        ))}
        {cells.map((cell, index) =>
          cell ? (
            <button
              key={cell}
              type="button"
              className={`day-calendar__day ${cell === date ? "day-calendar__day--selected" : ""}`}
              disabled={!gameDates.has(cell)}
              aria-current={cell === date ? "date" : undefined}
              aria-label={formatPickerDate(cell)}
              onClick={() => onPick(cell)}
            >
              {Number(cell.slice(8))}
            </button>
          ) : (
            <span key={`blank-${index}`} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  );
}

// The main site's schedule date picker (arrows either side of the date
// field), with our own calendar so browsing months loads nothing and only
// days with games can be picked. Arrows step between game days.
export function DayNav({ date, dates }: DayNavProps) {
  const router = useRouter();
  const calendarId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const index = dates.indexOf(date);
  const prev = index > 0 ? dates[index - 1] : null;
  const next = index >= 0 && index < dates.length - 1 ? dates[index + 1] : null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function pick(value: string) {
    setIsOpen(false);
    if (value !== date) {
      router.push(`/days/${value}`);
    }
  }

  return (
    <div className="date-pick">
      <StepButton href={prev ? `/days/${prev}` : null} direction="prev" />
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          className="date-field"
          aria-label={`Select game date, now ${formatPickerDate(date)}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? calendarId : undefined}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span aria-hidden="true">{formatPickerDate(date)}</span>
          <Icon path={ICON_PATHS.calendar} className="date-field__icon" size={15} />
        </button>
        {isOpen ? (
          <Calendar
            id={calendarId}
            date={date}
            dates={dates}
            onPick={pick}
            onClose={close}
          />
        ) : null}
      </div>
      <StepButton href={next ? `/days/${next}` : null} direction="next" />
    </div>
  );
}
