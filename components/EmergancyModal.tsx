"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEmergency } from "@/app/providers";

const HOLD_MS = 2000;

export function EmergencyModal() {
  const { isOpen, close } = useEmergency();
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const stopHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    setProgress(0);
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const pct = Math.min(elapsed / HOLD_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        stopHold();
        close();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [close, stopHold]
  );

  const startHold = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      stopHold();
    };
  }, [isOpen, stopHold]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="A moment to pause and breathe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 px-6 text-center backdrop-blur-xl dark:bg-zinc-950/95"
        >
          <motion.div
            aria-hidden
            className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-sky-200/50 to-emerald-200/40 blur-2xl dark:from-sky-900/30 dark:to-emerald-900/20"
            animate={{ scale: [0.85, 1.15, 0.85] }}
            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.div
            aria-hidden
            className="absolute flex h-44 w-44 items-center justify-center rounded-full border border-zinc-200 bg-white/60 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60"
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
          >
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
            >
              breathe
            </motion.span>
          </motion.div>

          <div className="relative z-10 max-w-md space-y-6">
            <p className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
              Pause. You are probably overthinking this.
            </p>

            <figure className="space-y-2">
              <blockquote className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
                Take therefore no thought for the morrow: for the morrow shall
                take thought for the things of itself. Sufficient unto the day is
                the evil thereof.
              </blockquote>
              <figcaption className="text-sm text-zinc-400">
                Matthew 6:34 (KJV)
              </figcaption>
            </figure>

            <div className="pt-4">
              <button
                type="button"
                onPointerDown={startHold}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    startHold();
                  }
                }}
                onKeyUp={stopHold}
                aria-label="Hold to close. I'm okay now."
                className="relative w-full select-none overflow-hidden rounded-full border border-zinc-300 px-6 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-300/40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left bg-emerald-500/15"
                  style={{ transform: `scaleX(${progress})`, transition: "transform 60ms linear" }}
                />
                <span className="relative">
                  {progress > 0 ? "Keep holding…" : "Hold to close — I'm okay now"}
                </span>
              </button>

              <p className="mt-4 text-xs leading-relaxed text-zinc-400">
                If this is heavier than overthinking and you might be in danger,
                please reach out to a trusted person or your local crisis line.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}