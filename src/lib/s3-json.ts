import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { gunzipSync } from "node:zlib";

export const DATA_BUCKET = "roryeagan.com-nba-processed-data";

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
});

function getErrorName(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error
    ? String((error as { name?: unknown }).name)
    : "";
}

export function isNotFoundError(error: unknown) {
  const name = getErrorName(error);
  return name === "NoSuchKey" || name === "NotFound";
}

// Without s3:ListBucket, S3 answers a missing key with AccessDenied instead of
// NoSuchKey, so a denied read cannot be told apart from a missing object.
function isAccessDeniedError(error: unknown) {
  return getErrorName(error) === "AccessDenied";
}

// Returns the decompressed JSON text of a .json.gz object, or null if the
// object does not exist.
export async function getGzippedJsonText(key: string) {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: DATA_BUCKET, Key: key }),
    );

    if (!response.Body) {
      return null;
    }

    const compressedBytes = await response.Body.transformToByteArray();
    return gunzipSync(Buffer.from(compressedBytes)).toString("utf8");
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getGzippedJson<T>(key: string) {
  const jsonText = await getGzippedJsonText(key);
  return jsonText === null ? null : (JSON.parse(jsonText) as T);
}

export type ObjectPresence = "present" | "missing" | "denied";

// Checks for an object by reading its first byte, which needs only the same
// s3:GetObject permission as the page reads.
export async function getObjectPresence(key: string): Promise<ObjectPresence> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: DATA_BUCKET, Key: key, Range: "bytes=0-0" }),
    );
    await response.Body?.transformToByteArray();
    return "present";
  } catch (error) {
    if (isNotFoundError(error)) {
      return "missing";
    }

    if (isAccessDeniedError(error)) {
      return "denied";
    }

    throw error;
  }
}

// Returns the subset of `seasons` whose artifact exists, in the given order.
// A denied read counts as missing, unless nothing at all was found: then the
// denial may be a credentials problem rather than absent data, so it throws
// instead of letting the caller cache a 404.
export async function findSeasonsWithData(
  seasons: string[],
  getKey: (season: string) => string,
) {
  const presences = await Promise.all(
    seasons.map((season) => getObjectPresence(getKey(season))),
  );
  const found = seasons.filter((_, index) => presences[index] === "present");

  if (found.length === 0 && presences.includes("denied")) {
    throw new Error(
      `S3 denied every read under ${getKey(seasons[0] ?? "")}; the objects are missing or the credentials lack access.`,
    );
  }

  return found;
}
