import Link from "next/link";
import { TEAM_ABBREVIATIONS } from "@/lib/team-data";
import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "@/components/theme-toggle";

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
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-border-strong bg-card px-4 py-2 text-copy transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
              Teams
              <span
                className="text-[10px] leading-none transition-transform group-open:rotate-180"
                aria-hidden="true"
              >
                v
              </span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-[18px] border border-border-strong bg-card p-3 shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              <Link
                href="/"
                className="block rounded-[12px] px-3 py-2 font-medium text-heading transition-colors hover:bg-hover"
              >
                All Teams
              </Link>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {TEAM_ABBREVIATIONS.map((teamAbbr) => (
                  <Link
                    key={teamAbbr}
                    href={`/teams/${teamAbbr}`}
                    className="rounded-[10px] px-3 py-2 text-center font-mono text-xs font-semibold text-copy transition-colors hover:bg-hover hover:text-foreground"
                  >
                    {teamAbbr}
                  </Link>
                ))}
              </div>
            </div>
          </details>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
