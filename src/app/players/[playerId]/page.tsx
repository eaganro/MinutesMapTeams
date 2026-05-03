import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerPageDetails } from "@/components/player-page-details";
import {
  getPlayerPageData,
  isPlayerId,
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

function formatTeams(playerPage: PlayerPageData) {
  return playerPage.teams.map((team) => team.abbr).join(", ");
}

function getLinkedTeams(playerPage: PlayerPageData) {
  return playerPage.teams.filter((team) => isTeamAbbreviation(team.abbr));
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

  const averages = playerPage.averages.box;
  const linkedTeams = getLinkedTeams(playerPage);

  return (
    <main className="mx-auto mt-2 flex w-full max-w-[1235px] flex-col gap-5 pb-10">
      <section className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_340px]">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
                Player Page Data
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] text-heading sm:text-5xl lg:text-6xl">
                {playerPage.player.name}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-copy sm:text-lg">
                {playerPage.season} player snapshot across {formatTeams(playerPage)},
                powered by the processed player payload in S3.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Games
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {playerPage.totals.games}
                </p>
              </div>

              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Points
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {averages.pts.toFixed(1)}
                </p>
              </div>

              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Rebounds
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {averages.reb.toFixed(1)}
                </p>
              </div>

              <div className="rounded-[18px] bg-card-alt p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Assists
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-heading">
                  {averages.ast.toFixed(1)}
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
                  {formatTeams(playerPage)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Record</dt>
                <dd className="font-medium text-foreground">
                  {formatSeasonRecord(
                    playerPage.totals.wins,
                    playerPage.totals.losses,
                    playerPage.totals.ties,
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Plus / Minus</dt>
                <dd className="font-medium text-foreground">
                  {averages.pm !== undefined
                    ? formatSignedNumber(Number(averages.pm.toFixed(1)))
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

      {linkedTeams.length ? (
        <section className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                Navigation
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-heading">
                Related team pages
              </h2>
            </div>
            <Link
              href="/teams"
              className="rounded-full border border-border-strong bg-card-alt px-4 py-2 text-sm text-copy transition-colors hover:bg-hover hover:text-foreground"
            >
              All Teams
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {linkedTeams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.abbr}`}
                className="rounded-full border border-border-strong bg-card-alt px-4 py-2 text-sm font-medium text-copy transition-colors hover:bg-hover hover:text-foreground"
              >
                {team.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <PlayerPageDetails playerPage={playerPage} />
    </main>
  );
}
