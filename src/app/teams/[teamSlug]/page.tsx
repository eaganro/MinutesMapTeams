import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamPageDetails } from "@/components/team-page-details";
import {
  CURRENT_SEASON,
  getTeamPageData,
  isTeamAbbreviation,
  TEAM_ABBREVIATIONS,
  type StatLine,
  type TeamPlayerSeason,
} from "@/lib/team-data";

type TeamPageProps = {
  params: Promise<{
    teamSlug: string;
  }>;
};

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatSeasonRecord(wins: number, losses: number, ties = 0) {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
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

function getPlayerAverageBox(player: TeamPlayerSeason) {
  if (!player.averages) {
    return null;
  }

  if ("box" in player.averages) {
    return player.averages.box;
  }

  return player.averages;
}

function getPlayerTotalBox(player: TeamPlayerSeason): StatLine | null {
  return player.totals?.box ?? player.box ?? null;
}

function getPlayerAverageValue(
  player: TeamPlayerSeason,
  stat: keyof Pick<StatLine, "pts" | "reb" | "ast">,
) {
  return getPlayerAverageBox(player)?.[stat] ?? 0;
}

function getTopPlayers(players: TeamPlayerSeason[]) {
  const sortByMinutes = [...players].sort(
    (left, right) =>
      (getPlayerTotalBox(right)?.seconds ?? 0) -
      (getPlayerTotalBox(left)?.seconds ?? 0),
  );

  const scoringLeader = [...players].sort(
    (left, right) =>
      getPlayerAverageValue(right, "pts") - getPlayerAverageValue(left, "pts"),
  )[0];
  const reboundLeader = [...players].sort(
    (left, right) =>
      getPlayerAverageValue(right, "reb") - getPlayerAverageValue(left, "reb"),
  )[0];
  const assistLeader = [...players].sort(
    (left, right) =>
      getPlayerAverageValue(right, "ast") - getPlayerAverageValue(left, "ast"),
  )[0];

  return {
    players: sortByMinutes,
    leaders: [scoringLeader, reboundLeader, assistLeader].filter(Boolean),
  };
}

export async function generateMetadata({
  params,
}: TeamPageProps): Promise<Metadata> {
  const { teamSlug } = await params;
  const normalizedSlug = teamSlug.toUpperCase();

  if (!isTeamAbbreviation(normalizedSlug)) {
    return {
      title: "Team Not Found",
    };
  }

  const teamPage = await getTeamPageData(normalizedSlug, CURRENT_SEASON);
  if (!teamPage) {
    return {
      title: `${normalizedSlug} Not Found`,
    };
  }

  return {
    title: `${teamPage.team.name} ${teamPage.season}`,
    description: `${teamPage.team.name} season page with team averages, player leaders, and recent games.`,
  };
}

export function generateStaticParams() {
  return TEAM_ABBREVIATIONS.map((teamSlug) => ({ teamSlug }));
}

export default async function TeamDetailPage({ params }: TeamPageProps) {
  const { teamSlug } = await params;
  const normalizedSlug = teamSlug.toUpperCase();

  if (!isTeamAbbreviation(normalizedSlug)) {
    notFound();
  }

  const teamPage = await getTeamPageData(normalizedSlug, CURRENT_SEASON);
  if (!teamPage) {
    notFound();
  }

  const allGames = [...teamPage.games].reverse();
  const { players, leaders } = getTopPlayers(teamPage.players);

  return (
    <main className="mx-auto mt-2 flex w-full max-w-[1235px] flex-col gap-5 pb-10">
      <section className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_340px]">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
                Team Page Data
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] text-heading sm:text-5xl lg:text-6xl">
                {teamPage.team.name}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-copy sm:text-lg">
                {teamPage.season} season snapshot for the {teamPage.team.name},
                powered by the full processed team payload in S3.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Record
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {formatSeasonRecord(
                    teamPage.record.wins,
                    teamPage.record.losses,
                    teamPage.record.ties,
                  )}
                </p>
              </div>

              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Points For
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {teamPage.averages.pointsFor.toFixed(1)}
                </p>
              </div>

              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Points Against
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {teamPage.averages.pointsAgainst.toFixed(1)}
                </p>
              </div>

              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Net Margin
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {formatSignedNumber(
                    Number(
                      (
                        teamPage.averages.pointsFor -
                        teamPage.averages.pointsAgainst
                      ).toFixed(1),
                    ),
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-card-alt p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Team Snapshot
            </p>
            <dl className="mt-4 space-y-3 text-sm leading-7 text-copy">
              <div className="flex items-center justify-between gap-4">
                <dt>Abbreviation</dt>
                <dd className="font-medium text-foreground">
                  {teamPage.team.abbr}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Season</dt>
                <dd className="font-medium text-foreground">
                  {teamPage.season}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Games in file</dt>
                <dd className="font-medium text-foreground">
                  {teamPage.games.length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Players in file</dt>
                <dd className="font-medium text-foreground">
                  {teamPage.players.length}
                </dd>
              </div>
              <div className="border-t border-border pt-3">
                <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Updated
                </dt>
                <dd className="mt-2 text-copy">
                  {formatUpdatedAt(teamPage.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <article>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                Season Leaders
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-heading">
                Top production
              </h2>
            </div>
            <Link
              href="/teams"
              className="rounded-full border border-border-strong bg-card-alt px-4 py-2 text-sm text-copy transition-colors hover:bg-hover hover:text-foreground"
            >
              All Teams
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {leaders.map((player, index) => {
              const label =
                index === 0 ? "Scoring" : index === 1 ? "Rebounding" : "Playmaking";
              const averages = getPlayerAverageBox(player);

              return (
                <div key={`${label}-${player.playerId}`} className="rounded-[18px] bg-card-alt p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {label}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-heading">
                    {player.name}
                  </h3>
                  <div className="mt-4 space-y-2 text-sm text-copy">
                    <p>{(averages?.pts ?? 0).toFixed(1)} PPG</p>
                    <p>{(averages?.reb ?? 0).toFixed(1)} RPG</p>
                    <p>{(averages?.ast ?? 0).toFixed(1)} APG</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <TeamPageDetails games={allGames} players={players} />
    </main>
  );
}
