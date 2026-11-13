"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { TeamLogo } from "@/components/team-logo";
import type { LeaguePlayer } from "@/lib/league-data";
import { getTeamFullName, TEAM_ABBREVIATIONS } from "@/lib/teams";

const MAX_RESULTS = 8;

type Result = {
  key: string;
  href: string;
  label: string;
  teamAbbr: string;
  hint: string;
};

// Lowercase, accents removed: "Dončić" matches "doncic".
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const TEAM_RESULTS: Array<Result & { search: string }> = TEAM_ABBREVIATIONS.map(
  (abbr) => ({
    key: `team-${abbr}`,
    href: `/teams/${abbr}`,
    label: getTeamFullName(abbr),
    teamAbbr: abbr,
    hint: "Team",
    search: normalize(`${getTeamFullName(abbr)} ${abbr}`),
  }),
);

function rank(search: string, query: string) {
  if (search.startsWith(query)) {
    return 0;
  }

  return search.split(/[\s-]+/).some((word) => word.startsWith(query)) ? 1 : 2;
}

function findResults(query: string, players: LeaguePlayer[]): Result[] {
  const normalized = normalize(query);
  if (!normalized) {
    return [];
  }

  const candidates = [
    ...TEAM_RESULTS,
    ...players.map((player) => ({
      key: `player-${player.id}`,
      href: `/players/${player.id}`,
      label: player.name,
      teamAbbr: player.teamAbbr,
      hint: player.teamAbbr,
      search: normalize(player.name),
    })),
  ];

  return candidates
    .filter((candidate) => candidate.search.includes(normalized))
    .sort(
      (left, right) =>
        rank(left.search, normalized) - rank(right.search, normalized),
    )
    .slice(0, MAX_RESULTS);
}

// Jump to any team or player. The player directory is fetched the first time
// the box is focused, so pages that never search never pay for it.
export function SiteSearch() {
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requested = useRef(false);
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<LeaguePlayer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const results = findResults(query, players);
  const showList = isOpen && query.trim().length > 0;

  function loadPlayers() {
    if (requested.current) {
      return;
    }

    requested.current = true;
    fetch("/api/search")
      .then((response) => (response.ok ? response.json() : { players: [] }))
      .then((data: { players?: LeaguePlayer[] }) => setPlayers(data.players ?? []))
      .catch(() => {
        requested.current = false;
      });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function go(result: Result) {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(result.href);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Search teams and players"
        placeholder="Search teams and players"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onFocus={() => {
          loadPlayers();
          setIsOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => Math.min(current + 1, results.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter" && results[activeIndex]) {
            event.preventDefault();
            go(results[activeIndex]);
          } else if (event.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
          }
        }}
        className="h-[30px] w-full rounded-full border border-border-strong bg-card px-3 text-[13px] text-foreground placeholder:text-muted"
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-full min-w-[260px] overflow-hidden rounded-2xl border border-border bg-tooltip p-1.5 shadow-[0_10px_30px_var(--tooltip-shadow)]"
        >
          {results.length ? (
            results.map((result, index) => (
              <li
                key={result.key}
                role="option"
                aria-selected={index === activeIndex}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => go(result)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm ${
                  index === activeIndex ? "bg-hover" : ""
                }`}
              >
                <TeamLogo team={result.teamAbbr} size={20} />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {result.label}
                </span>
                <span className="shrink-0 text-xs text-muted">{result.hint}</span>
              </li>
            ))
          ) : (
            <li className="px-2.5 py-2 text-sm text-muted">
              No team or player matches “{query.trim()}”.
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
