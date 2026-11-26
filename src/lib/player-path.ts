// Player URLs read /players/{id}-{name-slug}, e.g. /players/2544-lebron-james.
// next.config.ts rewrites them to /players/{id}, so the page is still cached
// (and revalidated by the backend) under the bare id path, and a stale or
// misspelt slug still finds the player.

export function getPlayerSlug(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPlayerPath(playerId: string | number, name?: string) {
  const slug = name ? getPlayerSlug(name) : "";
  return slug ? `/players/${playerId}-${slug}` : `/players/${playerId}`;
}
