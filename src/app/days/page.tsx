import { notFound, redirect } from "next/navigation";
import { getLatestGameDate } from "@/lib/game-days";

// Follows the league index, which moves to a new day at most hourly.
export const revalidate = 3600;

export default async function Page() {
  const date = await getLatestGameDate();
  if (!date) {
    notFound();
  }

  redirect(`/days/${date}`);
}
