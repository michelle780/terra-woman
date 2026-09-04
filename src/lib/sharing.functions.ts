import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const SHARE_SCOPES = [
  { id: "metrics", label: "Sleep, readiness, HRV & steps" },
  { id: "checkins", label: "Daily mood & symptom check-ins" },
  { id: "medications", label: "Medications & adherence" },
  { id: "cycle", label: "Menstrual cycle history" },
  { id: "journal", label: "Journal notes" },
] as const;

export type ShareScope = (typeof SHARE_SCOPES)[number]["id"];

export const RELATIONSHIPS = [
  { id: "partner", label: "Partner or family" },
  { id: "provider", label: "Medical provider" },
  { id: "coach", label: "Coach or therapist" },
  { id: "other", label: "Someone else" },
] as const;

export const CONSENT_VERSION = "v1";

export function consentStatement(params: {
  recipientName: string;
  relationship: string;
  scopeLabels: string[];
  expiresLabel: string;
}) {
  return [
    `I authorise Terra Woman to share the personal health information listed below with ${params.recipientName} (${params.relationship}).`,
    `Information shared: ${params.scopeLabels.join("; ")}.`,
    `Access ends: ${params.expiresLabel}.`,
    "I understand this information is sensitive personal data, that anyone holding the private link can view it, that Terra Woman is not a medical record system, and that I may revoke this access at any time.",
    "By typing my full legal name below I am signing this authorisation electronically, and this signature has the same effect as a handwritten signature.",
  ].join(" ");
}

export type ShareGrant = {
  id: string;
  recipient_name: string;
  recipient_email: string | null;
  relationship: string;
  scopes: string[];
  token: string;
  expires_at: string | null;
  revoked_at: string | null;
  consent_signature: string;
  consent_signed_at: string;
  consent_statement: string;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
};

const GRANT_COLUMNS =
  "id, recipient_name, recipient_email, relationship, scopes, token, expires_at, revoked_at, consent_signature, consent_signed_at, consent_statement, view_count, last_viewed_at, created_at";

export const listShareGrants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ShareGrant[]> => {
    const { data, error } = await context.supabase
      .from("share_grants")
      .select(GRANT_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ShareGrant[];
  });

function makeToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const createShareGrant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        recipientName: z.string().trim().min(2).max(120),
        recipientEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
        relationship: z.enum(["partner", "provider", "coach", "other"]),
        scopes: z.array(z.enum(["metrics", "checkins", "medications", "cycle", "journal"])).min(1),
        expiresInDays: z.number().int().min(1).max(365).nullable(),
        signature: z.string().trim().min(2).max(120),
        consentStatement: z.string().trim().min(20).max(4000),
      })
      .parse(data)
  )
  .handler(async ({ context, data }) => {
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 86400000).toISOString()
      : null;

    const { data: row, error } = await context.supabase
      .from("share_grants")
      .insert({
        owner_id: context.userId,
        recipient_name: data.recipientName,
        recipient_email: data.recipientEmail || null,
        relationship: data.relationship,
        scopes: data.scopes,
        token: makeToken(),
        expires_at: expiresAt,
        consent_signature: data.signature,
        consent_statement: data.consentStatement,
        consent_version: CONSENT_VERSION,
      })
      .select(GRANT_COLUMNS)
      .single();
    if (error) throw error;
    return row as ShareGrant;
  });

export const revokeShareGrant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("share_grants")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteShareGrant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("share_grants").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export type SharedView = {
  ok: boolean;
  reason?: "not_found" | "revoked" | "expired";
  ownerName?: string | null;
  recipientName?: string;
  scopes?: string[];
  sharedOn?: string;
  expiresAt?: string | null;
  metrics?: {
    metric_date: string;
    sleep_minutes: number | null;
    sleep_score: number | null;
    readiness: number | null;
    hrv: number | null;
    resting_hr: number | null;
    steps: number | null;
  }[];
  checkins?: ({ checkin_date: string } & Record<string, number | null>)[];
  medications?: { name: string; dose: string | null; frequency: string; active: boolean }[];
  cycle?: { start_date: string; end_date: string | null; flow: string | null; symptoms: string[] }[];
  journal?: { entry_date: string; mood: string | null; energy: number | null; symptoms: string[]; note: string | null }[];
};

/** Public: renders a shared page for anyone holding the private link. */
export const getSharedView = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ token: z.string().trim().min(10).max(120) }).parse(data))
  .handler(async ({ data }): Promise<SharedView> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: grant } = await supabaseAdmin
      .from("share_grants")
      .select("id, owner_id, recipient_name, scopes, expires_at, revoked_at, created_at, view_count")
      .eq("token", data.token)
      .maybeSingle();

    if (!grant) return { ok: false, reason: "not_found" };
    if (grant.revoked_at) return { ok: false, reason: "revoked" };
    if (grant.expires_at && new Date(grant.expires_at).getTime() < Date.now())
      return { ok: false, reason: "expired" };

    const scopes = (grant.scopes ?? []) as string[];
    const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", grant.owner_id)
      .maybeSingle();

    const out: SharedView = {
      ok: true,
      ownerName: profile?.display_name ?? null,
      recipientName: grant.recipient_name,
      scopes,
      sharedOn: grant.created_at,
      expiresAt: grant.expires_at,
    };

    if (scopes.includes("metrics")) {
      const { data: rows } = await supabaseAdmin
        .from("daily_metrics")
        .select("metric_date, sleep_minutes, sleep_score, readiness, hrv, resting_hr, steps")
        .eq("user_id", grant.owner_id)
        .gte("metric_date", since)
        .order("metric_date", { ascending: false });
      out.metrics = rows ?? [];
    }
    if (scopes.includes("checkins")) {
      const { data: rows } = await supabaseAdmin
        .from("daily_checkins")
        .select(
          "checkin_date, happiness, fulfillment, calm, energy, focus, stress, anxiety, mood_swings, bloating, cramps"
        )
        .eq("user_id", grant.owner_id)
        .gte("checkin_date", since)
        .order("checkin_date", { ascending: false });
      out.checkins = rows ?? [];
    }
    if (scopes.includes("medications")) {
      const { data: rows } = await supabaseAdmin
        .from("medications")
        .select("name, dose, frequency, active")
        .eq("user_id", grant.owner_id)
        .order("name");
      out.medications = rows ?? [];
    }
    if (scopes.includes("cycle")) {
      const { data: rows } = await supabaseAdmin
        .from("cycle_periods")
        .select("start_date, end_date, flow, symptoms")
        .eq("user_id", grant.owner_id)
        .order("start_date", { ascending: false })
        .limit(12);
      out.cycle = rows ?? [];
    }
    if (scopes.includes("journal")) {
      const { data: rows } = await supabaseAdmin
        .from("journal_entries")
        .select("entry_date, mood, energy, symptoms, note")
        .eq("user_id", grant.owner_id)
        .gte("entry_date", since)
        .order("entry_date", { ascending: false });
      out.journal = rows ?? [];
    }

    await supabaseAdmin
      .from("share_grants")
      .update({ view_count: (grant.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
      .eq("id", grant.id);
    await supabaseAdmin
      .from("share_access_log")
      .insert({ grant_id: grant.id, owner_id: grant.owner_id });

    return out;
  });
