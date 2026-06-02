"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Scale,
  GitFork,
  Loader2,
  Check,
  RotateCcw,
} from "lucide-react";
import { VerseCard } from "@/components/VerseCard";
import { newId, saveReflection } from "@/lib/history";
import { getGroqKey } from "@/lib/settings";
import type { FactsResult, DecisionResult, Reflection } from "@/lib/types";

type Step = 0 | 1 | 2;

const STEPS = [
  { label: "Collect", Icon: Brain, tint: "sky" },
  { label: "Sort", Icon: Scale, tint: "emerald" },
  { label: "Decide", Icon: GitFork, tint: "violet" },
] as const;

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

export function ReflectFlow() {
  const router = useRouter();
  const idRef = useRef<string>(newId());
  const createdRef = useRef<number>(0);

  const [step, setStep] = useState<Step>(0);
  const [dump, setDump] = useState("");
  const [facts, setFacts] = useState<FactsResult | null>(null);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Persist progress to local history (upsert by id) whenever a step completes.
  const persist = useCallback((patch: Partial<Reflection>) => {
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
  }, [dump, facts, decision]);

  const runFacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generate<FactsResult>("facts", dump);
      setFacts(data);
      persist({ facts: data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [dump, persist]);

  const runDecision = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generate<DecisionResult>("decision", dump);
      setDecision(data);
      persist({ decision: data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [dump, persist]);

  const goTo = (s: Step) => {
    setError(null);
    setStep(s);
  };

  // Advance to a step and kick off its generation the first time we get there.
  const advanceTo = (s: Step) => {
    goTo(s);
    if (s === 1 && !facts) runFacts();
    if (s === 2 && !decision) runDecision();
  };

  const finish = () => {
    persist({});
    setSaved(true);
    router.push("/history");
  };

  const reset = () => {
    idRef.current = newId();
    createdRef.current = 0;
    setStep(0);
    setDump("");
    setFacts(null);
    setDecision(null);
    setError(null);
    setSaved(false);
  };

  return (
    <div className="space-y-7">
      <Stepper current={step} />

      {step === 0 && (
        <section className="animate-rise space-y-5">
          <Header
            title="Empty your head"
            desc="Write down everything that's spinning — no order, no filter. This is just a place to collect it."
          />
          <textarea
            autoFocus
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            rows={9}
            placeholder="Everything on your mind…"
            className="w-full resize-none rounded-2xl border border-stone-200 bg-white/70 p-4 text-stone-900 shadow-sm outline-none transition-colors placeholder:text-stone-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-100 dark:focus:border-sky-500 dark:focus:ring-sky-950/40"
          />
          <PrimaryButton
            onClick={() => advanceTo(1)}
            disabled={!dump.trim()}
            tint="sky"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </section>
      )}

      {step === 1 && (
        <section className="animate-rise space-y-5">
          <Header
            title="Facts vs. assumptions"
            desc="From what you wrote, here's what's verifiable — and what worry may be adding."
          />
          {loading && <Pending label="Sorting it out…" />}
          {error && <ErrorRetry message={error} onRetry={runFacts} />}
          {facts && !loading && (
            <div className="space-y-5">
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
            </div>
          )}
          <StepNav
            onBack={() => goTo(0)}
            onNext={facts ? () => advanceTo(2) : undefined}
            nextLabel="Weigh a decision"
            nextTint="violet"
          />
        </section>
      )}

      {step === 2 && (
        <section className="animate-rise space-y-5">
          <Header
            title="Lay out the options"
            desc="Seen plainly, side by side. The choice stays yours — no pressure."
          />
          {loading && <Pending label="Laying it out…" />}
          {error && <ErrorRetry message={error} onRetry={runDecision} />}
          {decision && !loading && (
            <div className="space-y-4">
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
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(1)}
              className="flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {decision && (
              <>
                <PrimaryButton onClick={finish} tint="emerald" className="flex-1">
                  {saved ? <Check className="h-4 w-4" /> : null}
                  Save & finish
                </PrimaryButton>
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm text-stone-500 transition-colors hover:text-stone-800 dark:hover:text-stone-200"
                >
                  <RotateCcw className="h-4 w-4" /> Start over
                </button>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- small presentational pieces ---------- */

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={s.label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : done
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-stone-100 text-stone-400 dark:bg-stone-800/60 dark:text-stone-500"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <s.Icon className="h-3.5 w-3.5" />}
              <span className="hidden font-medium sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 ${done ? "bg-emerald-300 dark:bg-emerald-700" : "bg-stone-200 dark:bg-stone-800"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Header({ title, desc }: { title: string; desc: string }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400">{desc}</p>
    </header>
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

const TINTS = {
  sky: "bg-sky-500 hover:bg-sky-600 ring-sky-200 dark:ring-sky-900/40",
  emerald: "bg-emerald-600 hover:bg-emerald-700 ring-emerald-200 dark:ring-emerald-900/40",
  violet: "bg-violet-600 hover:bg-violet-700 ring-violet-200 dark:ring-violet-900/40",
} as const;

function PrimaryButton({
  children,
  onClick,
  disabled,
  tint,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tint: keyof typeof TINTS;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-all focus-visible:outline-none focus-visible:ring-4 disabled:opacity-40 ${TINTS[tint]} ${className}`}
    >
      {children}
    </button>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
  nextTint,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextLabel: string;
  nextTint: keyof typeof TINTS;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      {onNext && (
        <PrimaryButton onClick={onNext} tint={nextTint} className="flex-1">
          {nextLabel} <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
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
