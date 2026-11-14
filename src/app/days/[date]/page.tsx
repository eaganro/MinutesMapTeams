import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DayChart } from "@/components/day-chart";
import { DayNav } from "@/components/day-nav";
import { formatLongGameDate } from "@/lib/format";
import { getGameDay, getSeasonGameDates, isGameDate } from "@/lib/game-days";
import { getSeasonForDate } from "@/lib/seasons";

const INITIAL_PLAYER_COUNT = 10;

type PageProps = {
  params: Promise<{
    date: string;
  }>;
};

// Each day is rendered on first visit. Its players are cached for good once
// the day is final; the page itself refreshes hourly so "next day" appears.
export function generateStaticParams() {
  return [];
}

export const revalidate = 3600;

async function loadDay(date: string) {
  if (!isGameDate(date)) {
    return null;
  }

  const dates = await getSeasonGameDates(getSeasonForDate(date));
  if (!dates.includes(date)) {
    return null;
  }

  return { dates, day: await getGameDay(date) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  if (!isGameDate(date)) {
    return { title: "Day Not Found" };
  }

  const label = formatLongGameDate(date);
  return {
    title: `Top performances, ${label}`,
    description: `The best individual NBA games of ${label}, each drawn as a minutes map: when the player was on the floor and every play they made.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { date } = await params;
  const loaded = await loadDay(date);
  if (!loaded) {
    notFound();
  }

  const { dates, day } = loaded;

  return (
    <main className="mx-auto flex w-full max-w-[1235px] flex-col gap-5 pb-10">
      <section className="card px-3 py-4 sm:px-5 sm:py-5" aria-labelledby="day-title">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div>
            <h1
              id="day-title"
              className="text-2xl font-semibold tracking-[-0.02em] text-heading"
            >
              {formatLongGameDate(date)}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted">
              The day&apos;s best individual games by game score. Each line is a
              player&apos;s time on the floor; each symbol a play.
            </p>
          </div>
          <DayNav date={date} dates={dates} />
        </div>
        <div className="mt-4">
          {day ? (
            <DayChart
              players={day.players}
              ariaLabel={`Top performances, ${date}`}
              initialCount={INITIAL_PLAYER_COUNT}
            />
          ) : (
            <p className="rounded-xl bg-card-alt px-4 py-6 text-center text-sm text-muted">
              Play-by-play is not available for this day.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
