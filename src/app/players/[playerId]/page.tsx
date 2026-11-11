import type { Metadata } from "next";
import { PlayerSeasonPage, getPlayerSeasonMetadata } from "@/components/player-season-page";

type PageProps = {
  params: Promise<{
    playerId: string;
  }>;
};

// Nothing is prerendered at build time; each page is rendered on first visit
// and then cached until /api/revalidate refreshes it.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return getPlayerSeasonMetadata(await params);
}

export default async function Page({ params }: PageProps) {
  const { playerId } = await params;

  return <PlayerSeasonPage playerId={playerId} />;
}
