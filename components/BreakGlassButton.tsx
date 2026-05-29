"use client";

import { LifeBuoy } from "lucide-react";
import { motion } from "framer-motion";
import { useEmergency } from "@/app/providers";

export function BreakGlassButton() {
  const { open, isOpen } = useEmergency();

  if (isOpen) return null;

  return (
    <motion.button
      type="button"
      onClick={open}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      aria-label="Pause — open a calming breather"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-5 z-40 flex items-center gap-2 rounded-full border border-red-200/60 bg-gradient-to-b from-rose-500 to-red-500 px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-red-500/25 transition-shadow hover:shadow-xl hover:shadow-red-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/40 active:scale-95 dark:border-red-400/20"
    >
      <LifeBuoy className="h-5 w-5" strokeWidth={2} />
      Pause
    </motion.button>
  );
}