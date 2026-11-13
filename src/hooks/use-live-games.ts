"use client";

import { useEffect, useState } from "react";
import {
  isFinalGamepack,
  isLiveGame,
  type Gamepack,
  type TeamStatus,
} from "@/lib/live";
import type { TeamGame } from "@/lib/team-data";

const POLL_INTERVAL_MS = 30_000;

async function fetchJson<T>(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

export type LiveTeamGame = {
  teamAbbr: string;
  game: TeamGame;
};

// Live-game discovery for a page. Team status is read once per team on load;
// only if it reports a live game are gamepacks polled, and polling stops once
// every polled gamepack is final. `onlyGameId` narrows polling to one game
// once the caller knows which one matters.
export function useLiveGames({
  teamAbbrs,
  enabled,
  onlyGameId,
}: {
  teamAbbrs: string[];
  enabled: boolean;
  onlyGameId?: string | null;
}) {
  const [statuses, setStatuses] = useState<Record<string, TeamStatus>>({});
  const [gamepacks, setGamepacks] = useState<Record<string, Gamepack>>({});
  const statusKey = enabled ? teamAbbrs.join("|") : "";

  useEffect(() => {
    const abbrs = statusKey ? statusKey.split("|") : [];
    if (!abbrs.length) {
      return;
    }

    let cancelled = false;

    Promise.all(
      abbrs.map(async (teamAbbr) => {
        const status = await fetchJson<TeamStatus>(
          `/api/team-status/${encodeURIComponent(teamAbbr)}`,
        );
        return status ? ([teamAbbr, status] as const) : null;
      }),
    ).then((entries) => {
      if (!cancelled) {
        setStatuses(Object.fromEntries(entries.filter((entry) => entry !== null)));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [statusKey]);

  const liveGames: LiveTeamGame[] = Object.entries(statuses).flatMap(
    ([teamAbbr, status]) => {
      const game = status.currentGame;
      return game && isLiveGame(game) && (!onlyGameId || game.gameId === onlyGameId)
        ? [{ teamAbbr, game }]
        : [];
    },
  );
  const gameKey = [...new Set(liveGames.map(({ game }) => game.gameId))].join("|");

  useEffect(() => {
    const gameIds = gameKey ? gameKey.split("|") : [];
    if (!gameIds.length) {
      return;
    }

    let cancelled = false;

    async function load() {
      const entries = await Promise.all(
        gameIds.map(async (gameId) => {
          const gamepack = await fetchJson<Gamepack>(
            `/api/live-games/${encodeURIComponent(gameId)}`,
          );
          return gamepack ? ([gameId, gamepack] as const) : null;
        }),
      );

      if (cancelled) {
        return;
      }

      const loaded = Object.fromEntries(entries.filter((entry) => entry !== null));
      setGamepacks((current) => ({ ...current, ...loaded }));

      const packs = Object.values(loaded);
      if (
        packs.length === gameIds.length &&
        packs.every((gamepack) => isFinalGamepack(gamepack))
      ) {
        window.clearInterval(intervalId);
      }
    }

    load();
    const intervalId = window.setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [gameKey]);

  return { liveGames, gamepacks };
}

const finalGamepackCache = new Map<string, Gamepack>();

type GamepackState =
  | { gameId: string; status: "ready"; gamepack: Gamepack }
  | { gameId: string; status: "error" };

// Loads one finished game's gamepack on demand (when a game row is opened).
// Finished gamepacks never change, so they are kept for the page's lifetime.
export function useGamepack(gameId: string | null) {
  const [state, setState] = useState<GamepackState | null>(null);
  const cached = gameId ? finalGamepackCache.get(gameId) : undefined;

  useEffect(() => {
    if (!gameId || finalGamepackCache.has(gameId)) {
      return;
    }

    let cancelled = false;

    fetchJson<Gamepack>(`/api/live-games/${encodeURIComponent(gameId)}`).then(
      (gamepack) => {
        if (gamepack) {
          finalGamepackCache.set(gameId, gamepack);
        }
        if (!cancelled) {
          setState(
            gamepack
              ? { gameId, status: "ready", gamepack }
              : { gameId, status: "error" },
          );
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (cached) {
    return { gamepack: cached, status: "ready" as const };
  }

  if (state && state.gameId === gameId) {
    return state.status === "ready"
      ? { gamepack: state.gamepack, status: "ready" as const }
      : { gamepack: undefined, status: "error" as const };
  }

  return { gamepack: undefined, status: "loading" as const };
}
