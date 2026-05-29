import Link from "next/link";
import { Brain, Scale, GitFork, ArrowRight } from "lucide-react";

const tools = [
  {
    href: "/brain-dump",
    title: "Brain Dump",
    desc: "Empty your head. Get the core worry named and an anchor to hold.",
    Icon: Brain,
  },
  {
    href: "/facts-assumptions",
    title: "Facts vs. Assumptions",
    desc: "Separate what's actually true from what anxiety is adding.",
    Icon: Scale,
  },
  {
    href: "/decision",
    title: "Decision Helper",
    desc: "See your options laid out plainly — no one deciding for you.",
    Icon: GitFork,
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-2 pt-4">
        <h1 className="text-3xl font-semibold tracking-tight">A place to think clearly.</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Three tools to slow the spin and find solid ground.
        </p>
      </section>

      <nav className="grid gap-3">
        {tools.map(({ href, title, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
          >
            <div className="rounded-xl bg-zinc-100 p-2.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <div className="font-medium">{title}</div>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{desc}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600" />
          </Link>
        ))}
      </nav>
    </div>
  );
}