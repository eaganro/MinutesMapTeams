"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type DayExpanded = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

const DayExpandedContext = createContext<DayExpanded | null>(null);

// Held by the /days layout, which stays mounted while moving between dates,
// so "Show top 30" carries over from one day to the next.
export function DayExpandedProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <DayExpandedContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </DayExpandedContext.Provider>
  );
}

// The shared setting under /days; local state anywhere else.
export function useDayExpanded(): DayExpanded {
  const shared = useContext(DayExpandedContext);
  const [expanded, setExpanded] = useState(false);

  return shared ?? { expanded, setExpanded };
}
