import Link from "next/link";
import { getSeasonPathSuffix } from "@/lib/seasons";

type SeasonSwitcherProps = {
  // Path of the entity without a season, e.g. "/teams/BOS".
  basePath: string;
  // Seasons with data, newest first.
  seasons: string[];
  selectedSeason: string;
};

export function SeasonSwitcher({
  basePath,
  seasons,
  selectedSeason,
}: SeasonSwitcherProps) {
  return (
    <nav
      className="flex w-fit max-w-full overflow-x-auto rounded-full border border-border-strong bg-card-alt p-0.5"
      aria-label="Season"
    >
      {seasons.map((season) => {
        const isSelected = season === selectedSeason;

        return (
          <Link
            key={season}
            href={`${basePath}${getSeasonPathSuffix(season)}`}
            aria-current={isSelected ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold tabular-nums transition-colors ${
              isSelected
                ? "bg-selected text-heading"
                : "text-muted hover:text-foreground"
            }`}
          >
            {season}
          </Link>
        );
      })}
    </nav>
  );
}
