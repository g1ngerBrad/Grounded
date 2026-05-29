"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";

type Verse = { reference: string; text: string; translation: string };
type DumpResult = {
  summary: string;
  worries: string[];
  verse: Verse;
  reassurance: string;
};

export function BrainDump() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DumpResult | null>(null);
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
        body: JSON.stringify({ type: "dump", text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setResult(json.data as DumpResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Brain Dump</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Write it all out — no structure needed. I'll name the core worry and offer an anchor.
        </p>
      </header>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Everything on your mind…"
        className="w-full resize-none rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-zinc-600"
      />

      <button
        type="button"
        onClick={submit}
        disabled={loading || !text.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-medium text-white transition-opacity disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Thinking…" : "Find the anchor"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">The core of it</h2>
            <p className="mt-1 text-zinc-800 dark:text-zinc-200">{result.summary}</p>
          </div>

          {result.worries?.length > 0 && (
            <ul className="space-y-1.5">
              {result.worries.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <span className="text-zinc-300 dark:text-zinc-600">—</span>
                  {w}
                </li>
              ))}
            </ul>
          )}

          {result.verse && (
            <figure className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/40">
              <blockquote className="text-zinc-700 dark:text-zinc-200">{result.verse.text}</blockquote>
              <figcaption className="mt-2 text-xs text-zinc-400">
                {result.verse.reference} ({result.verse.translation})
              </figcaption>
            </figure>
          )}

          {result.reassurance && (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{result.reassurance}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}