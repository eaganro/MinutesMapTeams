import { getGzippedJsonText } from "@/lib/s3-json";

type LiveGameRouteContext = {
  params: Promise<{
    gameId: string;
  }>;
};

function isValidGameId(value: string) {
  return /^[a-z0-9-]+$/i.test(value);
}

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: LiveGameRouteContext) {
  const { gameId } = await params;

  if (!isValidGameId(gameId)) {
    return Response.json({ error: "Invalid game id" }, { status: 400 });
  }

  const jsonText = await getGzippedJsonText(`data/gamepack/${gameId}.json.gz`);

  if (jsonText === null) {
    return Response.json({ error: "Game not found" }, { status: 404 });
  }

  return new Response(jsonText, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
