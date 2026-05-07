import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerPageDetails } from "@/components/player-page-details";
import {
  getPlayerPageData,
  isPlayerId,
  type PlayerGame,
  type PlayerPageData,
} from "@/lib/player-data";
import { CURRENT_SEASON, isTeamAbbreviation } from "@/lib/team-data";

type PlayerPageProps = {
  params: Promise<{
    playerId: string;
  }>;
};

export function generateStaticParams() {
  return [];
}

function formatSeasonRecord(wins: number, losses: number, ties = 0) {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatNullableAverage(value: number | undefined) {
  return value === undefined ? "-" : value.toFixed(1);
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

function getRegularSeasonGames(playerPage: PlayerPageData) {
  return playerPage.games.filter((game) => game.seasonType === "regular");
}

function getRegularSeasonTeams(playerPage: PlayerPageData) {
  const regularSeasonSplit = playerPage.bySeasonType.regular;
  const teamsByAbbreviation = new Map<string, PlayerPageData["teams"][number]>();

  for (const team of regularSeasonSplit?.teams ?? []) {
    teamsByAbbreviation.set(team.abbr, team);
  }

  for (const game of getRegularSeasonGames(playerPage)) {
    teamsByAbbreviation.set(game.teamAbbr, {
      id: game.teamId,
      abbr: game.teamAbbr,
      name: game.teamName,
    });
  }

  if (teamsByAbbreviation.size === 0) {
    for (const team of playerPage.teams) {
      teamsByAbbreviation.set(team.abbr, team);
    }
  }

  return [...teamsByAbbreviation.values()].filter((team) =>
    isTeamAbbreviation(team.abbr),
  );
}

function formatTeams(teams: PlayerPageData["teams"]) {
  return teams.map((team) => team.abbr).join(", ");
}

function countRegularSeasonRecord(games: PlayerGame[]) {
  return games.reduce(
    (record, game) => {
      if (game.result === "W") {
        record.wins += 1;
      } else if (game.result === "L") {
        record.losses += 1;
      } else {
        record.ties += 1;
      }

      return record;
    },
    {
      wins: 0,
      losses: 0,
      ties: 0,
    },
  );
}

function averageRegularSeasonBox(games: PlayerGame[]) {
  if (games.length === 0) {
    return {
      pts: undefined,
      reb: undefined,
      ast: undefined,
      pm: undefined,
    };
  }

  const totals = games.reduce(
    (boxTotals, game) => ({
      pts: boxTotals.pts + game.box.pts,
      reb: boxTotals.reb + game.box.reb,
      ast: boxTotals.ast + game.box.ast,
      pm: boxTotals.pm + (game.box.pm ?? 0),
    }),
    {
      pts: 0,
      reb: 0,
      ast: 0,
      pm: 0,
    },
  );

  return {
    pts: totals.pts / games.length,
    reb: totals.reb / games.length,
    ast: totals.ast / games.length,
    pm: totals.pm / games.length,
  };
}

function getRegularSeasonSummary(playerPage: PlayerPageData) {
  const regularSeasonSplit = playerPage.bySeasonType.regular;
  const regularSeasonGames = getRegularSeasonGames(playerPage);

  return {
    teams: getRegularSeasonTeams(playerPage),
    games: regularSeasonSplit?.games ?? regularSeasonGames.length,
    record:
      regularSeasonSplit?.record ?? countRegularSeasonRecord(regularSeasonGames),
    averages:
      regularSeasonSplit?.averages.box ??
      averageRegularSeasonBox(regularSeasonGames),
  };
}

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { playerId } = await params;

  if (!isPlayerId(playerId)) {
    return {
      title: "Player Not Found",
    };
  }

  const playerPage = await getPlayerPageData(playerId, CURRENT_SEASON);
  if (!playerPage) {
    return {
      title: `${playerId} Not Found`,
    };
  }

  return {
    title: `${playerPage.player.name} ${playerPage.season}`,
    description: `${playerPage.player.name} player page with season splits, averages, and game log.`,
  };
}

export default async function PlayerDetailPage({ params }: PlayerPageProps) {
  const { playerId } = await params;

  if (!isPlayerId(playerId)) {
    notFound();
  }

  const playerPage = await getPlayerPageData(playerId, CURRENT_SEASON);
  if (!playerPage) {
    notFound();
  }

  const regularSeason = getRegularSeasonSummary(playerPage);
  const linkedTeams = regularSeason.teams;
  const teamsLabel = linkedTeams.length ? formatTeams(linkedTeams) : "None";

  return (
    <main className="mx-auto mt-2 flex w-full max-w-[1235px] flex-col gap-5 pb-10">
      <section className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_340px]">
          <div className="space-y-5">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] text-heading sm:text-5xl lg:text-6xl">
                {playerPage.player.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-card-alt px-4 py-2 font-medium text-copy">
                  {playerPage.season} Regular Season
                </span>
                {linkedTeams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.abbr}`}
                    className="rounded-full border border-border-strong bg-card-alt px-4 py-2 font-medium text-copy transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {team.abbr}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Regular Games
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {regularSeason.games}
                </p>
              </div>

              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Points
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {formatNullableAverage(regularSeason.averages.pts)}
                </p>
              </div>

              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Rebounds
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {formatNullableAverage(regularSeason.averages.reb)}
                </p>
              </div>

              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Assists
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {formatNullableAverage(regularSeason.averages.ast)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-card-alt p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Player Snapshot
            </p>
            <dl className="mt-4 space-y-3 text-sm leading-7 text-copy">
              <div className="flex items-center justify-between gap-4">
                <dt>Player ID</dt>
                <dd className="font-medium text-foreground">
                  {playerPage.player.id}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Season</dt>
                <dd className="font-medium text-foreground">
                  {playerPage.season}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Teams</dt>
                <dd className="font-medium text-foreground">
                  {teamsLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Regular Record</dt>
                <dd className="font-medium text-foreground">
                  {formatSeasonRecord(
                    regularSeason.record.wins,
                    regularSeason.record.losses,
                    regularSeason.record.ties,
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Plus / Minus</dt>
                <dd className="font-medium text-foreground">
                  {regularSeason.averages.pm !== undefined
                    ? formatSignedNumber(
                        Number(regularSeason.averages.pm.toFixed(1)),
                      )
                    : "-"}
                </dd>
              </div>
              <div className="border-t border-border pt-3">
                <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Updated
                </dt>
                <dd className="mt-2 text-copy">
                  {formatUpdatedAt(playerPage.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <PlayerPageDetails playerPage={playerPage} />
    </main>
  );
}
