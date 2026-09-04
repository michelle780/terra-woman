import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Announcement = {
  id: string;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_url: string | null;
  published: boolean;
  created_at: string;
};

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw error;
  if (!(data ?? []).some((r: { role: string }) => r.role === "admin")) {
    throw new Response("Forbidden", { status: 403 });
  }
}

export const listAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("id, title, body, cta_label, cta_url, published, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { announcements: (data ?? []) as Announcement[] };
  });

const announcementInput = z.object({
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  cta_label: z.string().trim().max(60).optional().or(z.literal("")),
  cta_url: z.string().trim().max(500).optional().or(z.literal("")),
  published: z.boolean().default(true),
});

export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => announcementInput.parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("announcements").insert({
      title: data.title,
      body: data.body || null,
      cta_label: data.cta_label || null,
      cta_url: data.cta_url || null,
      published: data.published,
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const setAnnouncementPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid(), published: z.boolean() }).parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("announcements")
      .update({ published: data.published })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
