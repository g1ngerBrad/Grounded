"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TreePine, ArrowLeft } from "lucide-react";
import { Settings } from "@/components/Settings";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-[var(--bg)]/70 backdrop-blur-md dark:border-stone-800/60">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-1.5">
          {!isHome && (
            <Link
              href="/"
              aria-label="Back to home"
              className="-ml-1 mr-1 rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <TreePine className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <span>Grounded</span>
          </Link>
        </div>

        <Settings />
      </div>
    </header>
  );
}
