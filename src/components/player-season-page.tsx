import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { PlayerSeasonMap } from "@/components/player-season-map";
import { SeasonSwitcher } from "@/components/season-switcher";
import { StatTile } from "@/components/stat-tile";
import { TeamLogo } from "@/components/team-logo";
import {
  formatAverage,
  formatPercentage,
  formatRecord,
  formatSeasonTypeLabel,
  formatSigned,
} from "@/lib/format";
import {
  getPlayerPageData,
  getPlayerSeasons,
  isPlayerId,
  type PlayerPageData,
  type PlayerSeasonSplit,
} from "@/lib/player-data";
import {
  getCurrentSeason,
  getSeasonPathSuffix,
  isKnownSeason,
} from "@/lib/seasons";
import { getTeamColorVars, getTeamFullName, isTeamAbbreviation } from "@/lib/teams";

// `season` is omitted on the bare /players/{id} URL, which shows the newest
// season the player has data for.
type PlayerSeasonParams = {
  playerId: string;
  season?: string;
};

async function loadPlayerSeason({ playerId, season }: PlayerSeasonParams) {
  if (!isPlayerId(playerId)) {
    return null;
  }

  if (season !== undefined && !isKnownSeason(season)) {
    return null;
  }

  const seasons = await getPlayerSeasons(playerId);
  const selectedSeason = season ?? seasons[0];

  if (!selectedSeason || !seasons.includes(selectedSeason)) {
    return null;
  }

  const playerPage = await getPlayerPageData(playerId, selectedSeason);
  return playerPage ? { playerPage, seasons } : null;
}

const SPLIT_ORDER = ["regular", "playoffs", "play_in", "preseason"];

// Season splits in display order; the first is the headline split.
function getSplits(playerPage: PlayerPageData) {
  const entries = Object.entries(playerPage.bySeasonType).filter(
    (entry): entry is [string, PlayerSeasonSplit] => Boolean(entry[1]?.games),
  );
  const rank = (seasonType: string) => {
    const index = SPLIT_ORDER.indexOf(seasonType);
    return index === -1 ? SPLIT_ORDER.length : index;
  };

  return entries
    .sort(([left], [right]) => rank(left) - rank(right))
    .map(([seasonType, split]) => ({ seasonType, split }));
}

// Teams the player appeared for, most recent first.
function getPlayerTeams(playerPage: PlayerPageData) {
  const abbrs = [
    ...[...playerPage.games].reverse().map((game) => game.teamAbbr),
    ...playerPage.teams.map((team) => team.abbr),
  ];

  return [...new Set(abbrs)].filter(isTeamAbbreviation);
}

export async function getPlayerSeasonMetadata(
  params: PlayerSeasonParams,
): Promise<Metadata> {
  const loaded = await loadPlayerSeason(params);
  if (!loaded) {
    return {
      title: "Player Not Found",
    };
  }

  const { playerPage } = loaded;
  const headline = getSplits(playerPage)[0];
  const box = headline?.split.averages.box;
  const statLine = box
    ? ` ${formatAverage(box.pts)} PTS, ${formatAverage(box.reb)} REB, ${formatAverage(box.ast)} AST per game.`
    : "";

  return {
    title: `${playerPage.player.name} ${playerPage.season}`,
    description: `${playerPage.player.name}'s ${playerPage.season} season, game by game: when he was on the floor and every shot, rebound and assist on one timeline.${statLine}`,
  };
}

export async function PlayerSeasonPage(params: PlayerSeasonParams) {
  const loaded = await loadPlayerSeason(params);
  if (!loaded) {
    notFound();
  }

  const { playerPage, seasons } = loaded;
  const { player } = playerPage;
  const seasonPathSuffix = getSeasonPathSuffix(playerPage.season);
  const splits = getSplits(playerPage);
  const headline = splits[0];
  const box = headline?.split.averages.box;
  const teams = getPlayerTeams(playerPage);
  const currentTeam = teams[0];

  return (
    <main
      className="team-scope mx-auto flex w-full max-w-[1235px] flex-col gap-5 pb-10"
      style={getTeamColorVars(currentTeam ?? "") as CSSProperties}
    >
      <section className="card overflow-hidden">
        <div className="h-1.5 bg-team" aria-hidden="true" />
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              {currentTeam ? (
                <Link
                  href={`/teams/${currentTeam}${seasonPathSuffix}`}
                  aria-label={`${getTeamFullName(currentTeam)} team page`}
                  className="shrink-0 transition-transform hover:scale-105"
                >
                  <TeamLogo team={currentTeam} size={64} />
                </Link>
              ) : null}
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">
                  {player.name}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-copy">
                  {teams.length ? (
                    teams.map((team, index) => (
                      <span key={team} className="flex items-center gap-2">
                        {index > 0 ? (
                          <span className="text-muted" aria-hidden="true">
                            ·
                          </span>
                        ) : null}
                        <Link
                          href={`/teams/${team}${seasonPathSuffix}`}
                          className={`font-semibold hover:underline ${
                            index === 0 ? "text-team-text" : "text-copy"
                          }`}
                        >
                          {getTeamFullName(team)}
                        </Link>
                      </span>
                    ))
                  ) : (
                    <span>No NBA team</span>
                  )}
                  <span className="text-muted" aria-hidden="true">
                    ·
                  </span>
                  <span>{playerPage.season}</span>
                </p>
              </div>
            </div>
            <SeasonSwitcher
              basePath={`/players/${player.id}`}
              seasons={seasons}
              selectedSeason={playerPage.season}
            />
          </div>

          {headline && box ? (
            <>
              <p className="eyebrow mt-6">
                {formatSeasonTypeLabel(headline.seasonType)} · {headline.split.games}{" "}
                {headline.split.games === 1 ? "game" : "games"} · team{" "}
                {formatRecord(headline.split.record)}
              </p>
              <dl className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
                <StatTile label="PTS" value={formatAverage(box.pts)} highlight />
                <StatTile label="REB" value={formatAverage(box.reb)} highlight />
                <StatTile label="AST" value={formatAverage(box.ast)} highlight />
                <StatTile label="MIN" value={box.min} />
                <StatTile label="FG%" value={formatPercentage(box.fgm, box.fga)} />
                <StatTile label="3P%" value={formatPercentage(box.tpm, box.tpa)} />
                <StatTile label="FT%" value={formatPercentage(box.ftm, box.fta)} />
                <StatTile label="+/-" value={formatSigned(box.pm, 1)} />
              </dl>
            </>
          ) : null}

          {splits.length > 1 ? (
            <div className="mt-4 overflow-x-auto rounded-lg">
              <table className="box-table" aria-label="Averages by season type">
                <thead>
                  <tr>
                    <th scope="col">Split</th>
                    <th scope="col">GP</th>
                    <th scope="col">W-L</th>
                    <th scope="col">MIN</th>
                    <th scope="col" className="box-hl">
                      PTS
                    </th>
                    <th scope="col" className="box-hl">
                      REB
                    </th>
                    <th scope="col" className="box-hl">
                      AST
                    </th>
                    <th scope="col">STL</th>
                    <th scope="col">BLK</th>
                    <th scope="col">TO</th>
                    <th scope="col">FG%</th>
                    <th scope="col">3P%</th>
                    <th scope="col">FT%</th>
                    <th scope="col">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {splits.map(({ seasonType, split }) => {
                    const average = split.averages.box;

                    return (
                      <tr key={seasonType}>
                        <td>{formatSeasonTypeLabel(seasonType)}</td>
                        <td>{split.games}</td>
                        <td>{formatRecord(split.record)}</td>
                        <td>{average.min}</td>
                        <td className="box-hl">{formatAverage(average.pts)}</td>
                        <td className="box-hl">{formatAverage(average.reb)}</td>
                        <td className="box-hl">{formatAverage(average.ast)}</td>
                        <td>{formatAverage(average.stl)}</td>
                        <td>{formatAverage(average.blk)}</td>
                        <td>{formatAverage(average.to)}</td>
                        <td>{formatPercentage(average.fgm, average.fga)}</td>
                        <td>{formatPercentage(average.tpm, average.tpa)}</td>
                        <td>{formatPercentage(average.ftm, average.fta)}</td>
                        <td>{formatSigned(average.pm, 1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      <PlayerSeasonMap
        playerPage={playerPage}
        seasonPathSuffix={seasonPathSuffix}
        liveEnabled={playerPage.season === getCurrentSeason()}
      />
    </main>
  );
}
