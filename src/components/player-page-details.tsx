"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PlayerGame,
  PlayerGameAction,
  PlayerGameSegment,
  PlayerPageData,
} from "@/lib/player-data";
import type { StatLine, TeamGame } from "@/lib/team-data";
import {
  SeasonTypeSelector,
  type SeasonTypeSelectorOption,
} from "@/components/season-type-selector";
import { PlayerGameBoxscore } from "@/components/player-game-boxscore";
import {
  PlayerGameTimeline,
  PLAYER_TIMELINE_STAT_COUNT,
} from "@/components/player-game-timeline";
import { getGamePageUrl } from "@/lib/game-url";

const INITIAL_GAME_COUNT = 5;
const GAME_PAGE_SIZE = 5;
const SEASON_TYPE_LABELS: Record<string, string> = {
  preseason: "Preseason",
  regular: "Regular Season",
  play_in: "Play-In",
  playoffs: "Playoffs",
};
const NBA_TEAM_ABBREVIATIONS = new Set([
  "ATL",
  "BOS",
  "BKN",
  "CHA",
  "CHI",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GSW",
  "HOU",
  "IND",
  "LAC",
  "LAL",
  "MEM",
  "MIA",
  "MIL",
  "MIN",
  "NOP",
  "NYK",
  "OKC",
  "ORL",
  "PHI",
  "PHX",
  "POR",
  "SAC",
  "SAS",
  "TOR",
  "UTA",
  "WAS",
]);

type PlayerFilter = "all" | "regular" | "playoffs" | "other";
type DisplayPlayerGame = Omit<PlayerGame, "gamepackKey" | "result"> & {
  gamepackKey: string | null;
  played?: boolean;
  result: PlayerGame["result"] | null;
  status?: string;
};
type TeamStatus = {
  currentGame?: TeamGame | null;
};
type LiveGamepack = {
  box?: {
    start?: string | null;
    status?: string | null;
    gameStatusText?: string | null;
    teams?: {
      away?: LiveTeam;
      home?: LiveTeam;
    };
  };
  flow?: {
    last?: {
      quarter?: number | string | null;
      time?: string | null;
      awayScore?: number | string | null;
      homeScore?: number | string | null;
      status?: string | null;
    };
    players?: {
      away?: Record<string, PlayerGameAction[]>;
      home?: Record<string, PlayerGameAction[]>;
    };
    segments?: {
      away?: Record<string, PlayerGameSegment[]>;
      home?: Record<string, PlayerGameSegment[]>;
    };
  };
};
type LiveTeam = {
  id?: number | string | null;
  abbr?: string | null;
  name?: string | null;
  players?: LivePlayer[];
};
type LivePlayer = {
  id?: number | string | null;
  first?: string | null;
  last?: string | null;
  stats?: Partial<Record<StatNumberKey | "min", number | string | null>>;
};
type StatNumberKey =
  | "pts"
  | "fgm"
  | "fga"
  | "tpm"
  | "tpa"
  | "ftm"
  | "fta"
  | "oreb"
  | "dreb"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "to"
  | "pf"
  | "pm";

const STAT_NUMBER_KEYS: StatNumberKey[] = [
  "pts",
  "fgm",
  "fga",
  "tpm",
  "tpa",
  "ftm",
  "fta",
  "oreb",
  "dreb",
  "reb",
  "ast",
  "stl",
  "blk",
  "to",
  "pf",
  "pm",
];

function formatOpponentLabel(homeAway: "home" | "away", opponentAbbr: string) {
  return homeAway === "home" ? `vs ${opponentAbbr}` : `@ ${opponentAbbr}`;
}

function formatGameDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatSeasonTypeLabel(seasonType: string) {
  return (
    SEASON_TYPE_LABELS[seasonType] ??
    seasonType
      .split(/[_-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function isPregameStatus(status?: string) {
  const normalized = (status ?? "").trim().toLowerCase();

  return (
    !normalized ||
    normalized.startsWith("scheduled") ||
    normalized.startsWith("pre") ||
    normalized.includes("tbd") ||
    /\b(?:am|pm|et)\b/.test(normalized)
  );
}

function isLiveTeamGame(game: TeamGame) {
  return (
    game.played === false &&
    game.result === null &&
    Boolean(game.gamepackKey) &&
    !isPregameStatus(game.status)
  );
}

function isLivePlayerGame(game: DisplayPlayerGame) {
  return game.played === false && game.result === null;
}

function getResultBadgeClass(game: DisplayPlayerGame) {
  if (isLivePlayerGame(game)) {
    return "bg-[#fff3bf] text-[#92400e] dark:bg-[#3a2f14] dark:text-[#fde68a]";
  }

  return game.result === "W"
    ? "bg-[#dff3e4] text-[#166534] dark:bg-[#193126] dark:text-[#86efac]"
    : "bg-[#f7e0e0] text-[#991b1b] dark:bg-[#341c1c] dark:text-[#fca5a5]";
}

function getResultBadgeLabel(game: DisplayPlayerGame) {
  return isLivePlayerGame(game) ? (game.status ?? "Live") : game.result;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMinutesToSeconds(value?: string) {
  if (!value) {
    return 0;
  }

  const [minutes, seconds] = value.split(":").map(Number);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return 0;
  }

  return minutes * 60 + seconds;
}

function isZeroClock(value?: string | null) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) {
    return false;
  }

  if (normalized.startsWith("PT") && normalized.endsWith("S")) {
    return (
      parseMinutesToSeconds(normalized.slice(2, -1).replace("M", ":")) === 0
    );
  }

  return parseMinutesToSeconds(normalized.replace(".", ":")) === 0;
}

function createEmptyStatLine(): StatLine {
  return {
    min: "0:00",
    pts: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    oreb: 0,
    dreb: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    to: 0,
    pf: 0,
    pm: 0,
  };
}

function buildLivePlayerBox(player: LivePlayer): StatLine {
  const stats = player.stats ?? {};
  const min = String(stats.min ?? "00:00");
  const box = createEmptyStatLine();

  box.min = min;
  box.seconds = parseMinutesToSeconds(min);

  for (const key of STAT_NUMBER_KEYS) {
    box[key] = toNumber(stats[key]);
  }
  box.reb = toNumber(stats.reb) || box.oreb + box.dreb;

  return box;
}

function getLivePlayerName(player: LivePlayer) {
  const first = String(player.first ?? "").trim();
  const last = String(player.last ?? "").trim();
  return `${first} ${last}`.trim();
}

function getLiveStatus(game: TeamGame, gamepack: LiveGamepack | undefined) {
  if (isFinalLiveGamepack(gamepack)) {
    return "Final";
  }

  const last = gamepack?.flow?.last;
  const quarter = toNumber(last?.quarter);
  const time = String(last?.time ?? "").trim();

  if (quarter > 0 && time) {
    return `Q${quarter} ${time}`;
  }

  return game.status ?? "Live";
}

function isFinalLiveGamepack(gamepack: LiveGamepack | undefined) {
  const status = String(
    gamepack?.box?.gameStatusText ??
      gamepack?.box?.status ??
      gamepack?.flow?.last?.status ??
      "",
  )
    .trim()
    .toLowerCase();
  if (status.startsWith("final")) {
    return true;
  }

  const last = gamepack?.flow?.last;
  const quarter = toNumber(last?.quarter);
  const awayScore = toNumber(last?.awayScore);
  const homeScore = toNumber(last?.homeScore);

  return quarter >= 4 && isZeroClock(last?.time) && awayScore !== homeScore;
}

function getLiveScore(gamepack: LiveGamepack | undefined, side: "home" | "away") {
  const last = gamepack?.flow?.last;
  const value = side === "home" ? last?.homeScore : last?.awayScore;

  return toNumber(value);
}

function getPlayerTeamAbbrs(playerPage: PlayerPageData) {
  return [
    ...new Set(
      [
        ...playerPage.teams.map((team) => team.abbr),
        ...playerPage.games.map((game) => game.teamAbbr),
      ]
        .map((teamAbbr) => teamAbbr.toUpperCase())
        .filter((teamAbbr) => NBA_TEAM_ABBREVIATIONS.has(teamAbbr)),
    ),
  ];
}

function getPlayerFlowKeys(playerPage: PlayerPageData, player: LivePlayer) {
  const fullName = playerPage.player.name.trim();
  const liveName = getLivePlayerName(player);
  const initialName = `${playerPage.player.first.charAt(0)}. ${
    playerPage.player.last
  }`.trim();
  const playerId = String(playerPage.player.id);

  return [
    fullName,
    liveName,
    initialName,
    `${fullName}#${playerId}`,
    `${initialName}#${playerId}`,
  ].filter(Boolean);
}

function pickMappedPlayerEvents<T>(
  map: Record<string, T[]> | undefined,
  keys: string[],
) {
  if (!map) {
    return [];
  }

  for (const key of keys) {
    if (map[key]) {
      return map[key];
    }
  }

  return [];
}

function buildLivePlayerGame(
  playerPage: PlayerPageData,
  statusGame: TeamGame,
  gamepack: LiveGamepack | undefined,
): DisplayPlayerGame | null {
  const side = statusGame.homeAway;
  const teams = gamepack?.box?.teams;
  const team = side === "home" ? teams?.home : teams?.away;
  const opponent = side === "home" ? teams?.away : teams?.home;
  const livePlayer = (team?.players ?? []).find(
    (player) => toNumber(player.id) === playerPage.player.id,
  );

  if (!livePlayer) {
    return null;
  }

  const flowKeys = getPlayerFlowKeys(playerPage, livePlayer);
  const sidePlayers = gamepack?.flow?.players?.[side];
  const sideSegments = gamepack?.flow?.segments?.[side];
  const teamScore = getLiveScore(gamepack, side) || statusGame.teamScore;
  const oppScore =
    getLiveScore(gamepack, side === "home" ? "away" : "home") ||
    statusGame.oppScore;

  return {
    gameId: statusGame.gameId,
    nbaGameId: statusGame.nbaGameId,
    date: statusGame.date,
    start: statusGame.start,
    season: statusGame.season,
    seasonType: statusGame.seasonType,
    homeAway: side,
    result: null,
    status: getLiveStatus(statusGame, gamepack),
    played: false,
    teamScore,
    oppScore,
    teamId: toNumber(team?.id),
    teamAbbr: String(team?.abbr ?? "").toUpperCase() || playerPage.teams[0]?.abbr || "",
    teamName: String(team?.name ?? ""),
    opponentId: toNumber(opponent?.id) || statusGame.opponentId,
    opponentAbbr: String(opponent?.abbr ?? statusGame.opponentAbbr),
    opponentName: String(opponent?.name ?? statusGame.opponentName),
    box: buildLivePlayerBox(livePlayer),
    gamepackKey: statusGame.gamepackKey,
    playerId: playerPage.player.id,
    playerKey: playerPage.player.key,
    detail: {
      actions: pickMappedPlayerEvents(sidePlayers, flowKeys),
      segments: pickMappedPlayerEvents(sideSegments, flowKeys),
    },
  };
}

function upsertLivePlayerGames(
  games: DisplayPlayerGame[],
  liveGames: DisplayPlayerGame[],
) {
  if (!liveGames.length) {
    return games;
  }

  const liveGamesById = new Map(liveGames.map((game) => [game.gameId, game]));
  const replacedGameIds = new Set<string>();
  const nextGames = games.map((game) => {
    const liveGame = liveGamesById.get(game.gameId);
    if (!liveGame) {
      return game;
    }

    replacedGameIds.add(game.gameId);
    return liveGame;
  });

  for (const liveGame of liveGames) {
    if (!replacedGameIds.has(liveGame.gameId)) {
      nextGames.push(liveGame);
    }
  }

  return nextGames;
}

function getSeasonTypeCounts(games: DisplayPlayerGame[]) {
  return games.reduce(
    (counts, game) => {
      if (game.seasonType === "regular") {
        counts.regular += 1;
      } else if (game.seasonType === "playoffs") {
        counts.playoffs += 1;
      } else {
        counts.other += 1;
      }

      return counts;
    },
    {
      regular: 0,
      playoffs: 0,
      other: 0,
    },
  );
}

function getSeasonTypeOptions(games: DisplayPlayerGame[]) {
  const counts = getSeasonTypeCounts(games);
  const options: Array<SeasonTypeSelectorOption<PlayerFilter>> = [
    {
      value: "all" as const,
      label: "All",
      count: games.length,
    },
  ];

  if (counts.regular > 0) {
    options.push({
      value: "regular",
      label: "Regular Season",
      count: counts.regular,
    });
  }

  if (counts.playoffs > 0) {
    options.push({
      value: "playoffs",
      label: "Playoffs",
      count: counts.playoffs,
    });
  }

  if (counts.other > 0) {
    options.push({
      value: "other",
      label: "Other",
      count: counts.other,
    });
  }

  return options;
}

function isGameInFilter(game: DisplayPlayerGame, filter: PlayerFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "other") {
    return game.seasonType !== "regular" && game.seasonType !== "playoffs";
  }

  return game.seasonType === filter;
}

function getGamesForFilter(games: DisplayPlayerGame[], filter: PlayerFilter) {
  const filteredGames = games.filter((game) => isGameInFilter(game, filter));

  return [...filteredGames].reverse();
}

type PlayerPageDetailsProps = {
  playerPage: PlayerPageData;
};

export function PlayerPageDetails({ playerPage }: PlayerPageDetailsProps) {
  const [selectedFilter, setSelectedFilter] = useState<PlayerFilter>("all");
  const [visibleGames, setVisibleGames] = useState(
    Math.min(INITIAL_GAME_COUNT, playerPage.games.length),
  );
  const [timelineStatOn, setTimelineStatOn] = useState(() =>
    Array.from({ length: PLAYER_TIMELINE_STAT_COUNT }, () => true),
  );
  const [teamStatuses, setTeamStatuses] = useState<Record<string, TeamStatus>>(
    {},
  );
  const [activeLiveTeamAbbr, setActiveLiveTeamAbbr] = useState<string | null>(
    null,
  );
  const [liveGamepacks, setLiveGamepacks] = useState<
    Record<string, LiveGamepack>
  >({});
  const activeLiveTeamAbbrRef = useRef<string | null>(null);
  const liveStatusGamesRef = useRef<TeamGame[]>([]);
  const teamAbbrs = useMemo(() => getPlayerTeamAbbrs(playerPage), [playerPage]);
  const teamStatusFetchKey = teamAbbrs.join("|");
  const liveStatusGames = useMemo(
    () =>
      Object.entries(teamStatuses)
        .filter(
          ([teamAbbr]) =>
            !activeLiveTeamAbbr || teamAbbr === activeLiveTeamAbbr,
        )
        .map(
          ([, teamStatus]) => teamStatus.currentGame,
        )
        .filter(
          (game): game is TeamGame =>
            game !== null && game !== undefined && isLiveTeamGame(game),
        ),
    [activeLiveTeamAbbr, teamStatuses],
  );
  const liveGameIds = [
    ...new Set(liveStatusGames.map((game) => game.gameId).filter(Boolean)),
  ];
  const liveGameFetchKey = liveGameIds.join("|");

  useEffect(() => {
    activeLiveTeamAbbrRef.current = activeLiveTeamAbbr;
  }, [activeLiveTeamAbbr]);

  useEffect(() => {
    liveStatusGamesRef.current = liveStatusGames;
  }, [liveStatusGames]);

  useEffect(() => {
    const currentTeamAbbrs = teamStatusFetchKey
      ? teamStatusFetchKey.split("|")
      : [];
    if (!currentTeamAbbrs.length) {
      return;
    }

    let cancelled = false;
    async function loadTeamStatuses(teamAbbrsToFetch: string[]) {
      const entries = await Promise.all(
        teamAbbrsToFetch.map(async (teamAbbr) => {
          try {
            const response = await fetch(
              `/api/team-status/${encodeURIComponent(teamAbbr)}`,
              { cache: "no-store" },
            );

            if (!response.ok) {
              return null;
            }

            return [teamAbbr, (await response.json()) as TeamStatus] as const;
          } catch {
            return null;
          }
        }),
      );
      const nextStatuses = Object.fromEntries(
        entries.filter((entry) => entry !== null),
      );

      if (!cancelled) {
        setTeamStatuses(nextStatuses);
      }

      return nextStatuses;
    }

    loadTeamStatuses(currentTeamAbbrs);

    return () => {
      cancelled = true;
    };
  }, [teamStatusFetchKey]);

  useEffect(() => {
    const gameIds = liveGameFetchKey ? liveGameFetchKey.split("|") : [];
    if (!gameIds.length) {
      return;
    }

    let cancelled = false;

    async function loadLiveGames() {
      const entries = await Promise.all(
        gameIds.map(async (gameId) => {
          try {
            const response = await fetch(
              `/api/live-games/${encodeURIComponent(gameId)}`,
              { cache: "no-store" },
            );

            if (!response.ok) {
              return null;
            }

            return [gameId, (await response.json()) as LiveGamepack] as const;
          } catch {
            return null;
          }
        }),
      );

      if (!cancelled) {
        const nextGamepacks = Object.fromEntries(
          entries.filter((entry) => entry !== null),
        );
        setLiveGamepacks(nextGamepacks);

        if (!activeLiveTeamAbbrRef.current) {
          const activeLiveGame = liveStatusGamesRef.current
            .map((statusGame) =>
              buildLivePlayerGame(
                playerPage,
                statusGame,
                nextGamepacks[statusGame.gameId],
              ),
            )
            .find((game) => game !== null);

          if (activeLiveGame) {
            setActiveLiveTeamAbbr((currentTeamAbbr) =>
              currentTeamAbbr ?? activeLiveGame.teamAbbr,
            );
          }
        }

        const loadedGamepacks = Object.values(nextGamepacks);
        if (
          loadedGamepacks.length > 0 &&
          loadedGamepacks.every((gamepack) => isFinalLiveGamepack(gamepack))
        ) {
          window.clearInterval(intervalId);
        }
      }
    }

    loadLiveGames();
    const intervalId = window.setInterval(loadLiveGames, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [liveGameFetchKey, playerPage]);

  const livePlayerGames = liveStatusGames.flatMap((statusGame) => {
    const liveGame = buildLivePlayerGame(
      playerPage,
      statusGame,
      liveGamepacks[statusGame.gameId],
    );

    return liveGame ? [liveGame] : [];
  });

  const games = upsertLivePlayerGames(playerPage.games, livePlayerGames);
  const options = getSeasonTypeOptions(games);
  const filteredGames = getGamesForFilter(games, selectedFilter);
  const displayedGames = filteredGames.slice(0, visibleGames);
  const hasMoreGames = visibleGames < filteredGames.length;

  function selectFilter(option: SeasonTypeSelectorOption<PlayerFilter>) {
    setSelectedFilter(option.value);
    setVisibleGames(Math.min(INITIAL_GAME_COUNT, option.count));
  }

  function toggleTimelineStat(index: number) {
    setTimelineStatOn((currentStatOn) =>
      currentStatOn.map((isOn, currentIndex) =>
        currentIndex === index ? !isOn : isOn,
      ),
    );
  }

  return (
    <section>
      <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-heading">
            Player games
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SeasonTypeSelector
              ariaLabel="Filter player games by season type"
              options={options}
              selectedValue={selectedFilter}
              onSelect={selectFilter}
            />
            <p className="text-sm text-muted">
              {displayedGames.length} of {filteredGames.length}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {displayedGames.map((game) => {
            const gamePageUrl = getGamePageUrl({
              date: game.date,
              homeAway: game.homeAway,
              teamAbbr: game.teamAbbr,
              opponentAbbr: game.opponentAbbr,
            });

            return (
              <div
                key={game.gameId}
                className="rounded-[18px] bg-card-alt p-4 text-sm text-copy"
              >
                <a
                  href={gamePageUrl}
                  className="-m-2 flex flex-col gap-3 rounded-[14px] p-2 transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:flex-row sm:items-start sm:justify-between"
                  aria-label={`Open ${formatGameDate(
                    game.date,
                  )} ${game.teamAbbr} ${formatOpponentLabel(
                    game.homeAway,
                    game.opponentAbbr,
                  )} game page on Minutes Map`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${getResultBadgeClass(
                          game,
                        )}`}
                      >
                        {getResultBadgeLabel(game)}
                      </span>
                      <span className="rounded-full bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                        {formatSeasonTypeLabel(game.seasonType)}
                      </span>
                      <span className="font-medium text-foreground">
                        {game.teamAbbr}{" "}
                        {formatOpponentLabel(game.homeAway, game.opponentAbbr)}
                      </span>
                    </div>
                    <p className="mt-2 text-copy">
                      {formatGameDate(game.date)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold tracking-[-0.02em] text-heading">
                      {game.box.pts} PTS, {game.box.reb} REB, {game.box.ast} AST
                    </p>
                    <p className="mt-1 text-muted">
                      {game.teamScore} - {game.oppScore} {game.opponentName}
                    </p>
                  </div>
                </a>

                <PlayerGameBoxscore
                  playerName={playerPage.player.name}
                  box={game.box}
                />

                <PlayerGameTimeline
                  actions={game.detail?.actions}
                  segments={game.detail?.segments}
                  nbaGameId={game.nbaGameId}
                  season={game.season}
                  statOn={timelineStatOn}
                  onToggleStat={toggleTimelineStat}
                />
              </div>
            );
          })}

          {hasMoreGames ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  setVisibleGames((currentValue) =>
                    Math.min(
                      currentValue + GAME_PAGE_SIZE,
                      filteredGames.length,
                    ),
                  )
                }
                className="rounded-full border border-border-strong bg-card-alt px-5 py-2 text-sm text-copy transition-colors hover:bg-hover hover:text-foreground"
              >
                Show More Games
              </button>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
