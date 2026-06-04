"use client";

import { LifeBuoy } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEmergency } from "@/app/providers";

export function BreakGlassButton() {
  const { open, isOpen } = useEmergency();
  const pathname = usePathname();

  if (isOpen || pathname === "/history") return null;

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Pause — open a calming breather"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-5 z-50 flex items-center gap-2 rounded-full bg-rose-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-transform hover:scale-[1.03] hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/50 active:scale-95"
    >
      <LifeBuoy className="h-5 w-5" strokeWidth={2} />
      Pause
    </button>
  );
}
