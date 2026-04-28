import Link from "next/link";
import { TEAM_ABBREVIATIONS } from "@/lib/team-data";
import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { TeamsDropdown } from "@/components/teams-dropdown";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[1235px] flex-col gap-4 px-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-0">
      <Link href="/" className="flex items-center gap-3">
        <picture>
          <source
            type="image/avif"
            srcSet="/logo-70.avif 1x, /logo-140.avif 2x"
          />
          <source
            type="image/webp"
            srcSet="/logo-70.webp 1x, /logo-140.webp 2x"
          />
          <img
            src="/logo-70.png"
            srcSet="/logo-70.png 1x, /logo-140.png 2x"
            width="70"
            height="70"
            alt="MinutesMap logo"
            className="h-[50px] w-[45px] object-contain"
          />
        </picture>
        <div>
          <p className="text-[1.4rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
            {siteConfig.name}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted">
            team pages
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 text-sm">
        <nav className="flex items-center gap-2">
          <TeamsDropdown teams={[...TEAM_ABBREVIATIONS]} />
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
