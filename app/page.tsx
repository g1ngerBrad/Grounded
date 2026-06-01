import Link from "next/link";
import { Brain, Scale, GitFork, ArrowRight, Clock } from "lucide-react";
import { HomeRecent } from "@/components/HomeRecent";

const steps = [
  { title: "Collect", desc: "Empty your head onto the page.", Icon: Brain, tint: "sky" },
  { title: "Sort", desc: "Separate facts from anxious assumptions.", Icon: Scale, tint: "emerald" },
  { title: "Decide", desc: "See your options laid out plainly.", Icon: GitFork, tint: "violet" },
] as const;

const tintMap = {
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
} as const;

export default function Home() {
  return (
    <div className="space-y-9">
      <section className="space-y-3 pt-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          A place to think clearly.
        </h1>
        <p className="text-stone-500 dark:text-stone-400">
          Slow the spin and find solid ground — one gentle step at a time.
        </p>
      </section>

      {/* Primary call to action */}
      <Link
        href="/reflect"
        className="group flex items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-500/20 transition-transform hover:-translate-y-0.5"
      >
        <div>
          <div className="text-lg font-semibold">Begin a reflection</div>
          <p className="mt-0.5 text-sm text-emerald-50/90">Collect → Sort → Decide</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
          <ArrowRight className="h-5 w-5" />
        </span>
      </Link>

      {/* Three-step explainer */}
      <section className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ title, desc, Icon, tint }, i) => (
          <div
            key={title}
            className="rounded-2xl border border-stone-200 bg-white/60 p-5 dark:border-stone-800 dark:bg-stone-900/40"
          >
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${tintMap[tint]}`}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="text-xs font-medium text-stone-400">Step {i + 1}</div>
            <div className="font-medium">{title}</div>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{desc}</p>
          </div>
        ))}
      </section>

      <HomeRecent />

      <Link
        href="/history"
        className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/60 px-5 py-4 transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900/40 dark:hover:border-stone-700"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
          <Clock className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="flex-1 font-medium">History</span>
        <ArrowRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
      </Link>
    </div>
  );
}
