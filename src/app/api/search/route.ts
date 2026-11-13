import { getLeagueIndex } from "@/lib/league-data";

// The player directory behind the header search box. Small, changes rarely,
// and is safe to cache at the edge and in the browser for a while.
export async function GET() {
  try {
    const { players } = await getLeagueIndex();

    return Response.json(
      { players },
      {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=3600",
        },
      },
    );
  } catch {
    return Response.json({ players: [] }, { status: 503 });
  }
}
