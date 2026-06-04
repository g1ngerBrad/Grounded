"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEmergency } from "@/app/providers";
import type { Verse } from "@/lib/types";

const HOLD_MS = 2000;

type VerseStatus = "loading" | "ready" | "error";

export function EmergencyModal() {
  const { isOpen, close } = useEmergency();
  const [holding, setHolding] = useState(false);

  const [verse, setVerse] = useState<Verse | null>(null);
  const [status, setStatus] = useState<VerseStatus>("loading");
  const lastRef = useRef<string | null>(null);
  const seed = useRef(0);

  const loadVerse = useCallback(async () => {
    seed.current += 1;
    const params = new URLSearchParams({ seed: String(seed.current) });
    if (lastRef.current) params.set("exclude", lastRef.current);
    try {
      const res = await fetch(`/api/verse?${params.toString()}`);
      const json = res.ok ? ((await res.json()) as { verse?: Verse }) : null;
      if (json?.verse?.text) {
        setVerse(json.verse);
        lastRef.current = json.verse.reference;
        setStatus("ready");
        return;
      }
      throw new Error("no verse");
    } catch {
      if (!lastRef.current) setStatus("error");
    }
  }, []);

  const fillRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const stopHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    setHolding(false);
    if (fillRef.current) fillRef.current.style.transform = "scaleX(0)";
  }, []);

  const startHold = useCallback(() => {
    if (rafRef.current) return;
    setHolding(true);
    startRef.current = null;
    const step = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const pct = Math.min((now - startRef.current) / HOLD_MS, 1);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${pct})`;
      if (pct >= 1) {
        stopHold();
        close();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [close, stopHold]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      stopHold();
    };
  }, [isOpen, stopHold]);

  useEffect(() => {
    void loadVerse();
  }, [loadVerse]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true;
    } else if (wasOpen.current) {
      wasOpen.current = false;
      void loadVerse();
    }
  }, [isOpen, loadVerse]);

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
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[var(--bg)]/95 px-6 text-center backdrop-blur-xl"
        >
          <motion.div
            aria-hidden
            className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-sky-200/50 to-emerald-200/40 blur-2xl dark:from-sky-900/30 dark:to-emerald-900/20"
            animate={{ scale: [0.85, 1.15, 0.85] }}
            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.div
            aria-hidden
            className="absolute flex h-44 w-44 items-center justify-center rounded-full border border-stone-200 bg-white/60 text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900/60"
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
          >
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
            >
            </motion.span>
          </motion.div>

          <div className="relative z-10 max-w-md space-y-6">
            <p className="text-2xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
              Pause. You are probably overthinking this.
            </p>

            <figure className="space-y-2" aria-live="polite" aria-busy={!verse && status === "loading"}>
              {verse ? (
                <>
                  <blockquote className="text-lg leading-relaxed text-stone-600 dark:text-stone-300">
                    “{verse.text}”
                  </blockquote>
                  <figcaption className="text-sm text-stone-400">
                    {verse.reference}
                    {verse.translation ? ` (${verse.translation})` : ""}
                  </figcaption>
                </>
              ) : status === "error" ? (
                <blockquote className="text-lg leading-relaxed text-stone-600 dark:text-stone-300">
                  Take a slow breath. You don&apos;t have to solve everything
                  right now — just this moment.
                </blockquote>
              ) : (
                <div className="space-y-2" aria-hidden>
                  <div className="mx-auto h-4 w-11/12 animate-pulse rounded-full bg-stone-200 dark:bg-stone-800" />
                  <div className="mx-auto h-4 w-4/5 animate-pulse rounded-full bg-stone-200 dark:bg-stone-800" />
                  <div className="mx-auto mt-3 h-3 w-28 animate-pulse rounded-full bg-stone-200 dark:bg-stone-800" />
                </div>
              )}
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
                className="relative w-full select-none overflow-hidden rounded-full border border-stone-300 px-6 py-3.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300/40 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-900"
              >
                <span
                  ref={fillRef}
                  aria-hidden
                  className="absolute inset-0 origin-left bg-emerald-500/15"
                  style={{ transform: "scaleX(0)" }}
                />
                <span className="relative">
                  {holding ? "Keep holding…" : "Hold to close — I'm okay now"}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}