import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { SiteSearch } from "@/components/site-search";
import { TeamsDropdown } from "@/components/teams-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="mx-auto mb-2 flex w-full max-w-[1235px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 py-2">
      <Link href="/" className="flex items-center gap-1.5" aria-label="MinutesMap teams home">
        <SiteLogo size={50} />
        <span className="text-[1.2rem] font-semibold sm:text-[1.4rem] leading-none tracking-[-0.02em] text-foreground">
          {siteConfig.name}
        </span>
        <span className="ml-1 hidden rounded-full border min-[420px]:inline border-border-strong bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
          Teams
        </span>
      </Link>

      <div className="flex items-center gap-1.5 sm:order-last">
        <TeamsDropdown />
        <a href={siteConfig.gamesUrl} className="pill hidden sm:inline-flex">
          Games
        </a>
        <ThemeToggle />
      </div>
      <div className="w-full sm:ml-auto sm:w-64">
        <SiteSearch />
      </div>
    </header>
  );
}
