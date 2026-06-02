"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { getHistory } from "@/lib/history";
import type { Reflection } from "@/lib/types";

/** Compact preview of recent reflections shown on the home screen. */
export function HomeRecent() {
  const [items, setItems] = useState<Reflection[] | null>(null);

  useEffect(() => {
    const refresh = () => setItems(getHistory().slice(0, 3));
    refresh();
    window.addEventListener("grounded:history", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("grounded:history", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400">Recent</h2>
        <Link
          href="/history"
          className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          All history <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id}>
            <Link
              href="/history"
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900/40 dark:hover:border-stone-700"
            >
              <Clock className="h-4 w-4 shrink-0 text-stone-400" strokeWidth={1.75} />
              <span className="line-clamp-1 flex-1 text-sm text-stone-600 dark:text-stone-300">
                {r.dump || "(no notes)"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
