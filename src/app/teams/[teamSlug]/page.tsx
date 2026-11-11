import type { Metadata } from "next";
import { TeamSeasonPage, getTeamSeasonMetadata } from "@/components/team-season-page";

type PageProps = {
  params: Promise<{
    teamSlug: string;
  }>;
};

// Nothing is prerendered at build time; each page is rendered on first visit
// and then cached until /api/revalidate refreshes it.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return getTeamSeasonMetadata(await params);
}

export default async function Page({ params }: PageProps) {
  const { teamSlug } = await params;

  return <TeamSeasonPage teamSlug={teamSlug} />;
}
