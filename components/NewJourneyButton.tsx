"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEmergency } from "@/app/providers";

export function NewJourneyButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen } = useEmergency();

  if (isOpen || pathname === "/history") return null;

  const start = () => {
    if (pathname !== "/") router.push("/");
    window.dispatchEvent(new Event("grounded:new-journey"));
  };

  return (
    <button
      type="button"
      onClick={start}
      aria-label="Start a new journey"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] left-5 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-[1.03] hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/50 active:scale-95"
    >
      <Plus className="h-5 w-5" strokeWidth={2.25} />
      New
    </button>
  );
}
