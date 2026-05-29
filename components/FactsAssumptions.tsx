"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Scale } from "lucide-react";

type Result = {
  facts: string[];
  assumptions: string[];
  note: string;
  verse: { reference: string; text: string; translation: string };
};

export function FactsAssumptions() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "facts", text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setResult(json.data as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Facts vs. Assumptions</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Describe the worry. I'll separate what's verifiable from what fear is adding.
        </p>
      </header>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="What's worrying you?"
        className="w-full resize-none rounded-2xl border border-zinc-200 bg-white p-4 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:focus:border-zinc-600"
      />

      <button
        type="button"
        onClick={submit}
        disabled={loading || !text.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-medium text-white transition-opacity disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
        {loading ? "Sorting…" : "Sort it out"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Column title="Objective facts" tone="fact" items={result.facts} empty="No clearly objective facts found — that itself is worth noticing." />
            <Column title="Anxious assumptions" tone="assumption" items={result.assumptions} empty="Nothing flagged as assumption." />
          </div>

          {result.note && (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{result.note}</p>
          )}

          {result.verse && (
            <figure className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/40">
              <blockquote className="text-zinc-700 dark:text-zinc-200">{result.verse.text}</blockquote>
              <figcaption className="mt-2 text-xs text-zinc-400">
                {result.verse.reference} ({result.verse.translation})
              </figcaption>
            </figure>
          )}
        </motion.div>
      )}
    </div>
  );
}

function Column({
  title,
  items,
  tone,
  empty,
}: {
  title: string;
  items: string[];
  tone: "fact" | "assumption";
  empty: string;
}) {
  const accent =
    tone === "fact"
      ? "border-emerald-200 dark:border-emerald-900/40"
      : "border-amber-200 dark:border-amber-900/40";
  return (
    <div className={`rounded-2xl border ${accent} bg-white p-4 dark:bg-zinc-900/40`}>
      <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">{title}</h3>
      {items?.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((it, i) => (
            <li key={i} className="text-sm text-zinc-700 dark:text-zinc-200">{it}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">{empty}</p>
      )}
    </div>
  );
}