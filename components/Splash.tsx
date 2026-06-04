"use client";

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
        <svg
          width="96"
          height="96"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="splashLeaf"
              x1="128"
              y1="80"
              x2="384"
              y2="360"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#34d399" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
          </defs>
          <circle cx="256" cy="180" r="96" fill="url(#splashLeaf)" />
          <circle cx="180" cy="232" r="76" fill="url(#splashLeaf)" />
          <circle cx="332" cy="232" r="76" fill="url(#splashLeaf)" />
          <rect x="240" y="236" width="32" height="160" rx="16" fill="#92400e" />
          <path
            d="M168 404c40-28 64-28 88-28s48 0 88 28"
            stroke="#92400e"
            strokeWidth="22"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span className="splash-word">Grounded</span>
      </div>
    </div>
  );
}
