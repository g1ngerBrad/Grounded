"use client";

import { createClient, isSupabaseConfigured } from "./client";

export async function fetchRemoteApiKey(provider: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_user_api_key", { p_provider: provider });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function pushRemoteApiKey(provider: string, value: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return;
  const { error } = await supabase.rpc("set_user_api_key", {
    p_provider: provider,
    p_secret: value,
  });
  if (error) throw error;
}
