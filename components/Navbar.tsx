"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TreePine, Clock, ArrowLeft } from "lucide-react";
import { Settings } from "@/components/Settings";
import { StepRail } from "@/components/StepRail";
import { useJourneyProgress } from "@/app/providers";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const onHistory = pathname === "/history";
  const { progress } = useJourneyProgress();

  return (
    <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
        {onHistory ? (
          <Link
            href="/"
            aria-label="Back to your journey"
            className="-ml-1 rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        ) : (
          <Link
            href="/history"
            aria-label="History"
            className="-ml-1 rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <Clock className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        )}

        {/* Home: the journey stepper lives in the navbar. Other pages keep the brand. */}
        {isHome && progress ? (
          <StepRail active={progress.active} done={progress.done} />
        ) : !isHome && !onHistory ? (
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <TreePine className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <span>Grounded</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        <Settings />
      </div>
    </header>
  );
}
