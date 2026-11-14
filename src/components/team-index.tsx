import Link from "next/link";
import type { CSSProperties } from "react";
import { LatestDay } from "@/components/latest-day";
import { TeamLogo } from "@/components/team-logo";
import { formatRecord } from "@/lib/format";
import { getGameDay, getLatestGameDate } from "@/lib/game-days";
import { getLeagueIndex, type LeagueTeam } from "@/lib/league-data";
import { siteConfig } from "@/lib/site-config";
import {
  getTeamColorVars,
  getTeamInfo,
  TEAM_ABBREVIATIONS,
  type Conference,
} from "@/lib/teams";

const CONFERENCES: Conference[] = ["East", "West"];

function winShare(team: LeagueTeam) {
  const games = team.record.wins + team.record.losses;
  return games ? team.record.wins / games : 0;
}

function TeamRow({ team, rank }: { team: LeagueTeam; rank: number | null }) {
  const info = getTeamInfo(team.abbr);
  const last = team.lastGame;

  return (
    <li>
      <Link
        href={`/teams/${team.abbr}`}
        className="team-scope group flex h-11 items-center gap-3 rounded-xl px-2 text-sm transition-colors hover:bg-hover sm:px-3"
        style={getTeamColorVars(team.abbr) as CSSProperties}
      >
        <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted">
          {rank ?? ""}
        </span>
        <TeamLogo team={team.abbr} size={26} />
        <span className="min-w-0 flex-1 truncate font-medium text-foreground group-hover:text-team-text">
          <span className="hidden text-copy min-[420px]:inline">{info?.city} </span>
          {info?.name ?? team.abbr}
        </span>
        {last ? (
          <span className="hidden shrink-0 text-xs tabular-nums text-muted md:inline lg:hidden xl:inline">
            <span className={last.result === "W" ? "result-w" : "result-l"}>
              {last.result}
            </span>{" "}
            {last.teamScore}-{last.oppScore} {last.homeAway === "home" ? "vs" : "@"}{" "}
            {last.opponentAbbr}
          </span>
        ) : null}
        {team.streak ? (
          <span
            className={`w-7 shrink-0 text-right text-xs font-semibold tabular-nums ${
              team.streak.startsWith("W") ? "result-w" : "result-l"
            }`}
          >
            {team.streak}
          </span>
        ) : null}
        {team.season ? (
          <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-heading">
            {formatRecord(team.record)}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export async function TeamIndex() {
  // Standings are a nicety: without them the page is still a team directory.
  const league = await getLeagueIndex().catch(() => null);
  const latestDate = league ? await getLatestGameDate().catch(() => null) : null;
  const latestDay = latestDate ? await getGameDay(latestDate).catch(() => null) : null;
  const teams: LeagueTeam[] =
    league?.teams ??
    TEAM_ABBREVIATIONS.map((abbr) => ({
      abbr,
      season: null,
      record: { wins: 0, losses: 0, ties: 0 },
      streak: null,
      lastGame: null,
    }));
  const hasRecords = teams.some(
    (team) => team.record.wins + team.record.losses > 0,
  );

  return (
    <main className="mx-auto flex w-full max-w-[1235px] flex-col gap-5 pb-10">
      {latestDay ? (
        <LatestDay day={latestDay} />
      ) : (
        <h1 className="sr-only">{siteConfig.name}: NBA standings</h1>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {CONFERENCES.map((conference) => {
          const conferenceTeams = teams
            .filter((team) => getTeamInfo(team.abbr)?.conference === conference)
            .sort(
              (left, right) =>
                winShare(right) - winShare(left) ||
                right.record.wins - left.record.wins ||
                left.abbr.localeCompare(right.abbr),
            );

          return (
            <section key={conference} className="card px-2 py-4 sm:px-3">
              <div className="flex items-baseline justify-between px-2 sm:px-3">
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-heading">
                  {conference}ern Conference
                </h2>
                {hasRecords && league ? (
                  <p className="text-xs text-muted">{league.season} regular season</p>
                ) : null}
              </div>
              <ol className="mt-2">
                {conferenceTeams.map((team, index) => (
                  <TeamRow
                    key={team.abbr}
                    team={team}
                    rank={hasRecords ? index + 1 : null}
                  />
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </main>
  );
}
