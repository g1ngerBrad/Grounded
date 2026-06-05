import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const metadata = { title: "Link problem · Grounded" };

export default function AuthErrorPage() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-3xl border border-stone-200 bg-white/70 p-8 text-center shadow-sm dark:border-stone-800 dark:bg-stone-900/50">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.85} />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">This link didn’t work</h1>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
        The link may have expired or already been used. Open Settings to request a fresh one.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Back to Grounded
      </Link>
    </div>
  );
}
