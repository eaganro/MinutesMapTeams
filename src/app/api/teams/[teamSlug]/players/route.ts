import { CURRENT_SEASON, getTeamPageData, isTeamAbbreviation } from "@/lib/team-data";

type TeamPlayersRouteContext = {
  params: Promise<{
    teamSlug: string;
  }>;
};

function getPlayerSeconds(player: {
  totals?: {
    box: {
      seconds?: number;
      min: string;
    };
  };
  box?: {
    seconds?: number;
    min: string;
  };
}) {
  return player.totals?.box.seconds ?? player.box?.seconds ?? 0;
}

export async function GET(_request: Request, { params }: TeamPlayersRouteContext) {
  const { teamSlug } = await params;
  const normalizedSlug = teamSlug.toUpperCase();

  if (!isTeamAbbreviation(normalizedSlug)) {
    return Response.json({ players: [] }, { status: 404 });
  }

  const teamPage = await getTeamPageData(normalizedSlug, CURRENT_SEASON);

  if (!teamPage) {
    return Response.json({ players: [] }, { status: 404 });
  }

  const players = [...teamPage.players]
    .sort((left, right) => getPlayerSeconds(right) - getPlayerSeconds(left))
    .map((player) => ({
      id: player.playerId,
      name: player.name,
    }));

  return Response.json({
    team: {
      abbr: teamPage.team.abbr,
      name: teamPage.team.name,
    },
    players,
  });
}
