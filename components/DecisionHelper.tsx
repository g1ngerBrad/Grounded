"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, GitFork } from "lucide-react";

type Option = { name: string; considerations: string[]; tradeoffs: string };
type Result = {
  dilemma: string;
  options: Option[];
  questions_to_pray: string[];
  verse: { reference: string; text: string; translation: string };
  note: string;
};

export function DecisionHelper() {
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
        body: JSON.stringify({ type: "decision", text }),
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
        <h1 className="text-2xl font-semibold tracking-tight">Decision Helper</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Describe the dilemma. I'll lay out the options plainly — the choice stays yours.
        </p>
      </header>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="What are you deciding between?"
        className="w-full resize-none rounded-2xl border border-zinc-200 bg-white p-4 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:focus:border-zinc-600"
      />

      <button
        type="button"
        onClick={submit}
        disabled={loading || !text.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-medium text-white transition-opacity disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitFork className="h-4 w-4" />}
        {loading ? "Laying it out…" : "Lay out the options"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {result.options?.map((opt, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
              <h3 className="font-medium">{opt.name}</h3>
              {opt.considerations?.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {opt.considerations.map((c, j) => (
                    <li key={j} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <span className="text-zinc-300 dark:text-zinc-600">—</span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              {opt.tradeoffs && (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">Trade-off: </span>
                  {opt.tradeoffs}
                </p>
              )}
            </div>
          ))}

          {result.questions_to_pray?.length > 0 && (
            <div className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/40">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">To sit with</h3>
              <ul className="mt-3 space-y-2">
                {result.questions_to_pray.map((q, i) => (
                  <li key={i} className="text-sm text-zinc-700 dark:text-zinc-200">{q}</li>
                ))}
              </ul>
            </div>
          )}

          {result.verse && (
            <figure className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/40">
              <blockquote className="text-zinc-700 dark:text-zinc-200">{result.verse.text}</blockquote>
              <figcaption className="mt-2 text-xs text-zinc-400">
                {result.verse.reference} ({result.verse.translation})
              </figcaption>
            </figure>
          )}

          {result.note && (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{result.note}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}