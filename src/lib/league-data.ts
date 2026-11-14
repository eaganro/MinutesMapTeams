import { unstable_cache } from "next/cache";
import { getCurrentSeason, getKnownSeasons } from "@/lib/seasons";
import {
  getTeamPageData,
  type TeamPageData,
  type TeamRecord,
} from "@/lib/team-data";
import { getCompleteGameDates, isFinished } from "@/lib/game-dates";
import { TEAM_ABBREVIATIONS } from "@/lib/teams";

export type LeagueTeam = {
  abbr: string;
  season: string | null;
  // Regular-season record; zeros before the regular season starts.
  record: TeamRecord;
  streak: string | null;
  lastGame: {
    date: string;
    homeAway: "home" | "away";
    opponentAbbr: string;
    result: "W" | "L" | "T";
    teamScore: number;
    oppScore: number;
  } | null;
};

export type LeaguePlayer = {
  id: number;
  name: string;
  teamAbbr: string;
};

export type LeagueIndex = {
  season: string;
  teams: LeagueTeam[];
  players: LeaguePlayer[];
  // Dates with complete results in the season the index was read from,
  // oldest first.
  gameDays: { season: string; dates: string[] } | null;
};

const EMPTY_RECORD: TeamRecord = { wins: 0, losses: 0, ties: 0 };

async function loadTeam(teamAbbr: string, seasons: string[]) {
  // The newest season with an artifact: normally the current one.
  for (const season of seasons.slice(0, 2)) {
    const teamPage = await getTeamPageData(teamAbbr, season);
    if (teamPage) {
      return teamPage;
    }
  }

  return null;
}

function getIndexGameDays(teamPages: (TeamPageData | null)[]) {
  const season = teamPages.find((teamPage) => teamPage)?.season;
  if (!season) {
    return null;
  }

  return {
    season,
    dates: getCompleteGameDates(
      teamPages.filter((teamPage) => teamPage?.season === season),
    ),
  };
}

type PlayerTally = Map<number, LeaguePlayer & { games: number }>;

function tallyPlayers(players: PlayerTally, teamPage: TeamPageData, abbr: string) {
  for (const player of teamPage.players) {
    const games = player.totals?.games ?? player.games ?? 0;
    const known = players.get(player.playerId);
    // A traded player is listed under the team he played more games for.
    if (!known || games > known.games) {
      players.set(player.playerId, {
        id: player.playerId,
        name: player.name,
        teamAbbr: abbr,
        games,
      });
    }
  }
}

function sortPlayers(players: Iterable<LeaguePlayer>) {
  return [...players]
    .map(({ id, name, teamAbbr }) => ({ id, name, teamAbbr }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function buildLeagueIndex(): Promise<LeagueIndex> {
  const seasons = getKnownSeasons();
  const teamPages = await Promise.all(
    TEAM_ABBREVIATIONS.map((teamAbbr) =>
      // One unreadable team must not take the index down with it.
      loadTeam(teamAbbr, seasons).catch(() => null),
    ),
  );
  if (teamPages.every((teamPage) => teamPage === null)) {
    // Almost certainly a data-access problem; do not cache an empty league.
    throw new Error("No team page artifact could be read");
  }

  const players: PlayerTally = new Map();

  const teams = TEAM_ABBREVIATIONS.map((abbr, index): LeagueTeam => {
    const teamPage = teamPages[index];
    if (!teamPage) {
      return { abbr, season: null, record: EMPTY_RECORD, streak: null, lastGame: null };
    }

    tallyPlayers(players, teamPage, abbr);

    const finished = teamPage.games.filter(isFinished);
    const regular = finished.filter((game) => game.seasonType === "regular");
    const last = finished[finished.length - 1];
    let streak: string | null = null;

    if (regular.length) {
      const latest = regular[regular.length - 1].result;
      let length = 0;
      for (let i = regular.length - 1; i >= 0 && regular[i].result === latest; i -= 1) {
        length += 1;
      }
      streak = `${latest}${length}`;
    }

    return {
      abbr,
      season: teamPage.season,
      record: teamPage.bySeasonType?.regular?.record ?? EMPTY_RECORD,
      streak,
      lastGame:
        last && last.result
          ? {
              date: last.date,
              homeAway: last.homeAway,
              opponentAbbr: last.opponentAbbr,
              result: last.result,
              teamScore: last.teamScore,
              oppScore: last.oppScore,
            }
          : null,
    };
  });

  return {
    season: getCurrentSeason(),
    teams,
    players: sortPlayers(players.values()),
    gameDays: getIndexGameDays(teamPages),
  };
}

// Records for all 30 teams plus a player directory, read from the team page
// artifacts. Thirty reads, so the result is kept for an hour; it backs the
// home page standings and the search box, neither of which needs to be live.
export const getLeagueIndex = unstable_cache(buildLeagueIndex, ["league-index-v4"], {
  revalidate: 3600,
});

// Everyone who appeared for a team in one season. Used for seasons other than
// the one the league index reads, which are finished and change rarely.
const getSeasonPlayers = unstable_cache(
  async (season: string) => {
    const players: PlayerTally = new Map();
    const teamPages = await Promise.all(
      TEAM_ABBREVIATIONS.map((abbr) => getTeamPageData(abbr, season).catch(() => null)),
    );
    teamPages.forEach((teamPage, index) => {
      if (teamPage) {
        tallyPlayers(players, teamPage, TEAM_ABBREVIATIONS[index]);
      }
    });
    return sortPlayers(players.values());
  },
  ["season-players-v1"],
  { revalidate: 86400 },
);

// The header search directory: every player with a page in any known season.
// A player keeps the team from the newest season he played in, which is also
// the season his bare /players/{id} URL shows.
export async function getPlayerDirectory(): Promise<LeaguePlayer[]> {
  const league = await getLeagueIndex();
  const players = new Map(league.players.map((player) => [player.id, player]));
  const olderSeasons = getKnownSeasons().filter(
    (season) => season !== league.gameDays?.season && season !== league.season,
  );

  for (const season of olderSeasons) {
    // A season that cannot be read only leaves its players out of search.
    const seasonPlayers = await getSeasonPlayers(season).catch(() => []);
    for (const player of seasonPlayers) {
      if (!players.has(player.id)) {
        players.set(player.id, player);
      }
    }
  }

  return sortPlayers(players.values());
}
