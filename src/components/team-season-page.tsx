import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { RosterTable } from "@/components/roster-table";
import { SeasonSwitcher } from "@/components/season-switcher";
import { StatTile } from "@/components/stat-tile";
import { TeamGames } from "@/components/team-games";
import { TeamLogo } from "@/components/team-logo";
import { TeamResultsStrip } from "@/components/team-results-strip";
import {
  formatAverage,
  formatPercentage,
  formatRecord,
  formatSeasonTypeLabel,
  formatSigned,
} from "@/lib/format";
import {
  getCurrentSeason,
  getSeasonPathSuffix,
  isKnownSeason,
} from "@/lib/seasons";
import {
  getTeamPageData,
  getTeamSeasons,
  type TeamGame,
  type TeamPageData,
  type TeamRecord,
} from "@/lib/team-data";
import {
  getTeamColorVars,
  getTeamFullName,
  getTeamInfo,
  isTeamAbbreviation,
} from "@/lib/teams";

// `season` is omitted on the bare /teams/{team} URL, which shows the newest
// season the team has data for.
type TeamSeasonParams = {
  teamSlug: string;
  season?: string;
};

async function loadTeamSeason({ teamSlug, season }: TeamSeasonParams) {
  const teamAbbr = teamSlug.toUpperCase();

  if (!isTeamAbbreviation(teamAbbr)) {
    return null;
  }

  if (season !== undefined && !isKnownSeason(season)) {
    return null;
  }

  const seasons = await getTeamSeasons(teamAbbr);
  const selectedSeason = season ?? seasons[0];

  if (!selectedSeason || !seasons.includes(selectedSeason)) {
    return null;
  }

  const teamPage = await getTeamPageData(teamAbbr, selectedSeason);
  if (!teamPage) {
    return null;
  }

  // Some artifacts carry an empty team name; fall back to the static name.
  const teamName = getTeamFullName(
    teamPage.team.abbr,
    teamPage.team.name || teamPage.team.abbr,
  );
  return { teamPage, teamName, seasons };
}

function isFinished(game: TeamGame) {
  return game.played !== false && game.result !== null;
}

function countRecord(games: TeamGame[]): TeamRecord {
  return {
    wins: games.filter((game) => game.result === "W").length,
    losses: games.filter((game) => game.result === "L").length,
    ties: games.filter((game) => game.result === "T").length,
  };
}

// "W4" / "L2" from the most recent finished games.
function getStreak(games: TeamGame[]) {
  const latest = games[games.length - 1]?.result;
  if (!latest) {
    return null;
  }

  let length = 0;
  for (let index = games.length - 1; index >= 0; index -= 1) {
    if (games[index].result !== latest) {
      break;
    }
    length += 1;
  }

  return `${latest}${length}`;
}

// The split the page leads with: the regular season once it has started,
// otherwise the postseason or preseason, otherwise the whole file.
function getHeadline(teamPage: TeamPageData) {
  for (const seasonType of ["regular", "playoffs", "preseason"]) {
    const split = teamPage.bySeasonType?.[seasonType];
    if (split?.games) {
      return {
        seasonType,
        label: formatSeasonTypeLabel(seasonType),
        record: split.record,
        averages: split.averages,
        games: teamPage.games.filter(
          (game) => isFinished(game) && game.seasonType === seasonType,
        ),
      };
    }
  }

  return {
    seasonType: null,
    label: "All games",
    record: teamPage.record,
    averages: teamPage.averages,
    games: teamPage.games.filter(isFinished),
  };
}

export async function getTeamSeasonMetadata(
  params: TeamSeasonParams,
): Promise<Metadata> {
  const loaded = await loadTeamSeason(params);
  if (!loaded) {
    return {
      title: "Team Not Found",
    };
  }

  const { teamPage, teamName } = loaded;
  const headline = getHeadline(teamPage);

  return {
    title: `${teamName} ${teamPage.season}`,
    description: `${teamName} ${teamPage.season}: ${formatRecord(headline.record)} (${headline.label.toLowerCase()}). Results, roster averages, and a minutes map for every game showing who was on the floor and every play they made.`,
  };
}

export async function TeamSeasonPage(params: TeamSeasonParams) {
  const loaded = await loadTeamSeason(params);
  if (!loaded) {
    notFound();
  }

  const { teamPage, teamName, seasons } = loaded;
  const teamAbbr = teamPage.team.abbr;
  const seasonPathSuffix = getSeasonPathSuffix(teamPage.season);
  const headline = getHeadline(teamPage);
  const averages = headline.averages;
  const homeGames = headline.games.filter((game) => game.homeAway === "home");
  const awayGames = headline.games.filter((game) => game.homeAway === "away");
  const streak = getStreak(headline.games);
  const conference = getTeamInfo(teamAbbr)?.conference;
  const facts = [
    { label: "Home", value: formatRecord(countRecord(homeGames)) },
    { label: "Away", value: formatRecord(countRecord(awayGames)) },
    ...(headline.games.length > 10
      ? [{ label: "Last 10", value: formatRecord(countRecord(headline.games.slice(-10))) }]
      : []),
    ...(streak ? [{ label: "Streak", value: streak }] : []),
  ];

  return (
    <main
      className="team-scope mx-auto flex w-full max-w-[1235px] flex-col gap-5 pb-10"
      style={getTeamColorVars(teamAbbr) as CSSProperties}
    >
      <section className="card overflow-hidden">
        <div className="h-1.5 bg-team" aria-hidden="true" />
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <TeamLogo team={teamAbbr} size={72} />
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-team-text sm:text-4xl">
                  {teamName}
                </h1>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm text-copy">
                  <span className="text-xl font-semibold tabular-nums text-foreground">
                    {formatRecord(headline.record)}
                  </span>
                  <span>
                    {headline.label}
                    {conference ? ` · ${conference}ern Conference` : ""} ·{" "}
                    {teamPage.season}
                  </span>
                </p>
              </div>
            </div>
            <SeasonSwitcher
              basePath={`/teams/${teamAbbr}`}
              seasons={seasons}
              selectedSeason={teamPage.season}
            />
          </div>

          {headline.games.length ? (
            <>
              <dl className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
                <StatTile label="PTS" value={formatAverage(averages.pointsFor)} highlight />
                <StatTile label="OPP PTS" value={formatAverage(averages.pointsAgainst)} highlight />
                <StatTile
                  label="NET"
                  value={formatSigned(averages.pointsFor - averages.pointsAgainst, 1)}
                  highlight
                />
                <StatTile label="REB" value={formatAverage(averages.reb)} />
                <StatTile label="AST" value={formatAverage(averages.ast)} />
                <StatTile label="TO" value={formatAverage(averages.to)} />
                <StatTile label="FG%" value={formatPercentage(averages.fgm, averages.fga)} />
                <StatTile label="3P%" value={formatPercentage(averages.tpm, averages.tpa)} />
                <StatTile label="FT%" value={formatPercentage(averages.ftm, averages.fta)} />
              </dl>
              <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-baseline gap-1.5">
                    <dt className="text-muted">{fact.label}</dt>
                    <dd className="font-semibold tabular-nums text-heading">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5">
                <TeamResultsStrip games={headline.games} teamAbbr={teamAbbr} />
              </div>
            </>
          ) : (
            <p className="mt-5 text-sm text-muted">
              The {teamPage.season} season has not tipped off yet.
            </p>
          )}
        </div>
      </section>

      <TeamGames
        games={teamPage.games}
        teamAbbr={teamAbbr}
        seasonPathSuffix={seasonPathSuffix}
        liveEnabled={teamPage.season === getCurrentSeason()}
      />

      <RosterTable
        players={teamPage.players}
        games={teamPage.games}
        seasonPathSuffix={seasonPathSuffix}
      />
    </main>
  );
}
