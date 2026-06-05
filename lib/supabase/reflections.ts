"use client";

import { createClient } from "./client";
import type { Reflection, FactsResult, DecisionResult, Complexity } from "@/lib/types";

const TABLE = "gr_reflections";

type Row = {
  id: string;
  created_at: number;
  updated_at: number;
  dump: string;
  complexity: Complexity | null;
  facts: FactsResult | null;
  decision: DecisionResult | null;
};

function toReflection(row: Row): Reflection {
  return {
    id: row.id,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    dump: row.dump ?? "",
    complexity: row.complexity ?? undefined,
    facts: row.facts ?? undefined,
    decision: row.decision ?? undefined,
  };
}

function toRow(r: Reflection) {
  return {
    id: r.id,
    created_at: r.createdAt,
    updated_at: r.updatedAt ?? r.createdAt,
    dump: r.dump,
    complexity: r.complexity ?? null,
    facts: r.facts ?? null,
    decision: r.decision ?? null,
  };
}

export async function fetchRemote(): Promise<Reflection[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from(TABLE).select("*");
  if (error) throw error;
  return (data as Row[]).map(toReflection);
}

export async function upsertRemote(items: Reflection[]): Promise<void> {
  if (items.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.from(TABLE).upsert(items.map(toRow));
  if (error) throw error;
}

export async function deleteRemote(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.from(TABLE).delete().in("id", ids);
  if (error) throw error;
}
