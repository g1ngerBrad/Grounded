"use client";

import { Fragment } from "react";
import { Brain, Scale, GitFork, Check } from "lucide-react";
import type { StepKey, StepProgress } from "@/lib/types";

export const STEPS = [
  { key: "collect", label: "Collect", Icon: Brain, tint: "sky" },
  { key: "sort", label: "Sort", Icon: Scale, tint: "emerald" },
  { key: "decide", label: "Decide", Icon: GitFork, tint: "violet" },
] as const;

const RAIL_TINT = {
  sky: "bg-sky-500 text-white ring-sky-200 dark:ring-sky-900/50",
  emerald: "bg-emerald-600 text-white ring-emerald-200 dark:ring-emerald-900/50",
  violet: "bg-violet-600 text-white ring-violet-200 dark:ring-violet-900/50",
} as const;

/** Smooth-scroll a journey section into view by its data-step attribute. */
export function scrollToStep(key: StepKey) {
  document.querySelector(`[data-step="${key}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Horizontal progress stepper — designed to sit inline inside the navbar. */
export function StepRail({ active, done }: StepProgress) {
  return (
    <ol aria-label="Progress" className="flex flex-1 items-center">
      {STEPS.map((s, i) => {
        const isActive = active === s.key;
        const isDone = done[s.key];
        const last = i === STEPS.length - 1;
        return (
          <Fragment key={s.key}>
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => scrollToStep(s.key)}
                aria-label={`Go to ${s.label}`}
                aria-current={isActive ? "step" : undefined}
                className="group flex items-center gap-2"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full border transition-all ${
                    isActive
                      ? `${RAIL_TINT[s.tint]} border-transparent ring-4`
                      : isDone
                        ? "border-transparent bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "border-stone-200 bg-white/60 text-stone-400 dark:border-stone-800 dark:bg-stone-900/50"
                  }`}
                >
                  {isDone && !isActive ? <Check className="h-4 w-4" /> : <s.Icon className="h-4 w-4" strokeWidth={1.85} />}
                </span>
                <span
                  className={`hidden text-sm font-medium transition-colors sm:inline ${
                    isActive ? "text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            </li>
            {!last && (
              <li aria-hidden className="mx-2 h-0.5 flex-1 sm:mx-3">
                <span
                  className={`block h-full rounded-full transition-colors ${
                    isDone ? "bg-emerald-400 dark:bg-emerald-600" : "bg-stone-200 dark:bg-stone-800"
                  }`}
                />
              </li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}
