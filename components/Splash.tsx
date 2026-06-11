"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Phase = "visible" | "leaving" | "gone";

export function Splash() {
  const [phase, setPhase] = useState<Phase>("visible");

  useEffect(() => {
    const t = setTimeout(() => setPhase("leaving"), 550);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    const t = setTimeout(() => setPhase("gone"), 700);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      id="splash"
      role="presentation"
      aria-hidden="true"
      className={phase === "leaving" ? "splash--out" : undefined}
      onTransitionEnd={() => setPhase("gone")}
    >
      <div className="splash-mark">
        <Image
          src="/icons/icon-192.png"
          width={96}
          height={96}
          alt=""
          priority
        />
        <span className="splash-word">Grounded</span>
      </div>
    </div>
  );
}
