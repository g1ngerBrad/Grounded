"use client";

// The Groq API key is optional and stored only in this browser's localStorage —
// it never leaves the device except to be sent to our own API route, which uses
// it for the request and never logs or persists it server-side. If unset, the
// server falls back to the GROQ_API_KEY environment variable.
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
  } catch {
    /* storage blocked — ignore */
  }
}
