"use client";

const GROQ_KEY = "grounded.groqKey.v1";

export function getGroqKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(GROQ_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setGroqKey(key: string) {
  try {
    const trimmed = key.trim();
    if (trimmed) window.localStorage.setItem(GROQ_KEY, trimmed);
    else window.localStorage.removeItem(GROQ_KEY);
    window.dispatchEvent(new Event("grounded:settings"));
  } catch {}
}
