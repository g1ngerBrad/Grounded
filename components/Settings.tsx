"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { Settings as SettingsIcon, Sun, Moon, Monitor, X, Check, Eye, EyeOff } from "lucide-react";
import { getGroqKey, setGroqKey } from "@/lib/settings";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export function Settings() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("grounded:open-settings", onOpen);
    return () => window.removeEventListener("grounded:open-settings", onOpen);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Settings"
        className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        <SettingsIcon className="h-[1.2rem] w-[1.2rem]" strokeWidth={1.75} />
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-stone-900/30 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
        className="animate-rise my-auto w-full max-w-md rounded-3xl border border-stone-200 bg-[var(--bg)] p-6 shadow-xl dark:border-stone-800"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-6 space-y-7">
          <ThemeSelector />
          <GroqKeyField />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme ?? "system") : "system";
  const index = Math.max(0, THEMES.findIndex((t) => t.value === current));

  return (
    <div>
      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Appearance</label>
      <div className="relative mt-2 grid grid-cols-3 gap-1 rounded-full bg-stone-100 p-1 dark:bg-stone-800/70">
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-stone-950"
          style={{
            width: "calc((100% - 1rem) / 3)",
            transform: `translateX(calc(${index} * (100% + 0.25rem)))`,
          }}
        />
        {THEMES.map(({ value, label, Icon }) => {
          const active = current === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={active}
              className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors ${
                active
                  ? "text-stone-900 dark:text-stone-100"
                  : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.85} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GroqKeyField() {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setValue(getGroqKey()), []);
  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const save = () => {
    setGroqKey(value);
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div>
      <label htmlFor="groq-key" className="text-sm font-medium text-stone-700 dark:text-stone-300">
        Groq API key
      </label>
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <input
            id="groq-key"
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="gsk_…"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-stone-200 bg-white/70 py-2.5 pl-3 pr-10 text-base outline-none transition-colors placeholder:text-stone-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:text-sm dark:border-stone-800 dark:bg-stone-900/50 dark:focus:border-emerald-500 dark:focus:ring-emerald-950/40"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide key" : "Show key"}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-stone-400 transition-colors hover:text-stone-700 dark:hover:text-stone-200"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
