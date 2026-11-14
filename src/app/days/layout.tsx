import type { ReactNode } from "react";
import { DayExpandedProvider } from "@/components/day-expanded";

export default function DaysLayout({ children }: { children: ReactNode }) {
  return <DayExpandedProvider>{children}</DayExpandedProvider>;
}
