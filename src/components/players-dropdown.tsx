"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type PlayerOption = {
  id: number;
  name: string;
};

type TeamPlayersResponse = {
  players: PlayerOption[];
};

type PlayersDropdownProps = {
  teams: string[];
};

function getSelectedTeam(pathname: string, teams: string[]) {
  const match = /^\/teams\/([^/]+)/.exec(pathname);
  const teamSlug = match?.[1]?.toUpperCase();

  return teamSlug && teams.includes(teamSlug) ? teamSlug : null;
}

export function PlayersDropdown({ teams }: PlayersDropdownProps) {
  const pathname = usePathname();
  const selectedTeam = useMemo(
    () => getSelectedTeam(pathname, teams),
    [pathname, teams],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [playerState, setPlayerState] = useState<{
    team: string;
    players: PlayerOption[];
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const players =
    playerState?.team === selectedTeam ? playerState.players : null;
  const isDisabled = !selectedTeam;

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

  useEffect(() => {
    if (!isOpen || !selectedTeam || playerState?.team === selectedTeam) {
      return;
    }

    const abortController = new AbortController();

    fetch(`/api/teams/${selectedTeam}/players`, {
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load players");
        }

        return response.json() as Promise<TeamPlayersResponse>;
      })
      .then((data) => {
        setPlayerState({
          team: selectedTeam,
          players: data.players,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setPlayerState({
          team: selectedTeam,
          players: [],
        });
      });

    return () => {
      abortController.abort();
    };
  }, [isOpen, playerState?.team, selectedTeam]);

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
        className="flex cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-card px-4 py-2 text-copy transition-colors hover:bg-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-card disabled:hover:text-copy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        disabled={isDisabled}
        onClick={() => setIsOpen((current) => !current)}
        title={isDisabled ? "Select a team first" : undefined}
      >
        Players
        <span
          className={`text-[10px] leading-none transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          v
        </span>
      </button>

      {isOpen && selectedTeam ? (
        <div
          id={menuId}
          className="absolute right-0 z-20 mt-2 max-h-96 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-[18px] border border-border-strong bg-card p-3 shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
          role="menu"
        >
          <p className="px-3 pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            {selectedTeam} players
          </p>

          {players === null ? (
            <p className="rounded-[12px] px-3 py-2 text-sm text-muted">
              Loading players...
            </p>
          ) : players.length ? (
            <div className="grid gap-1">
              {players.map((player) => (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  role="menuitem"
                  className="rounded-[10px] px-3 py-2 text-sm font-medium text-copy transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  onClick={closeMenu}
                >
                  {player.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-[12px] px-3 py-2 text-sm text-muted">
              No players found.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
