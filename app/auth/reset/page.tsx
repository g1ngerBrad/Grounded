"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Check, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "no-session" | "saving" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setStatus(data.session ? "ready" : "no-session");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setStatus((s) => (s === "no-session" ? "ready" : s));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setStatus("saving");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setStatus("ready");
      return;
    }
    setStatus("done");
    setTimeout(() => router.replace("/"), 1500);
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-3xl border border-stone-200 bg-white/70 p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900/50">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
        <Lock className="h-6 w-6" strokeWidth={1.85} />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">Choose a new password</h1>

      {status === "checking" && (
        <p className="mt-4 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your link…
        </p>
      )}

      {status === "no-session" && (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            This reset link is invalid or has expired. Open Settings and use “Forgot password” to
            request a new one.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Back to Grounded
          </Link>
        </div>
      )}

      {status === "done" && (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4" /> Password updated. Taking you back…
        </p>
      )}

      {(status === "ready" || status === "saving") && (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-stone-200 bg-white/70 py-2.5 pl-3 pr-10 text-base outline-none transition-colors placeholder:text-stone-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:text-sm dark:border-stone-800 dark:bg-stone-900/50 dark:focus:border-emerald-500 dark:focus:ring-emerald-950/40"
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
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-stone-200 bg-white/70 px-3 py-2.5 text-base outline-none transition-colors placeholder:text-stone-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:text-sm dark:border-stone-800 dark:bg-stone-900/50 dark:focus:border-emerald-500 dark:focus:ring-emerald-950/40"
          />
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={status === "saving"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Update password
          </button>
        </form>
      )}
    </div>
  );
}
