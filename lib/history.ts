"use client";

import type { Reflection } from "./types";

// Past reflections are kept locally on the device only — nothing leaves the
// browser. This keeps personal, sensitive writing private by default.
const KEY = "grounded.history.v1";
const MAX = 50;

function read(): Reflection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Reflection[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: Reflection[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
    // Let listeners in the same tab know (storage event only fires cross-tab).
    window.dispatchEvent(new Event("grounded:history"));
  } catch {
    /* storage may be full or blocked — fail quietly */
  }
}

export function getHistory(): Reflection[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getReflection(id: string): Reflection | undefined {
  return read().find((r) => r.id === id);
}

/** Insert or update a reflection, keyed by id. */
export function saveReflection(reflection: Reflection) {
  const items = read().filter((r) => r.id !== reflection.id);
  items.unshift(reflection);
  write(items);
}

export function deleteReflection(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function clearHistory() {
  write([]);
}

export function newId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  return `r_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}
