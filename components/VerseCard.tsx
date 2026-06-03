import { BookOpen } from "lucide-react";
import type { Verse } from "@/lib/types";

export function VerseCard({ verse }: { verse: Verse }) {
  if (!verse?.text) return null;
  return (
    <figure className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50 p-5 dark:border-emerald-900/30 dark:from-emerald-950/30 dark:to-sky-950/20">
      <div className="mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
        <BookOpen className="h-4 w-4" strokeWidth={1.9} />
        <figcaption className="text-xs font-medium uppercase tracking-wide">
          {verse.reference}
          {verse.translation ? ` · ${verse.translation}` : ""}
        </figcaption>
      </div>
      <blockquote className="text-[0.975rem] leading-relaxed text-stone-700 dark:text-stone-200">
        “{verse.text}”
      </blockquote>
    </figure>
  );
}
