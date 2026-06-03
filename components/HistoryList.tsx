"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Clock, Trash2, ChevronRight, Sprout } from "lucide-react";
import { getHistory, deleteReflection, clearHistory } from "@/lib/history";
import type { Reflection } from "@/lib/types";

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function HistoryList() {
  const [items, setItems] = useState<Reflection[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const refresh = () => setItems(getHistory());
    refresh();
    window.addEventListener("grounded:history", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("grounded:history", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (items === null) return null;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 p-10 text-center dark:border-stone-700 dark:bg-stone-900/30">
        <Sprout className="mx-auto h-8 w-8 text-emerald-500" strokeWidth={1.75} />
        <p className="mt-3 font-medium">No journeys yet</p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Your walks through Collect → Sort → Decide will appear here.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Start a journey
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="text-xs font-medium text-stone-400 transition-colors hover:text-rose-500"
        >
          Clear all
        </button>
      </div>

      {confirmClear && (
        <ConfirmClear
          count={items.length}
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            clearHistory();
            setConfirmClear(false);
          }}
        />
      )}

      <ul className="space-y-3">
        {items.map((r) => (
          <li
            key={r.id}
            className="group relative flex items-stretch rounded-2xl border border-stone-200 bg-white/70 shadow-sm transition-colors hover:border-emerald-300 dark:border-stone-800 dark:bg-stone-900/50 dark:hover:border-emerald-800"
          >
            <Link href={`/?id=${r.id}`} className="flex min-w-0 flex-1 items-start gap-3 p-4">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                <Clock className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-stone-400">{formatDate(r.createdAt)}</span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-stone-700 dark:text-stone-200">
                  {r.dump || "(no notes)"}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.facts && <Tag tone="emerald">Sorted</Tag>}
                  {r.decision && <Tag tone="violet">Decided</Tag>}
                </span>
              </span>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-emerald-500 dark:text-stone-600" />
            </Link>
            <button
              type="button"
              onClick={() => deleteReflection(r.id)}
              aria-label="Delete journey"
              className="absolute right-2 top-2 rounded-full p-1.5 text-stone-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-stone-600 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfirmClear({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-stone-900/30 p-4 backdrop-blur-sm sm:p-6"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Clear all journeys"
        onClick={(e) => e.stopPropagation()}
        className="animate-rise my-auto w-full max-w-sm rounded-3xl border border-stone-200 bg-[var(--bg)] p-6 shadow-xl dark:border-stone-800"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
            <Trash2 className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">Clear all journeys?</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              This permanently removes all {count} {count === 1 ? "journey" : "journeys"}&nbsp;saved on
              this device. This can&apos;t be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "emerald" | "violet" }) {
  const styles =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300";
  return <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${styles}`}>{children}</span>;
}
