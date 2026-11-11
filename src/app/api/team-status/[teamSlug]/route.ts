import { getGzippedJsonText } from "@/lib/s3-json";
import { getCurrentSeason } from "@/lib/seasons";
import { isTeamAbbreviation } from "@/lib/team-data";

type TeamStatusRouteContext = {
  params: Promise<{
    teamSlug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: TeamStatusRouteContext,
) {
  const { teamSlug } = await params;
  const teamAbbr = teamSlug.toUpperCase();

  if (!isTeamAbbreviation(teamAbbr)) {
    return Response.json({ error: "Invalid team" }, { status: 400 });
  }

  // Live status only exists for the season in progress.
  const jsonText = await getGzippedJsonText(
    `data/pages/team-status/${teamAbbr}/${getCurrentSeason()}.json.gz`,
  );

  if (jsonText === null) {
    return Response.json({ error: "Team status not found" }, { status: 404 });
  }

  return new Response(jsonText, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
