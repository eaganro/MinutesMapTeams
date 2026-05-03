import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayersDropdown } from "@/components/players-dropdown";
import { TeamPageDetails } from "@/components/team-page-details";
import {
  CURRENT_SEASON,
  getTeamPageData,
  isTeamAbbreviation,
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

function getPlayerTotalBox(player: TeamPlayerSeason): StatLine | null {
  return player.totals?.box ?? player.box ?? null;
}

function getPlayersByMinutes(players: TeamPlayerSeason[]) {
  return [...players].sort(
    (left, right) =>
      (getPlayerTotalBox(right)?.seconds ?? 0) -
      (getPlayerTotalBox(left)?.seconds ?? 0),
  );
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
    description: `${teamPage.team.name} season page with team averages, full roster output, and game results.`,
  };
}

export function generateStaticParams() {
  return [];
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
  const players = getPlayersByMinutes(teamPage.players);
  const playerOptions = players.map((player) => ({
    id: player.playerId,
    name: player.name,
  }));

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
              <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
                <PlayersDropdown
                  players={playerOptions}
                  teamAbbr={teamPage.team.abbr}
                  teamName={teamPage.team.name}
                />
                <Link
                  href="/teams"
                  className="rounded-full border border-border-strong bg-card-alt px-4 py-2 text-copy transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  All Teams
                </Link>
              </div>
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

      <TeamPageDetails games={allGames} players={players} />
    </main>
  );
}
