"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type TeamsDropdownProps = {
  teams: string[];
};

export function TeamsDropdown({ teams }: TeamsDropdownProps) {
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

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          closeMenu();
        }
      }}
    >
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-card px-4 py-2 text-copy transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
      >
        Teams
        <span
          className={`text-[10px] leading-none transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          v
        </span>
      </button>

      {isOpen ? (
        <div
          id={menuId}
          className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-[18px] border border-border-strong bg-card p-3 shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
          role="menu"
        >
          <Link
            href="/"
            role="menuitem"
            className="block rounded-[12px] px-3 py-2 font-medium text-heading transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={closeMenu}
          >
            All Teams
          </Link>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {teams.map((teamAbbr) => (
              <Link
                key={teamAbbr}
                href={`/teams/${teamAbbr}`}
                role="menuitem"
                className="rounded-[10px] px-3 py-2 text-center font-mono text-xs font-semibold text-copy transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                onClick={closeMenu}
              >
                {teamAbbr}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
