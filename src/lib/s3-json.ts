import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { gunzipSync } from "node:zlib";

export const DATA_BUCKET = "roryeagan.com-nba-processed-data";

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
});

// Optional: read artifacts over HTTPS instead of S3, e.g.
// PAGE_DATA_BASE_URL=https://minutesmap.com. Meant for local development
// without AWS credentials; the deployed app reads S3 directly.
const HTTP_BASE_URL = process.env.PAGE_DATA_BASE_URL?.replace(/\/+$/, "");

// Fetches an object over HTTPS. The CDN answers a missing key with 403 or 404.
async function getHttpObject(key: string) {
  const response = await fetch(`${HTTP_BASE_URL}/${key}`, { cache: "no-store" });

  if (response.status === 403 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Reading ${key} over HTTP failed with ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  // fetch already inflates Content-Encoding: gzip; only inflate raw gzip bytes.
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  return (isGzip ? gunzipSync(bytes) : bytes).toString("utf8");
}

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
  if (HTTP_BASE_URL) {
    return getHttpObject(key);
  }

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
  if (HTTP_BASE_URL) {
    const response = await fetch(`${HTTP_BASE_URL}/${key}`, {
      method: "HEAD",
      cache: "no-store",
    });
    return response.ok ? "present" : "missing";
  }

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
