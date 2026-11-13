import { TeamIndex } from "@/components/team-index";

export const revalidate = 3600;

export const metadata = {
  title: "Teams",
  description: "All 30 NBA teams with current records. Open one for its results, roster and game-by-game minutes maps.",
};

export default function TeamsPage() {
  return <TeamIndex />;
}
