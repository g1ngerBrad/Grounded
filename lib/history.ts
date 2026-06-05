"use client";

import type { Reflection } from "./types";

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
    window.dispatchEvent(new Event("grounded:history"));
  } catch {}
}

export function getHistory(): Reflection[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getReflection(id: string): Reflection | undefined {
  return read().find((r) => r.id === id);
}

export function saveReflection(reflection: Reflection) {
  const items = read().filter((r) => r.id !== reflection.id);
  items.unshift({ ...reflection, updatedAt: Date.now() });
  write(items);
}

export function replaceAll(items: Reflection[]) {
  write([...items].sort((a, b) => b.createdAt - a.createdAt));
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
