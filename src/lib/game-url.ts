const MINUTESMAP_GAME_BASE_URL = "https://minutesmap.com";

type GamePageUrlInput = {
  date: string;
  homeAway: "home" | "away";
  teamAbbr: string;
  opponentAbbr: string;
};

function formatTeamSlug(teamAbbr: string) {
  return teamAbbr.trim().toLowerCase();
}

export function getGamePageUrl({
  date,
  homeAway,
  teamAbbr,
  opponentAbbr,
}: GamePageUrlInput) {
  const awayTeamAbbr = homeAway === "home" ? opponentAbbr : teamAbbr;
  const homeTeamAbbr = homeAway === "home" ? teamAbbr : opponentAbbr;

  return `${MINUTESMAP_GAME_BASE_URL}/${date}-${formatTeamSlug(
    awayTeamAbbr,
  )}-${formatTeamSlug(homeTeamAbbr)}`;
}
