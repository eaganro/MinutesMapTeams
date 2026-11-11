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
      className="flex w-fit max-w-full overflow-x-auto overflow-y-hidden rounded-full border border-divider bg-card-alt"
      aria-label="Season"
    >
      {seasons.map((season) => {
        const isSelected = season === selectedSeason;

        return (
          <Link
            key={season}
            href={`${basePath}${getSeasonPathSuffix(season)}`}
            aria-current={isSelected ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap px-4 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
              isSelected
                ? "bg-selected text-heading"
                : "text-muted hover:bg-hover hover:text-foreground"
            }`}
          >
            {season}
          </Link>
        );
      })}
    </nav>
  );
}
