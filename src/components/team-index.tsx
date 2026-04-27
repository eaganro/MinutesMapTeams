import Link from "next/link";
import { CURRENT_SEASON, TEAM_ABBREVIATIONS } from "@/lib/team-data";

export function TeamIndex() {
  return (
    <main className="mx-auto mt-2 flex w-full max-w-[1235px] flex-col gap-5 pb-10">
      <section className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
          Teams
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TEAM_ABBREVIATIONS.map((teamAbbr) => (
            <Link
              key={teamAbbr}
              href={`/teams/${teamAbbr}`}
              className="rounded-[18px] border border-border-strong bg-card-alt px-4 py-4 text-sm transition-colors hover:bg-hover"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                {CURRENT_SEASON}
              </p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-heading">
                {teamAbbr}
              </p>
              <p className="mt-1 text-copy">Open team page</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
