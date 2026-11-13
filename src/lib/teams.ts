// Static team facts the page artifacts do not carry: city, conference and
// brand colours. Colours mirror front/src/helpers/teamColors.js in the main
// MinutesMap repo so both sites paint a team the same way.

export const TEAM_ABBREVIATIONS = [
  "ATL",
  "BOS",
  "BKN",
  "CHA",
  "CHI",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GSW",
  "HOU",
  "IND",
  "LAC",
  "LAL",
  "MEM",
  "MIA",
  "MIL",
  "MIN",
  "NOP",
  "NYK",
  "OKC",
  "ORL",
  "PHI",
  "PHX",
  "POR",
  "SAC",
  "SAS",
  "TOR",
  "UTA",
  "WAS",
] as const;

export type TeamAbbr = (typeof TEAM_ABBREVIATIONS)[number];
export type Conference = "East" | "West";

type TeamInfo = {
  city: string;
  name: string;
  conference: Conference;
  // Brand colour on the light theme, and a brighter variant for dark.
  light: string;
  dark: string;
};

const TEAMS: Record<TeamAbbr, TeamInfo> = {
  ATL: { city: "Atlanta", name: "Hawks", conference: "East", light: "#E03A3E", dark: "#FF5A5E" },
  BOS: { city: "Boston", name: "Celtics", conference: "East", light: "#007A33", dark: "#00B84A" },
  BKN: { city: "Brooklyn", name: "Nets", conference: "East", light: "#000000", dark: "#888888" },
  CHA: { city: "Charlotte", name: "Hornets", conference: "East", light: "#1D1160", dark: "#4A3A90" },
  CHI: { city: "Chicago", name: "Bulls", conference: "East", light: "#CE1141", dark: "#FF3A5A" },
  CLE: { city: "Cleveland", name: "Cavaliers", conference: "East", light: "#860038", dark: "#B8004A" },
  DAL: { city: "Dallas", name: "Mavericks", conference: "West", light: "#00538C", dark: "#2080C0" },
  DEN: { city: "Denver", name: "Nuggets", conference: "West", light: "#0E2240", dark: "#3A5A80" },
  DET: { city: "Detroit", name: "Pistons", conference: "East", light: "#1D42BA", dark: "#4A70E0" },
  GSW: { city: "Golden State", name: "Warriors", conference: "West", light: "#1D428A", dark: "#4070C0" },
  HOU: { city: "Houston", name: "Rockets", conference: "West", light: "#CE1141", dark: "#FF3A5A" },
  IND: { city: "Indiana", name: "Pacers", conference: "East", light: "#002D62", dark: "#2060A0" },
  LAC: { city: "LA", name: "Clippers", conference: "West", light: "#1D428A", dark: "#4070C0" },
  LAL: { city: "Los Angeles", name: "Lakers", conference: "West", light: "#552583", dark: "#7848B0" },
  MEM: { city: "Memphis", name: "Grizzlies", conference: "West", light: "#5D76A9", dark: "#7A96D0" },
  MIA: { city: "Miami", name: "Heat", conference: "East", light: "#98002E", dark: "#C8204A" },
  MIL: { city: "Milwaukee", name: "Bucks", conference: "East", light: "#00471B", dark: "#10802A" },
  MIN: { city: "Minnesota", name: "Timberwolves", conference: "West", light: "#0C2340", dark: "#3A6090" },
  NOP: { city: "New Orleans", name: "Pelicans", conference: "West", light: "#002B5C", dark: "#3060A0" },
  NYK: { city: "New York", name: "Knicks", conference: "East", light: "#006BB6", dark: "#20A0E8" },
  OKC: { city: "Oklahoma City", name: "Thunder", conference: "West", light: "#007AC1", dark: "#20B8F0" },
  ORL: { city: "Orlando", name: "Magic", conference: "East", light: "#0077C0", dark: "#20A0E8" },
  PHI: { city: "Philadelphia", name: "76ers", conference: "East", light: "#006BB6", dark: "#20A0E8" },
  PHX: { city: "Phoenix", name: "Suns", conference: "West", light: "#1D1160", dark: "#4A3A90" },
  POR: { city: "Portland", name: "Trail Blazers", conference: "West", light: "#E03A3E", dark: "#FF5A5E" },
  SAC: { city: "Sacramento", name: "Kings", conference: "West", light: "#5A2D81", dark: "#8050B8" },
  SAS: { city: "San Antonio", name: "Spurs", conference: "West", light: "#000000", dark: "#909090" },
  TOR: { city: "Toronto", name: "Raptors", conference: "East", light: "#CE1141", dark: "#FF3A5A" },
  UTA: { city: "Utah", name: "Jazz", conference: "West", light: "#552583", dark: "#7848B0" },
  WAS: { city: "Washington", name: "Wizards", conference: "East", light: "#002B5C", dark: "#3060A0" },
};

export function isTeamAbbreviation(value: string): value is TeamAbbr {
  return TEAM_ABBREVIATIONS.includes(value as TeamAbbr);
}

export function getTeamInfo(teamAbbr: string): TeamInfo | null {
  return isTeamAbbreviation(teamAbbr) ? TEAMS[teamAbbr] : null;
}

// "Boston Celtics"; falls back to whatever name the caller has.
export function getTeamFullName(teamAbbr: string, fallback = teamAbbr) {
  const team = getTeamInfo(teamAbbr);
  return team ? `${team.city} ${team.name}` : fallback;
}

export function getTeamNickname(teamAbbr: string, fallback = teamAbbr) {
  return getTeamInfo(teamAbbr)?.name ?? fallback;
}

export function getTeamLogoPath(teamAbbr: string) {
  return `/img/teams/${teamAbbr}.svg`;
}

function channelToLinear(value: number) {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
}

function luminance(rgb: readonly number[]) {
  return (
    0.2126 * channelToLinear(rgb[0]) +
    0.7152 * channelToLinear(rgb[1]) +
    0.0722 * channelToLinear(rgb[2])
  );
}

function contrastRatio(left: readonly number[], right: readonly number[]) {
  const lighter = Math.max(luminance(left), luminance(right));
  const darker = Math.min(luminance(left), luminance(right));
  return (lighter + 0.05) / (darker + 0.05);
}

// Nudges a brand colour toward black (light theme) or white (dark theme)
// until it reads at WCAG AA against the card surface.
function ensureTextContrast(hex: string, surface: string, toward: number) {
  const surfaceRgb = parseHex(surface);
  let rgb: number[] = [...parseHex(hex)];

  for (let step = 0; step < 24 && contrastRatio(rgb, surfaceRgb) < 4.5; step += 1) {
    rgb = rgb.map((channel) => Math.round(channel + (toward - channel) * 0.1));
  }

  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

// CSS custom properties that scope a subtree to one team's colours. Spread
// onto an element with className="team-scope"; globals.css picks the light or
// dark value. Neutral greys when the team is unknown.
export function getTeamColorVars(teamAbbr: string): Record<string, string> {
  const team = getTeamInfo(teamAbbr);
  const light = team?.light ?? "#6c6d6f";
  const dark = team?.dark ?? "#8a8a8a";

  return {
    "--team-light": light,
    "--team-dark": dark,
    "--team-text-light": ensureTextContrast(light, "#fafafa", 0),
    "--team-text-dark": ensureTextContrast(dark, "#1e1e1e", 255),
  };
}
