"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Settings as SettingsIcon } from "lucide-react";

const SettingsModal = dynamic(() => import("@/components/SettingsModal"), {
  ssr: false,
});

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
