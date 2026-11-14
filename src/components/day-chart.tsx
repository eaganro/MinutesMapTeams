"use client";

import {
  MinutesChart,
  type ChartColumn,
  type ChartRow,
} from "@/components/chart/minutes-chart";
import { StatChips, useStatToggles } from "@/components/chart/stat-chips";
import { useDayExpanded } from "@/components/day-expanded";
import { GameDetails } from "@/components/game-details";
import { TeamLogo } from "@/components/team-logo";
import type { DayPlayer } from "@/lib/game-days";
import { formatOpponentLabel, formatSigned, formatWholeMinutes } from "@/lib/format";
import { getSeasonPathSuffix } from "@/lib/seasons";

const COLUMNS: ChartColumn[] = [
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS", primary: true, highlight: true },
  { key: "reb", label: "REB", highlight: true },
  { key: "ast", label: "AST", highlight: true },
  { key: "pm", label: "+/-" },
];

type DayChartProps = {
  // Best first.
  players: DayPlayer[];
  ariaLabel: string;
  // Rows shown before "Show more"; all of them when left out.
  initialCount?: number;
};

// Players from one game day, one minutes map line each, on a shared clock.
export function DayChart({ players, ariaLabel, initialCount }: DayChartProps) {
  const toggles = useStatToggles();
  const { expanded, setExpanded } = useDayExpanded();
  const canExpand = initialCount !== undefined && players.length > initialCount;
  const shown = canExpand && !expanded ? players.slice(0, initialCount) : players;

  const rows: ChartRow[] = shown.map((player) => {
    const seasonPathSuffix = getSeasonPathSuffix(player.season);

    return {
      key: String(player.playerId),
      name: `${player.name}, ${player.teamAbbr} ${formatOpponentLabel(
        player.homeAway,
        player.opponentAbbr,
      )}`,
      label: (
        <span className="inline-flex max-w-full items-center gap-1.5 align-middle">
          <TeamLogo team={player.teamAbbr} size={16} />
          <span className="truncate">{player.name}</span>
        </span>
      ),
      timeline: player.timeline,
      cells: [
        formatWholeMinutes(player.box),
        player.box.pts,
        player.box.reb,
        player.box.ast,
        formatSigned(player.box.pm),
      ],
      nameVariants: player.nameVariants,
      score: {
        side: player.side,
        teamAbbr: player.teamAbbr,
        opponentAbbr: player.opponentAbbr,
      },
      details: (
        <GameDetails
          game={player}
          playerName={player.name}
          seasonPathSuffix={seasonPathSuffix}
          playerHref={`/players/${player.playerId}${seasonPathSuffix}`}
        />
      ),
    };
  });

  return (
    <div className="space-y-3">
      <MinutesChart
        rows={rows}
        columns={COLUMNS}
        statOn={toggles.statOn}
        emphasized={toggles.emphasized}
        labelHeader="Player"
        ariaLabel={ariaLabel}
        minPeriods={Math.max(4, ...shown.map((player) => player.periodCount))}
      />
      <StatChips toggles={toggles} />
      {canExpand ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="pill"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? `Show top ${initialCount}` : `Show top ${players.length}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
