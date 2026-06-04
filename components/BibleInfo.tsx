"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X, BookOpen, ExternalLink } from "lucide-react";
import { citation, citationText } from "@/lib/citation";

export function BibleInfo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Scripture & copyright information"
        className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        <Info className="h-[1.2rem] w-[1.2rem]" strokeWidth={1.75} />
      </button>
      {open && <BibleInfoModal onClose={() => setOpen(false)} />}
    </>
  );
}

function BibleInfoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-stone-900/30 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Scripture and copyright information"
        onClick={(e) => e.stopPropagation()}
        className="animate-rise my-auto w-full max-w-md rounded-3xl border border-stone-200 bg-[var(--bg)] p-6 shadow-xl dark:border-stone-800"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.9} />
            Scripture &amp; credits
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          <p>
            Verses are shown in the{" "}
            <span className="font-medium text-stone-800 dark:text-stone-100">
              {citation.name} ({citation.abbreviation})
            </span>
            .
          </p>

          <blockquote className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-[0.8rem] leading-relaxed text-stone-600 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-400">
            {citationText()}
          </blockquote>

          <a
            href={citation.publisherUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {citation.organization.replace(/®$/, "")}
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.9} />
          </a>

          <hr className="border-stone-200 dark:border-stone-800" />

          <p className="text-[0.8rem]">
            Scripture text is fetched and delivered by{" "}
            <a
              href={citation.providerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {citation.providerName}
              <ExternalLink className="h-3 w-3" strokeWidth={1.9} />
            </a>
            . With thanks to{" "}
            <a
              href={citation.providerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-stone-300 underline-offset-2 hover:decoration-emerald-400 dark:decoration-stone-600"
            >
              api.bible
            </a>{" "}
            for making Scripture freely accessible to developers.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
