"use client";

import { useEffect, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getHistory, replaceAll } from "@/lib/history";
import { getGroqKey, setGroqKey } from "@/lib/settings";
import { fetchRemote, upsertRemote, deleteRemote } from "@/lib/supabase/reflections";
import { fetchRemoteApiKey, pushRemoteApiKey } from "@/lib/supabase/apiKeys";
import type { Reflection } from "@/lib/types";

const version = (r: Reflection) => r.updatedAt ?? r.createdAt;
const PUSH_DEBOUNCE_MS = 800;

export function SyncProvider() {
  const syncedRef = useRef<Map<string, number>>(new Map());
  const syncedUserIdRef = useRef<string | null>(null);
  const readyRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let active = true;

    const snapshot = (items: Reflection[]) =>
      new Map(items.map((r) => [r.id, version(r)] as const));

    const initialMerge = async () => {
      readyRef.current = false;
      try {
        const remote = await fetchRemote();
        if (!active) return;

        const local = getHistory();
        const byId = new Map<string, Reflection>();
        for (const r of [...remote, ...local]) {
          const existing = byId.get(r.id);
          if (!existing || version(r) > version(existing)) byId.set(r.id, r);
        }
        const merged = [...byId.values()];

        syncedRef.current = snapshot(merged);
        replaceAll(merged);
        await upsertRemote(merged);
      } catch (err) {
        console.error("History sync (initial merge) failed:", err);
      } finally {
        if (active) readyRef.current = true;
      }
    };

    const pushDiff = async () => {
      if (!readyRef.current || !syncedUserIdRef.current) return;
      try {
        const local = getHistory();
        const current = snapshot(local);
        const prev = syncedRef.current;

        const changed = local.filter((r) => {
          const before = prev.get(r.id);
          return before === undefined || version(r) > before;
        });
        const removed = [...prev.keys()].filter((id) => !current.has(id));

        if (changed.length) await upsertRemote(changed);
        if (removed.length) await deleteRemote(removed);

        syncedRef.current = current;
      } catch (err) {
        console.error("History sync (push) failed:", err);
      }
    };

    const syncGroqKey = async () => {
      try {
        const remote = await fetchRemoteApiKey("groq");
        if (!active) return;
        const local = getGroqKey();
        if (remote && !local) setGroqKey(remote);
        else if (local && !remote) await pushRemoteApiKey("groq", local);
      } catch (err) {
        console.error("Groq key sync failed:", err);
      }
    };

    const onHistoryChange = () => {
      if (!syncedUserIdRef.current) return;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(pushDiff, PUSH_DEBOUNCE_MS);
    };

    const handleUser = (userId: string | null) => {
      if (userId === syncedUserIdRef.current) return;

      if (userId) {
        syncedUserIdRef.current = userId;
        void initialMerge();
        void syncGroqKey();
      } else {
        syncedUserIdRef.current = null;
        readyRef.current = false;
        syncedRef.current = new Map();
        if (pushTimer.current) clearTimeout(pushTimer.current);
        replaceAll([]);
        setGroqKey("");
      }
    };

    window.addEventListener("grounded:history", onHistoryChange);

    supabase.auth.getUser().then(({ data }) => {
      if (active) handleUser(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) handleUser(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      window.removeEventListener("grounded:history", onHistoryChange);
      sub.subscription.unsubscribe();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, []);

  return null;
}
