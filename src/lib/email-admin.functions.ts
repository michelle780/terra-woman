import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmailActivityEvent = {
  timestamp: string;
  event_type: string;
  status?: string | null;
  message_id?: string | null;
};

export type EmailActivity = {
  recipient: string;
  events: EmailActivityEvent[];
  subscribed: boolean | null;
  history_starts_at: string | null;
  note: string | null;
};

const SENDER_DOMAIN = "notify.terrawoman.org";

async function assertAdmin(supabase: any, userId: string) {
  const { data: roleRows, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  const isAdmin = (roleRows ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Response("Forbidden", { status: 403 });
}

/** Delivery history + subscription state for one recipient. Admin only. */
export const getEmailActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ context, data }): Promise<EmailActivity> => {
    await assertAdmin(context.supabase, context.userId);

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Email API key is not configured");

    const { listEmailLogs, getEmailUnsubscribe } = await import("@lovable.dev/email-js");

    const logs = await listEmailLogs({ recipient: data.email, limit: 50 }, { apiKey });

    let subscribed: boolean | null = null;
    try {
      const sub = await getEmailUnsubscribe(
        { recipient: data.email, domain: SENDER_DOMAIN },
        { apiKey }
      );
      subscribed = sub.subscribed;
    } catch {
      subscribed = null;
    }

    return {
      recipient: data.email,
      events: (logs.data ?? []).map((e) => ({
        timestamp: e.timestamp,
        event_type: e.event_type,
        status: e.status ?? null,
        message_id: e.message_id ?? null,
      })),
      subscribed,
      history_starts_at: logs.history_starts_at ?? null,
      note: "Opens and delivery confirmations aren't tracked — only sends, bounces, complaints and unsubscribes.",
    };
  });

/** Sends a real email to a member for testing. Never deduped, so repeats work. */
export const sendMemberEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        template: z.enum(["checkin-nudge", "signup"]).default("checkin-nudge"),
        memberName: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail(data.template, data.email, {
      templateData: {
        memberName: data.memberName || "friend",
        checkinUrl: "https://terra-woman.lovable.app/today",
        appUrl: "https://terra-woman.lovable.app",
      },
      idempotencyKey: `admin-test-${crypto.randomUUID()}`,
    });

    return { sent: result.sent, reason: result.sent ? null : result.reason };
  });
