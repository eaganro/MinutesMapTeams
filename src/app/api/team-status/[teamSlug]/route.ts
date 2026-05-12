import { GetObjectCommand, NoSuchKey, S3Client } from "@aws-sdk/client-s3";
import { gunzipSync } from "node:zlib";
import {
  CURRENT_SEASON,
  TEAM_DATA_BUCKET,
  isTeamAbbreviation,
} from "@/lib/team-data";

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
});

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

  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: TEAM_DATA_BUCKET,
        Key: `data/pages/team-status/${teamAbbr}/${CURRENT_SEASON}.json.gz`,
      }),
    );

    if (!response.Body) {
      return Response.json({ error: "Team status not found" }, { status: 404 });
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
      return Response.json({ error: "Team status not found" }, { status: 404 });
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "$metadata" in error &&
      "name" in error &&
      (error as { name?: string }).name === "NoSuchKey"
    ) {
      return Response.json({ error: "Team status not found" }, { status: 404 });
    }

    throw error;
  }
}
