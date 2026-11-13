import { getTeamLogoPath, isTeamAbbreviation } from "@/lib/teams";

// Team logo as a plain <img>: the SVGs are tiny and need no optimisation.
export function TeamLogo({
  team,
  size = 16,
  className = "",
}: {
  team: string;
  size?: number;
  className?: string;
}) {
  if (!isTeamAbbreviation(team)) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getTeamLogoPath(team)}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      loading="lazy"
      draggable={false}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
