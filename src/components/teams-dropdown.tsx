"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { TeamLogo } from "@/components/team-logo";
import { getTeamInfo, TEAM_ABBREVIATIONS, type Conference } from "@/lib/teams";

const CONFERENCES: Conference[] = ["East", "West"];

export function TeamsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        className="pill"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
      >
        Teams
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen ? (
        <nav
          id={menuId}
          aria-label="Teams"
          className="absolute right-0 z-30 mt-2 grid w-[340px] max-w-[calc(100vw-2rem)] grid-cols-2 gap-x-2 rounded-2xl border border-border bg-tooltip p-2 shadow-[0_10px_30px_var(--tooltip-shadow)]"
        >
          {CONFERENCES.map((conference) => (
            <div key={conference}>
              <p className="eyebrow px-2 pb-1 pt-1.5">{conference}</p>
              {TEAM_ABBREVIATIONS.filter(
                (abbr) => getTeamInfo(abbr)?.conference === conference,
              ).map((abbr) => (
                <Link
                  key={abbr}
                  href={`/teams/${abbr}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] font-medium text-foreground transition-colors hover:bg-hover"
                  onClick={() => setIsOpen(false)}
                >
                  <TeamLogo team={abbr} size={18} />
                  <span className="truncate">{getTeamInfo(abbr)?.name}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
