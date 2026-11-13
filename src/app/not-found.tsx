import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[1235px] pb-10">
      <section className="card px-6 py-14 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-heading">
          Nothing on the floor here
        </h1>
        <p className="mx-auto mt-2 max-w-[46ch] text-sm text-copy">
          That team, player or season does not have a page. Players appear once
          they have played a game in the season.
        </p>
        <Link href="/" className="pill mt-5">
          Browse all teams
        </Link>
      </section>
    </main>
  );
}
