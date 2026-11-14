"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type DayNavProps = {
  date: string;
  // Every date in the season with results, oldest first.
  dates: string[];
};

function Arrow({ href, label, direction }: {
  href: string | null;
  label: string;
  direction: "prev" | "next";
}) {
  const icon = (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d={direction === "prev" ? "M6.5 2 3.5 5l3 3" : "M3.5 2l3 3-3 3"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return href ? (
    <Link href={href} className="pill" aria-label={label} title={label}>
      {icon}
    </Link>
  ) : (
    <span className="pill opacity-40" aria-hidden="true">
      {icon}
    </span>
  );
}

// Steps between game days; the picker lands on the nearest day with games.
export function DayNav({ date, dates }: DayNavProps) {
  const router = useRouter();
  const index = dates.indexOf(date);
  const prev = index > 0 ? dates[index - 1] : null;
  const next = index >= 0 && index < dates.length - 1 ? dates[index + 1] : null;

  function pick(value: string) {
    if (!value || !dates.length) {
      return;
    }

    // The latest game day on or before the pick, else the first one after it.
    const target =
      [...dates].reverse().find((candidate) => candidate <= value) ?? dates[0];
    if (target !== date) {
      router.push(`/days/${target}`);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Arrow href={prev ? `/days/${prev}` : null} label="Previous game day" direction="prev" />
      <input
        type="date"
        aria-label="Go to a date"
        className="pill tabular-nums"
        value={date}
        min={dates[0]}
        max={dates[dates.length - 1]}
        onChange={(event) => pick(event.target.value)}
      />
      <Arrow href={next ? `/days/${next}` : null} label="Next game day" direction="next" />
    </div>
  );
}
