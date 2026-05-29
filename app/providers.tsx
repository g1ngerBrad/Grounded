"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { ThemeProvider } from "next-themes";
import { BreakGlassButton } from "@/components/BreakGlassButton";
import { EmergencyModal } from "@/components/EmergencyModal";

type EmergencyCtx = { open: () => void; close: () => void; isOpen: boolean };

const EmergencyContext = createContext<EmergencyCtx | null>(null);

export function useEmergency() {
  const ctx = useContext(EmergencyContext);
  if (!ctx) throw new Error("useEmergency must be used within <Providers>");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <EmergencyContext.Provider value={{ open, close, isOpen }}>
        {children}
        <BreakGlassButton />
        <EmergencyModal />
      </EmergencyContext.Provider>
    </ThemeProvider>
  );
}