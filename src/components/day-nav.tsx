"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { formatPickerDate } from "@/lib/format";

type DayNavProps = {
  date: string;
  // Every date in the season with results, oldest first.
  dates: string[];
};

// Material icon paths, as the main site's MUI icons draw them.
const ICON_PATHS = {
  prev: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  next: "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  calendar:
    "M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 18H4V10h16zm0-13H4V5h16z",
};

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

// The main site's schedule date picker: arrows either side of the date, with
// the native date input laid invisibly over it. Arrows step between game
// days; a picked date lands on the nearest game day on or before it.
export function DayNav({ date, dates }: DayNavProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const index = dates.indexOf(date);
  const prev = index > 0 ? dates[index - 1] : null;
  const next = index >= 0 && index < dates.length - 1 ? dates[index + 1] : null;

  // Open the calendar from anywhere on the field, not only its own icon.
  function openPicker() {
    try {
      inputRef.current?.showPicker?.();
    } catch {
      // Unsupported or blocked; the focused input still accepts typed dates.
    }
  }

  function pick(value: string) {
    if (!value || !dates.length) {
      return;
    }

    const target =
      [...dates].reverse().find((candidate) => candidate <= value) ?? dates[0];
    if (target !== date) {
      router.push(`/days/${target}`);
    }
  }

  return (
    <div className="date-pick">
      <StepButton href={prev ? `/days/${prev}` : null} direction="prev" />
      <div className="date-field">
        <span aria-hidden="true">{formatPickerDate(date)}</span>
        <Icon path={ICON_PATHS.calendar} className="date-field__icon" size={15} />
        <input
          ref={inputRef}
          type="date"
          aria-label="Select game date"
          className="date-field__input"
          value={date}
          min={dates[0]}
          max={dates[dates.length - 1]}
          onChange={(event) => pick(event.target.value)}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
        />
      </div>
      <StepButton href={next ? `/days/${next}` : null} direction="next" />
    </div>
  );
}
