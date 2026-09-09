import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MemberSummary = {
  id: string;
  email: string | null;
  display_name: string | null;
  signed_up_at: string;
  last_sign_in_at: string | null;
  onboarded_at: string | null;
  roles: string[];
  checkins: number;
  metrics_days: number;
  devices_connected: number;
  preferred_channel: string | null;
  checkin_frequency: string | null;
};

/** Throws unless the caller is an admin. Returns true when admin. */
async function assertAdmin(supabase: any, userId: string) {
  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (roleError) throw roleError;
  const isAdmin = (roleRows ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Response("Forbidden", { status: 403 });
}

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Admin-only: verify the caller's role as the authenticated user (RLS applies).
    await assertAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Auth users: sign-up + last sign-in metadata only.
    const authUsers: { id: string; email?: string; created_at: string; last_sign_in_at?: string }[] = [];
    let page = 1;
    for (;;) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      authUsers.push(...(data?.users ?? []));
      if (!data || (data.users ?? []).length < 200) break;
      page += 1;
      if (page > 20) break; // safety cap
    }

    const [{ data: profiles }, { data: roles }, { data: checkins }, { data: metrics }, { data: devices }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id, display_name, onboarded_at, preferred_channel, checkin_frequency"),
        supabaseAdmin.from("user_roles").select("user_id, role"),
        supabaseAdmin.from("daily_checkins").select("user_id").limit(20000),
        supabaseAdmin.from("daily_metrics").select("user_id").limit(20000),
        supabaseAdmin.from("device_connections").select("user_id, status").limit(20000),
      ]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const rolesById = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = rolesById.get(r.user_id) ?? [];
      list.push(r.role);
      rolesById.set(r.user_id, list);
    }
    const countBy = (rows: { user_id: string }[] | null) => {
      const m = new Map<string, number>();
      for (const row of rows ?? []) m.set(row.user_id, (m.get(row.user_id) ?? 0) + 1);
      return m;
    };
    const checkinCounts = countBy(checkins);
    const metricCounts = countBy(metrics);
    const deviceCounts = countBy((devices ?? []).filter((d) => d.status === "connected"));

    const members: MemberSummary[] = authUsers
      .map((u) => {
        const profile = profileById.get(u.id);
        return {
          id: u.id,
          email: u.email ?? null,
          display_name: profile?.display_name ?? null,
          signed_up_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          onboarded_at: profile?.onboarded_at ?? null,
          roles: rolesById.get(u.id) ?? [],
          checkins: checkinCounts.get(u.id) ?? 0,
          metrics_days: metricCounts.get(u.id) ?? 0,
          devices_connected: deviceCounts.get(u.id) ?? 0,
          preferred_channel: profile?.preferred_channel ?? null,
          checkin_frequency: profile?.checkin_frequency ?? null,
        };
      })
      .sort((a, b) => (a.signed_up_at < b.signed_up_at ? 1 : -1));

    return { members, total: members.length };
  });

export const sendCheckinNudge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ memberId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    // Admin-only: verify the caller's role as the authenticated user (RLS applies).
    await assertAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(data.memberId);
    if (userError) throw userError;
    const email = userData.user?.email;
    if (!email) throw new Error("Member has no email address");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, preferred_channel")
      .eq("id", data.memberId)
      .maybeSingle();

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail("checkin-nudge", email, {
      templateData: {
        memberName: profile?.display_name ?? "friend",
        checkinUrl: "https://terra-woman.lovable.app/today",
      },
      idempotencyKey: `checkin-nudge-${data.memberId}-${new Date().toISOString().slice(0, 10)}`,
    });

    return { sent: result.sent, channel: profile?.preferred_channel ?? null };
  });

export type InactiveMember = {
  id: string;
  email: string;
  display_name: string | null;
  signed_up_at: string;
};

/** Members who signed up but have no check-ins, metrics, devices, meds or cycle logs. */
async function findInactiveMembers(): Promise<InactiveMember[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const authUsers: { id: string; email?: string; created_at: string }[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    authUsers.push(...(data?.users ?? []));
    if (!data || (data.users ?? []).length < 200) break;
    page += 1;
    if (page > 20) break;
  }

  const [{ data: profiles }, { data: checkins }, { data: metrics }, { data: devices }, { data: meds }, { data: cycles }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name"),
      supabaseAdmin.from("daily_checkins").select("user_id").limit(20000),
      supabaseAdmin.from("daily_metrics").select("user_id").limit(20000),
      supabaseAdmin.from("device_connections").select("user_id").limit(20000),
      supabaseAdmin.from("medications").select("user_id").limit(20000),
      supabaseAdmin.from("cycle_periods").select("user_id").limit(20000),
    ]);

  const active = new Set<string>();
  for (const rows of [checkins, metrics, devices, meds, cycles]) {
    for (const row of (rows ?? []) as { user_id: string }[]) active.add(row.user_id);
  }
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return authUsers
    .filter((u) => !!u.email && !active.has(u.id))
    .map((u) => ({
      id: u.id,
      email: u.email as string,
      display_name: nameById.get(u.id) ?? null,
      signed_up_at: u.created_at,
    }))
    .sort((a, b) => (a.signed_up_at < b.signed_up_at ? 1 : -1));
}

/** Admin preview: who would receive the getting-started email. */
export const listInactiveMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const members = await findInactiveMembers();
    return { members, total: members.length };
  });

/** Admin: send the getting-started email to every member who hasn't started. */
export const sendGettingStartedToInactive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ memberIds: z.array(z.string().uuid()).optional() }).parse(data ?? {})
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    let targets = await findInactiveMembers();
    if (data.memberIds?.length) {
      const wanted = new Set(data.memberIds);
      targets = targets.filter((m) => wanted.has(m.id));
    }

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const stamp = new Date().toISOString().slice(0, 10);

    let sent = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const member of targets) {
      try {
        const result = await sendTemplateEmail("getting-started", member.email, {
          templateData: {
            memberName: member.display_name ?? "friend",
            startUrl: "https://terrawoman.org",
          },
          idempotencyKey: `getting-started-${member.id}-${stamp}`,
        });
        if (result.sent) sent += 1;
        else skipped += 1;
      } catch {
        failures.push(member.email);
      }
    }

    return { total: targets.length, sent, skipped, failures };
  });
