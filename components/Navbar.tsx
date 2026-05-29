"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Anchor, Sun, Moon, Monitor } from "lucide-react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cycle = () => {
    const order = ["light", "dark", "system"] as const;
    const current = (theme ?? "system") as (typeof order)[number];
    const next = order[(order.indexOf(current) + 1) % order.length];
    setTheme(next);
  };

  const Icon =
    theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-medium tracking-tight">
          <Anchor className="h-5 w-5 text-zinc-700 dark:text-zinc-300" strokeWidth={1.75} />
          <span>Grounded</span>
        </Link>

        <button
          type="button"
          onClick={cycle}
          aria-label={`Theme: ${mounted ? theme : "system"}. Click to change.`}
          className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {mounted ? <Icon className="h-5 w-5" strokeWidth={1.75} /> : <Monitor className="h-5 w-5" strokeWidth={1.75} />}
        </button>
      </div>
    </header>
  );
}