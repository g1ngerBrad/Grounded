"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Check, Sparkles } from "lucide-react";
import { VerseCard } from "@/components/VerseCard";
import { scrollToStep } from "@/components/StepRail";
import { newId, saveReflection, getReflection } from "@/lib/history";
import { getGroqKey } from "@/lib/settings";
import { useJourneyProgress } from "@/app/providers";
import type { FactsResult, DecisionResult, Reflection, StepKey } from "@/lib/types";

async function generate<T>(type: "facts" | "decision", text: string): Promise<T> {
  const key = getGroqKey();
  const res = await fetch("/api/groq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "x-groq-key": key } : {}),
    },
    body: JSON.stringify({ type, text }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function Journey() {
  const idRef = useRef<string>(newId());
  const createdRef = useRef<number>(0);

  const [dump, setDump] = useState("");
  const [facts, setFacts] = useState<FactsResult | null>(null);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [factsLoading, setFactsLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [factsError, setFactsError] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [resumedAt, setResumedAt] = useState<number | null>(null);
  const [active, setActive] = useState<StepKey>("collect");

  // Persist progress to local history (upsert by id) on every meaningful change.
  const persist = useCallback(
    (patch: Partial<Reflection>) => {
      if (!createdRef.current) createdRef.current = Date.now();
      const record: Reflection = {
        id: idRef.current,
        createdAt: createdRef.current,
        dump,
        facts: facts ?? undefined,
        decision: decision ?? undefined,
        ...patch,
      };
      saveReflection(record);
    },
    [dump, facts, decision],
  );

  // On mount, resume a saved journey if ?id= points at one. Reading storage is
  // a one-time client-side hydration of state, so the cascading-render warning
  // does not apply here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    const saved = getReflection(id);
    if (!saved) return;
    idRef.current = saved.id;
    createdRef.current = saved.createdAt;
    setDump(saved.dump);
    setFacts(saved.facts ?? null);
    setDecision(saved.decision ?? null);
    setResumedAt(saved.createdAt);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Wipe the slate clean for a fresh journey (fired by the + button anywhere).
  const startNew = useCallback(() => {
    idRef.current = newId();
    createdRef.current = 0;
    setDump("");
    setFacts(null);
    setDecision(null);
    setFactsError(null);
    setDecisionError(null);
    setResumedAt(null);
    setActive("collect");
    window.history.replaceState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    window.addEventListener("grounded:new-journey", startNew);
    return () => window.removeEventListener("grounded:new-journey", startNew);
  }, [startNew]);

  // Turn the journey into full-height snap "pages" while it's mounted. Scoped to
  // <html> so leaving for /history restores normal scrolling.
  useEffect(() => {
    document.documentElement.classList.add("journey-snap");
    return () => document.documentElement.classList.remove("journey-snap");
  }, []);

  // Track which section is in view to light up the step slider. We anchor to a
  // line near the top of the viewport and pick the last section whose top has
  // scrolled past it. A centered band would never let the topmost step win when
  // the whole page fits on screen, leaving it stuck on the middle step.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("[data-step]"));
    const sync = () => {
      const line = window.innerHeight * 0.25;
      let current = sections[0];
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= line) current = el;
      }
      if (current) setActive(current.getAttribute("data-step") as StepKey);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const runFacts = useCallback(async () => {
    setFactsLoading(true);
    setFactsError(null);
    try {
      const data = await generate<FactsResult>("facts", dump);
      setFacts(data);
      persist({ facts: data });
    } catch (e) {
      setFactsError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setFactsLoading(false);
    }
  }, [dump, persist]);

  const runDecision = useCallback(async () => {
    setDecisionLoading(true);
    setDecisionError(null);
    try {
      const data = await generate<DecisionResult>("decision", dump);
      setDecision(data);
      persist({ decision: data });
    } catch (e) {
      setDecisionError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setDecisionLoading(false);
    }
  }, [dump, persist]);

  const hasDump = dump.trim().length > 0;
  const doneSort = !!facts;
  const doneDecide = !!decision;

  // Publish live progress to the navbar stepper; clear it when we leave.
  const { setProgress } = useJourneyProgress();
  useEffect(() => {
    setProgress({ active, done: { collect: hasDump, sort: doneSort, decide: doneDecide } });
  }, [active, hasDump, doneSort, doneDecide, setProgress]);
  useEffect(() => () => setProgress(null), [setProgress]);

  return (
    <div>
      <div>
        {resumedAt && (
          <p className="flex items-center gap-1.5 pt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" /> Picking up where you left off
          </p>
        )}

        {/* 1 · Collect ------------------------------------------------------ */}
        <Section stepKey="collect" tint="sky" eyebrow="Step 1 · Dump">
          <textarea
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            onBlur={() => hasDump && persist({})}
            rows={7}
            placeholder="Everything on your mind…"
            className="w-full resize-none rounded-2xl border border-stone-200 bg-white/70 p-4 text-stone-900 shadow-sm outline-none transition-colors placeholder:text-stone-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-100 dark:focus:border-sky-500 dark:focus:ring-sky-950/40"
          />
          {hasDump && !facts && !factsLoading && (
            <button
              type="button"
              onClick={() => {
                runFacts();
                scrollToStep("sort");
              }}
              className="mt-4 flex items-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-600"
            >
              Break it down <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </Section>

        {/* 2 · Sort -------------------------------------------------------- */}
        <Section stepKey="sort" tint="emerald" eyebrow="Step 2 · Sort">
          {factsLoading && <Pending label="Sorting it out…" />}
          {factsError && <ErrorRetry message={factsError} onRetry={runFacts} />}
          {!facts && !factsLoading && !factsError && (
            <RunPrompt
              disabled={!hasDump}
              hint={hasDump ? undefined : "Collect your thoughts above first."}
              label="Sort facts from assumptions"
              tint="emerald"
              onRun={runFacts}
            />
          )}
          {facts && !factsLoading && (
            <div className="animate-rise space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Column
                  title="Objective facts"
                  tone="fact"
                  items={facts.facts}
                  empty="No clearly objective facts found — that itself is worth noticing."
                />
                <Column
                  title="Anxious assumptions"
                  tone="assumption"
                  items={facts.assumptions}
                  empty="Nothing flagged as assumption."
                />
              </div>
              {facts.note && <Note>{facts.note}</Note>}
              {facts.verse && <VerseCard verse={facts.verse} />}
              {!decision && !decisionLoading && (
                <button
                  type="button"
                  onClick={() => {
                    runDecision();
                    scrollToStep("decide");
                  }}
                  className="flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
                >
                  Weigh the options <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </Section>

        {/* 3 · Decide ------------------------------------------------------ */}
        <Section stepKey="decide" tint="violet" eyebrow="Step 3 · Decide">
          {decisionLoading && <Pending label="Laying it out…" />}
          {decisionError && <ErrorRetry message={decisionError} onRetry={runDecision} />}
          {!decision && !decisionLoading && !decisionError && (
            <RunPrompt
              disabled={!hasDump}
              hint={hasDump ? undefined : "Collect your thoughts above first."}
              label="Lay out the options"
              tint="violet"
              onRun={runDecision}
            />
          )}
          {decision && !decisionLoading && (
            <div className="animate-rise space-y-4">
              {decision.options?.map((opt, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-stone-200 bg-white/70 p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/50"
                >
                  <h3 className="flex items-center gap-2 font-medium">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                      {i + 1}
                    </span>
                    {opt.name}
                  </h3>
                  {opt.considerations?.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {opt.considerations.map((c, j) => (
                        <li key={j} className="flex gap-2 text-sm text-stone-600 dark:text-stone-300">
                          <span className="text-violet-300 dark:text-violet-700">•</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                  {opt.tradeoffs && (
                    <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                      <span className="font-medium text-stone-600 dark:text-stone-300">Trade-off: </span>
                      {opt.tradeoffs}
                    </p>
                  )}
                </div>
              ))}

              {decision.questions_to_pray?.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    To sit with
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {decision.questions_to_pray.map((q, i) => (
                      <li key={i} className="text-sm text-stone-700 dark:text-stone-200">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {decision.verse && <VerseCard verse={decision.verse} />}
              {decision.note && <Note>{decision.note}</Note>}

              <div className="flex items-center gap-2 pt-1 text-sm text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" /> Saved to your history automatically.
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

/* ---------- section shell + presentational pieces ---------- */

const EYEBROW_TINT = {
  sky: "text-sky-600 dark:text-sky-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  violet: "text-violet-600 dark:text-violet-400",
} as const;

function Section({
  stepKey,
  tint,
  eyebrow,
  title,
  desc,
  children,
}: {
  stepKey: StepKey;
  tint: keyof typeof EYEBROW_TINT;
  eyebrow: string;
  title?: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section data-step={stepKey}>
      <header className="mb-4 space-y-1">
        <p className={`text-xs font-semibold uppercase tracking-wide ${EYEBROW_TINT[tint]}`}>{eyebrow}</p>
        {title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
        {desc && <p className="text-sm text-stone-500 dark:text-stone-400">{desc}</p>}
      </header>
      {children}
    </section>
  );
}

const RUN_TINT = {
  emerald: "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30",
  violet: "text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/30",
} as const;

function RunPrompt({
  label,
  hint,
  disabled,
  tint,
  onRun,
}: {
  label: string;
  hint?: string;
  disabled?: boolean;
  tint: keyof typeof RUN_TINT;
  onRun: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/40 p-6 text-center dark:border-stone-700 dark:bg-stone-900/30">
      <button
        type="button"
        onClick={onRun}
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-full border border-current/20 px-5 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${RUN_TINT[tint]}`}
      >
        <Sparkles className="h-4 w-4" /> {label}
      </button>
      {hint && <p className="mt-3 text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">{children}</p>;
}

function Pending({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/60 p-6 text-stone-500 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm dark:border-rose-900/40 dark:bg-rose-950/20">
      <p className="text-rose-600 dark:text-rose-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
      >
        Try again
      </button>
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
  const styles =
    tone === "fact"
      ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
      : "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20";
  const heading =
    tone === "fact"
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-amber-700 dark:text-amber-400";
  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <h3 className={`text-xs font-medium uppercase tracking-wide ${heading}`}>{title}</h3>
      {items?.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((it, i) => (
            <li key={i} className="text-sm text-stone-700 dark:text-stone-200">{it}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-400">{empty}</p>
      )}
    </div>
  );
}
