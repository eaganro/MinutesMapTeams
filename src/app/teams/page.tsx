export const metadata = {
  title: "Teams",
};

export default function TeamsPage() {
  return (
    <main className="mx-auto mt-2 flex w-full max-w-[1235px] flex-col gap-5 pb-10">
        <section className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
          <div className="space-y-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
              Teams Placeholder
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-heading sm:text-5xl lg:text-6xl">
              Team index goes here.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-copy sm:text-lg">
              This route is in place so you can wire real NBA team navigation
              into the updated shell, then layer in rosters, franchise notes,
              and team-specific branding as the data model comes together.
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <article className="rounded-[20px] bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Example Structure
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                "Atlantic",
                "Central",
                "Southeast",
                "Northwest",
                "Pacific",
                "Southwest",
              ].map((division) => (
                <div
                  key={division}
                  className="rounded-full border border-border-strong bg-card-alt px-4 py-2 text-sm text-copy"
                >
                  {division}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-copy">
              The chip treatment matches the softer schedule and filter controls
              used in the BasketballStats frontend, so future team navigation
              can slot into the same visual language.
            </p>
          </article>

          <article className="rounded-[20px] bg-card-alt p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Next Buildout
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-copy">
              <p>Add division and conference groupings.</p>
              <p>Link each team to a dedicated slug route.</p>
              <p>Introduce team colors only inside page content areas.</p>
            </div>
          </article>
        </section>
    </main>
  );
}
