"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { ThemeProvider } from "next-themes";
import { BreakGlassButton } from "@/components/BreakGlassButton";
import { EmergencyModal } from "@/components/EmergencyModal";
import { NewJourneyButton } from "@/components/NewJourneyButton";
import { SyncProvider } from "@/components/SyncProvider";
import type { StepProgress } from "@/lib/types";

type EmergencyCtx = { open: () => void; close: () => void; isOpen: boolean };

const EmergencyContext = createContext<EmergencyCtx | null>(null);

export function useEmergency() {
  const ctx = useContext(EmergencyContext);
  if (!ctx) throw new Error("useEmergency must be used within <Providers>");
  return ctx;
}

type JourneyProgressCtx = {
  progress: StepProgress | null;
  setProgress: (p: StepProgress | null) => void;
};

const JourneyProgressContext = createContext<JourneyProgressCtx | null>(null);

export function useJourneyProgress() {
  const ctx = useContext(JourneyProgressContext);
  if (!ctx) throw new Error("useJourneyProgress must be used within <Providers>");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const [progress, setProgress] = useState<StepProgress | null>(null);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <EmergencyContext.Provider value={{ open, close, isOpen }}>
        <JourneyProgressContext.Provider value={{ progress, setProgress }}>
          {children}
          <SyncProvider />
          <NewJourneyButton />
          <BreakGlassButton />
          <EmergencyModal />
        </JourneyProgressContext.Provider>
      </EmergencyContext.Provider>
    </ThemeProvider>
  );
}
