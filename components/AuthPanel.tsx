"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Loader2, LogOut, Mail, Check, Eye, EyeOff, CircleUserRound } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode = "signin" | "register" | "forgot";

export function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Account</label>
      <div className="mt-2">
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-3 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking…
          </div>
        ) : !isSupabaseConfigured ? (
          <p className="rounded-xl border border-stone-200 px-3 py-3 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
            Account sync isn’t configured for this environment yet.
          </p>
        ) : user ? (
          <SignedIn user={user} />
        ) : (
          <SignedOut />
        )}
      </div>
    </div>
  );
}

function SignedIn({ user }: { user: User }) {
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    await createClient().auth.signOut();
  };

  return (
    <div className="rounded-xl border border-stone-200 p-3 dark:border-stone-800">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CircleUserRound className="h-5 w-5" strokeWidth={1.85} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">
            {user.email}
          </p>
          <p className="text-xs text-stone-400">Your journeys sync to this account.</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-60 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sign out
        </button>
      </div>
    </div>
  );
}

function SignedOut() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    if (mode !== "forgot" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const origin = window.location.origin;

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/confirm?next=/` },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/confirm?next=/auth/reset`,
        });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-stone-200 bg-white/70 px-3 py-2.5 text-base outline-none transition-colors placeholder:text-stone-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:text-sm dark:border-stone-800 dark:bg-stone-900/50 dark:focus:border-emerald-500 dark:focus:ring-emerald-950/40";

  return (
    <div>
      {mode !== "forgot" && (
        <div className="relative grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1 dark:bg-stone-800/70">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-stone-950"
            style={{
              width: "calc((100% - 0.75rem) / 2)",
              transform: `translateX(calc(${mode === "register" ? 1 : 0} * (100% + 0.25rem)))`,
            }}
          />
          {(["signin", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              className={`relative z-10 rounded-full py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? "text-stone-900 dark:text-stone-100"
                  : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              {m === "signin" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-3 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          className={inputClass}
        />

        {mode !== "forgot" && (
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-stone-400 transition-colors hover:text-stone-700 dark:hover:text-stone-200"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        {notice && (
          <p className="flex items-start gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
            <Check className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "signin" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
        </button>
      </form>

      <div className="mt-3 text-center text-xs">
        {mode === "forgot" ? (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Back to sign in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            className="inline-flex items-center gap-1 text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            <Mail className="h-3.5 w-3.5" /> Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}
