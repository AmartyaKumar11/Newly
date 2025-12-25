/**
 * Live Editing Context
 * 
 * Phase 4.1: Live Editing
 * 
 * Provides mutation broadcasting capabilities to editor components.
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Mutation } from "@/types/mutations";

interface LiveEditingContextValue {
  broadcastMutation: (mutation: Mutation) => void;
  isConnected: boolean;
}

const LiveEditingContext = createContext<LiveEditingContextValue | null>(null);

export function LiveEditingProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: LiveEditingContextValue;
}) {
  return <LiveEditingContext.Provider value={value}>{children}</LiveEditingContext.Provider>;
}

export function useLiveEditingContext(): LiveEditingContextValue {
  const context = useContext(LiveEditingContext);
  if (!context) {
    // Return no-op functions if context not available (e.g., in viewer mode)
    return {
      broadcastMutation: () => {},
      isConnected: false,
    };
  }
  return context;
}
