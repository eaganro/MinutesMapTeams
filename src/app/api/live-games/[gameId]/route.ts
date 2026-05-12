import { GetObjectCommand, NoSuchKey, S3Client } from "@aws-sdk/client-s3";
import { gunzipSync } from "node:zlib";
import { TEAM_DATA_BUCKET } from "@/lib/team-data";

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
});

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

  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: TEAM_DATA_BUCKET,
        Key: `data/gamepack/${gameId}.json.gz`,
      }),
    );

    if (!response.Body) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    const compressedBytes = await response.Body.transformToByteArray();
    const jsonText = gunzipSync(Buffer.from(compressedBytes)).toString("utf8");

    return new Response(jsonText, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof NoSuchKey) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "$metadata" in error &&
      "name" in error &&
      (error as { name?: string }).name === "NoSuchKey"
    ) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    throw error;
  }
}
