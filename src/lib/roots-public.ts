import { supabase } from "@/integrations/supabase/client";
import type { RootsRecord } from "@/lib/roots";

/**
 * Public ROOTS reads. RLS already restricts these to
 * published = true AND historical_accuracy_status = 'VERIFIED'.
 */

export async function fetchPublishedRoots(): Promise<RootsRecord[]> {
  const { data, error } = await supabase
    .from("roots_content")
    .select("*")
    .eq("published", true)
    .eq("historical_accuracy_status", "VERIFIED")
    .order("featured", { ascending: false })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RootsRecord[];
}

export async function fetchPublishedRoot(id: string): Promise<RootsRecord | null> {
  const { data, error } = await supabase
    .from("roots_content")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .eq("historical_accuracy_status", "VERIFIED")
    .maybeSingle();
  if (error) throw error;
  return (data as RootsRecord | null) ?? null;
}

/** Related roots: same topic or content type, excluding the current story. */
export async function fetchRelatedRoots(r: RootsRecord, limit = 3): Promise<RootsRecord[]> {
  const { data, error } = await supabase
    .from("roots_content")
    .select("*")
    .eq("published", true)
    .eq("historical_accuracy_status", "VERIFIED")
    .neq("id", r.id)
    .limit(24);
  if (error) throw error;
  const all = (data ?? []) as RootsRecord[];
  const scored = all
    .map((c) => {
      let score = 0;
      if (c.topic && c.topic === r.topic) score += 3;
      if (c.content_type && c.content_type === r.content_type) score += 2;
      if (c.historical_period && c.historical_period === r.historical_period) score += 1;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.c);
}
