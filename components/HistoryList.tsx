"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Trash2, ChevronDown, Sprout } from "lucide-react";
import { VerseCard } from "@/components/VerseCard";
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
  const [openId, setOpenId] = useState<string | null>(null);

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

  // Avoid a hydration flash — render nothing until the client reads storage.
  if (items === null) return null;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 p-10 text-center dark:border-stone-700 dark:bg-stone-900/30">
        <Sprout className="mx-auto h-8 w-8 text-emerald-500" strokeWidth={1.75} />
        <p className="mt-3 font-medium">No reflections yet</p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Your past walks through Collect → Sort → Decide will appear here.
        </p>
        <Link
          href="/reflect"
          className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Start a reflection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {items.length} {items.length === 1 ? "reflection" : "reflections"}, kept on this device.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Clear all saved reflections?")) clearHistory();
          }}
          className="text-xs font-medium text-stone-400 transition-colors hover:text-rose-500"
        >
          Clear all
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((r) => {
          const open = openId === r.id;
          return (
            <li
              key={r.id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white/70 shadow-sm dark:border-stone-800 dark:bg-stone-900/50"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : r.id)}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
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
                <ChevronDown
                  className={`mt-1 h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="animate-rise space-y-5 border-t border-stone-100 p-4 dark:border-stone-800">
                  <Section label="Brain dump">
                    <p className="whitespace-pre-wrap text-sm text-stone-600 dark:text-stone-300">
                      {r.dump || "—"}
                    </p>
                  </Section>

                  {r.facts && (
                    <Section label="Facts vs. assumptions">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <MiniList title="Facts" items={r.facts.facts} tone="emerald" />
                        <MiniList title="Assumptions" items={r.facts.assumptions} tone="amber" />
                      </div>
                    </Section>
                  )}

                  {r.decision && (
                    <Section label="Options">
                      <ul className="space-y-1.5">
                        {r.decision.options?.map((o, i) => (
                          <li key={i} className="text-sm text-stone-700 dark:text-stone-200">
                            <span className="font-medium">{o.name}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {(r.decision?.verse || r.facts?.verse) && (
                    <VerseCard verse={(r.decision?.verse || r.facts?.verse)!} />
                  )}

                  <button
                    type="button"
                    onClick={() => deleteReflection(r.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-stone-400 transition-colors hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "emerald" | "violet" }) {
  const styles =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300";
  return <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${styles}`}>{children}</span>;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">{label}</h3>
      {children}
    </div>
  );
}

function MiniList({ title, items, tone }: { title: string; items: string[]; tone: "emerald" | "amber" }) {
  const heading = tone === "emerald" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400";
  return (
    <div>
      <p className={`text-[0.7rem] font-medium uppercase tracking-wide ${heading}`}>{title}</p>
      <ul className="mt-1 space-y-1">
        {items?.length ? (
          items.map((it, i) => (
            <li key={i} className="text-sm text-stone-600 dark:text-stone-300">{it}</li>
          ))
        ) : (
          <li className="text-sm text-stone-400">—</li>
        )}
      </ul>
    </div>
  );
}
