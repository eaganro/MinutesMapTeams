import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { isPlayerId } from "@/lib/player-data";
import { isTeamAbbreviation } from "@/lib/team-data";

type RevalidatePayload = {
  paths?: unknown;
  teams?: unknown;
  players?: unknown;
};

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string") {
      const trimmed = item.trim();
      return trimmed.length > 0 ? [trimmed] : [];
    }

    if (typeof item === "number" && Number.isInteger(item)) {
      return [String(item)];
    }

    return [];
  });
}

function getPathsToRevalidate(payload: RevalidatePayload) {
  const paths = normalizeStringList(payload.paths).flatMap((path) => {
    if (path.startsWith("/teams/")) {
      const teamAbbr = path.slice("/teams/".length).toUpperCase();
      return isTeamAbbreviation(teamAbbr) ? [`/teams/${teamAbbr}`] : [];
    }

    if (path.startsWith("/players/")) {
      const playerId = path.slice("/players/".length);
      return isPlayerId(playerId) ? [`/players/${playerId}`] : [];
    }

    return [];
  });

  const teamPaths = normalizeStringList(payload.teams).flatMap((team) => {
    const teamAbbr = team.toUpperCase();
    return isTeamAbbreviation(teamAbbr) ? [`/teams/${teamAbbr}`] : [];
  });

  const playerPaths = normalizeStringList(payload.players).flatMap((playerId) =>
    isPlayerId(playerId) ? [`/players/${playerId}`] : [],
  );

  return [...new Set([...paths, ...teamPaths, ...playerPaths])];
}

export async function POST(request: NextRequest) {
  if (!process.env.REVALIDATE_SECRET) {
    return Response.json(
      { error: "REVALIDATE_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (
    request.headers.get("x-revalidate-secret") !==
    process.env.REVALIDATE_SECRET
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: RevalidatePayload;
  try {
    payload = (await request.json()) as RevalidatePayload;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paths = getPathsToRevalidate(payload);
  if (paths.length === 0) {
    return Response.json(
      { error: "No valid team or player paths to revalidate" },
      { status: 400 },
    );
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return Response.json({ revalidated: paths });
}
