import { createServerFn } from "@tanstack/react-start";
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
};

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Admin-only: verify the caller's role as the authenticated user (RLS applies).
    const { data: roleRows, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleError) throw roleError;
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

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
        supabaseAdmin.from("profiles").select("id, display_name, onboarded_at"),
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
        };
      })
      .sort((a, b) => (a.signed_up_at < b.signed_up_at ? 1 : -1));

    return { members, total: members.length };
  });
