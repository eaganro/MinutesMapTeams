import { unstable_cache } from "next/cache";
import { toNumber } from "@/lib/format";
import { getCompleteGameDates, isFinished } from "@/lib/game-dates";
import { getLeagueIndex } from "@/lib/league-data";
import {
  getGamepackPlayerFlow,
  getGamepackSide,
  getPlayerNameVariants,
  type Gamepack,
} from "@/lib/live";
import { getGzippedJson } from "@/lib/s3-json";
import {
  getCurrentSeason,
  getKnownSeasons,
  getSeasonForDate,
  isKnownSeason,
} from "@/lib/seasons";
import { getTeamPageData, type StatLine, type TeamPageData } from "@/lib/team-data";
import { TEAM_ABBREVIATIONS } from "@/lib/teams";
import { buildGameTimeline, type GameTimeline } from "@/lib/timeline";

// How many of a day's best lines are kept, with their minutes map lines.
const DAY_PLAYER_LIMIT = 30;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// One player's game on a game day, with its minutes map line.
export type DayPlayer = {
  playerId: number;
  name: string;
  teamAbbr: string;
  gameId: string;
  date: string;
  season: string;
  seasonType: string;
  homeAway: "home" | "away";
  opponentAbbr: string;
  result: "W" | "L" | "T" | null;
  teamScore: number;
  oppScore: number;
  box: StatLine;
  gameScore: number;
  side: "home" | "away";
  nameVariants: string[];
  timeline: GameTimeline;
  periodCount: number;
};

export type GameDay = {
  date: string;
  season: string;
  // Best game score first.
  players: DayPlayer[];
};

export function isGameDate(value: string) {
  return DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

// Hollinger's game score: one number for how good a box score line was.
function getGameScore(box: StatLine) {
  return (
    box.pts +
    0.4 * box.fgm -
    0.7 * box.fga -
    0.4 * (box.fta - box.ftm) +
    0.7 * box.oreb +
    0.3 * box.dreb +
    box.stl +
    0.7 * box.ast +
    0.7 * box.blk -
    0.4 * box.pf -
    box.to
  );
}

class IncompleteDayError extends Error {}

async function readSeasonTeamPages(season: string) {
  return Promise.all(
    TEAM_ABBREVIATIONS.map((teamAbbr) =>
      getTeamPageData(teamAbbr, season).catch(() => undefined),
    ),
  );
}

// undefined marks a read that failed, null a team without an artifact.
function hasFailedRead(teamPages: (TeamPageData | null | undefined)[]) {
  return teamPages.some((teamPage) => teamPage === undefined);
}

// The gamepack's own spelling wins: flow and play descriptions use it.
function getNameVariants(
  gamepack: Gamepack,
  side: "home" | "away",
  playerId: number,
  name: string,
) {
  const listed = gamepack.box?.teams?.[side]?.players?.find(
    (player) => toNumber(player.id) === playerId,
  );
  if (listed) {
    return getPlayerNameVariants(
      String(listed.first ?? "").trim(),
      String(listed.last ?? "").trim(),
      playerId,
    );
  }

  const [first = "", ...rest] = name.trim().split(" ");
  return getPlayerNameVariants(first, rest.join(" "), playerId);
}

async function buildGameDay(
  date: string,
  { requireComplete }: { requireComplete: boolean },
): Promise<GameDay | null> {
  const season = getSeasonForDate(date);
  const teamPages = await readSeasonTeamPages(season);
  const games = teamPages.flatMap((teamPage) =>
    (teamPage?.games ?? [])
      .filter((game) => game.date === date)
      .map((game) => ({ game, teamAbbr: teamPage!.team.abbr })),
  );
  if (
    requireComplete &&
    (hasFailedRead(teamPages) || games.some(({ game }) => !isFinished(game)))
  ) {
    // Never keep a day for good that may still change or is missing teams.
    throw new IncompleteDayError(`${date} is not complete`);
  }

  const ranked = games
    .filter(({ game }) => isFinished(game))
    .flatMap(({ game, teamAbbr }) =>
      game.players.map((player) => ({
        player,
        game,
        teamAbbr,
        gameScore: getGameScore(player.box),
      })),
    )
    .sort((left, right) => right.gameScore - left.gameScore)
    .slice(0, DAY_PLAYER_LIMIT);

  const gameIds = [...new Set(ranked.map(({ game }) => game.gameId))];
  const gamepacks = new Map(
    await Promise.all(
      gameIds.map(async (gameId) => {
        const gamepack = await getGzippedJson<Gamepack>(
          `data/gamepack/${gameId}.json.gz`,
        ).catch(() => undefined);
        return [gameId, gamepack] as const;
      }),
    ),
  );
  if (requireComplete && [...gamepacks.values()].some((gamepack) => gamepack === undefined)) {
    throw new IncompleteDayError(`A gamepack for ${date} could not be read`);
  }

  const players: DayPlayer[] = [];
  for (const { player, game, teamAbbr, gameScore } of ranked) {
    const gamepack = gamepacks.get(game.gameId);
    if (!gamepack) {
      continue;
    }

    const side = getGamepackSide(gamepack, teamAbbr, game.homeAway);
    const nameVariants = getNameVariants(gamepack, side, player.playerId, player.name);
    const timeline = buildGameTimeline({
      ...getGamepackPlayerFlow(gamepack, side, nameVariants),
      nbaGameId: game.nbaGameId,
      season: game.season,
    });
    if (!timeline.segments.length) {
      continue;
    }

    players.push({
      playerId: player.playerId,
      name: player.name,
      teamAbbr,
      gameId: game.gameId,
      date,
      season,
      seasonType: game.seasonType,
      homeAway: game.homeAway,
      opponentAbbr: game.opponentAbbr,
      result: game.result,
      teamScore: game.teamScore,
      oppScore: game.oppScore,
      box: player.box,
      gameScore,
      side,
      nameVariants,
      timeline,
      periodCount: Math.max(4, toNumber(gamepack.flow?.periods)),
    });
  }

  return players.length ? { date, season, players } : null;
}

// A finished game day never changes, so each one is cached for good.
const getCompleteGameDay = unstable_cache(
  (date: string) => buildGameDay(date, { requireComplete: true }),
  ["game-day"],
  { revalidate: false },
);

// A game day's best individual games, each with its minutes map line.
export async function getGameDay(date: string): Promise<GameDay | null> {
  try {
    return await getCompleteGameDay(date);
  } catch (error) {
    if (!(error instanceof IncompleteDayError)) {
      throw error;
    }
    // Show what can be read now; the next render tries the cache again.
    return buildGameDay(date, { requireComplete: false });
  }
}

// A finished season's game dates never change either.
const getPastSeasonGameDates = unstable_cache(
  async (season: string) => {
    const teamPages = await readSeasonTeamPages(season);
    if (hasFailedRead(teamPages)) {
      throw new IncompleteDayError(`Could not read every team for ${season}`);
    }
    return getCompleteGameDates(teamPages);
  },
  ["season-game-dates"],
  { revalidate: false },
);

// Dates with complete results in a season, oldest first.
export async function getSeasonGameDates(season: string): Promise<string[]> {
  if (!isKnownSeason(season)) {
    return [];
  }

  const league = await getLeagueIndex();
  if (league.gameDays?.season === season) {
    return league.gameDays.dates;
  }
  if (season === getCurrentSeason()) {
    // The index has not reached this season yet, so no game has been played.
    return [];
  }

  try {
    return await getPastSeasonGameDates(season);
  } catch (error) {
    if (!(error instanceof IncompleteDayError)) {
      throw error;
    }
    return getCompleteGameDates(await readSeasonTeamPages(season));
  }
}

// Dates with complete results across every season with artifacts, oldest
// first, so day navigation runs from one season into the next.
export async function getAllGameDates(): Promise<string[]> {
  const seasons = [...getKnownSeasons()].reverse();
  const perSeason = await Promise.all(seasons.map(getSeasonGameDates));
  return perSeason.flat();
}

// The most recent date with complete results.
export async function getLatestGameDate() {
  const dates = (await getLeagueIndex()).gameDays?.dates ?? [];
  return dates[dates.length - 1] ?? null;
}
