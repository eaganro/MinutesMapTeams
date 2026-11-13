import { TeamIndex } from "@/components/team-index";

// Standings come from the hourly league index; re-render on the same beat.
export const revalidate = 3600;

export default function Home() {
  return <TeamIndex />;
}
