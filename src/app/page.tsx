import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <main className="mx-auto mt-2 flex w-full max-w-[1235px] flex-col gap-5 pb-10">
        <section className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="space-y-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
                MinutesMap Frontend Styling
              </p>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-heading sm:text-5xl lg:text-6xl">
                  NBA team pages with the same clean shell as the main
                  BasketballStats frontend.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-copy sm:text-lg">
                  {siteConfig.description} This pass pulls over the sibling
                  app&apos;s neutral page background, white cards, soft borders,
                  muted typography, and pill-style controls without creating a
                  shared design system yet.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/teams"
                  className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent-strong"
                >
                  Browse Teams
                </Link>
                <a
                  href="https://vercel.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-border-strong bg-card px-6 py-3 font-medium text-copy transition-colors hover:bg-hover hover:text-foreground"
                >
                  Deploy To Vercel
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[20px] bg-card-alt p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                  Theme Carryover
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-copy">
                  <li>Cool gray page background instead of the warm gradient</li>
                  <li>White card surfaces with soft neutral borders</li>
                  <li>System font stack and restrained text hierarchy</li>
                  <li>Blue-tinted selection states with dark neutral actions</li>
                </ul>
              </div>

              <div className="rounded-[20px] bg-card p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                  Ready Next
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-copy">
                  <p>Set up team slug routes in `src/app/teams/[teamSlug]`.</p>
                  <p>Move shared roster or franchise data into `src/data`.</p>
                  <p>Layer real team branding into the content areas later.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              App Shell
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-heading">
              Centered, card-based layout
            </h2>
            <p className="mt-3 text-sm leading-7 text-copy">
              The page now follows the same overall structure as the sibling
              frontend: transparent header, fixed content width, and stacked
              surface cards over a neutral page background.
            </p>
          </article>

          <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Navigation
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-heading">
              Pill controls and subtle hover states
            </h2>
            <p className="mt-3 text-sm leading-7 text-copy">
              Header links and primary actions now use the same soft border,
              pill radius, and restrained interaction palette seen in the main
              MinutesMap UI.
            </p>
          </article>

          <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Foundation
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-heading">
              Theme tokens are local for now
            </h2>
            <p className="mt-3 text-sm leading-7 text-copy">
              The copied colors and surface tokens live directly in
              `globals.css`, which keeps this pass simple while preserving a
              straightforward path to a shared system later.
            </p>
          </article>
        </section>
    </main>
  );
}
