import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { fetchIsEditor } from "@/lib/roots";
import { listMembers, sendCheckinNudge, type MemberSummary } from "@/lib/members.functions";
import { getEmailActivity, getEmailInbox, sendMemberEmail } from "@/lib/email-admin.functions";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  setAnnouncementPublished,
} from "@/lib/announcements.functions";
import { Users, UserCheck, UserPlus, Activity, Megaphone, Trash2, Mail, Inbox, RefreshCw, MessageCircleHeart, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/members")({
  head: () => ({
    meta: [
      { title: "Members — Terra Woman admin" },
      {
        name: "description",
        content:
          "Terra Woman member overview: sign-ups, onboarding status and engagement counts — no personal wellness data.",
      },
      { property: "og:title", content: "Members — Terra Woman admin" },
      { property: "og:description", content: "Member sign-up and engagement overview for Terra Woman admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <MembersAdmin />
    </AppShell>
  ),
});

function fmt(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-paper/70 px-4 py-3 ring-1 ring-line backdrop-blur-md">
      <span className="grid size-9 place-items-center rounded-full bg-sky/15 text-sky-ink">{icon}</span>
      <div>
        <div className="font-display text-2xl font-semibold leading-none">{value}</div>
        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

function MembersAdmin() {
  const { user } = useAuth();
  const [emailCheck, setEmailCheck] = useState("");
  const { data: isEditor } = useQuery({
    queryKey: ["is-editor", user?.id],
    queryFn: () => fetchIsEditor(user!.id),
    enabled: !!user,
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-members"],
    queryFn: () => listMembers(),
    enabled: !!user,
    retry: false,
  });

  if (isEditor === false) {
    return (
      <div className="rounded-2xl bg-paper/70 p-6 text-sm text-muted-foreground ring-1 ring-line backdrop-blur-md">
        This area is for Terra Woman admins only.
      </div>
    );
  }

  const members = data?.members ?? [];
  const now = Date.now();
  const active30 = members.filter(
    (m) => m.last_sign_in_at && now - new Date(m.last_sign_in_at).getTime() < 30 * 864e5,
  ).length;
  const onboarded = members.filter((m) => m.onboarded_at).length;
  const last30 = members.filter((m) => now - new Date(m.signed_up_at).getTime() < 30 * 864e5).length;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Members</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Who has joined and when they last visited — engagement counts only, never wellness content.
          </p>
        </div>
        <Link
          to="/admin/roots"
          className="rounded-full bg-paper/70 px-4 py-1.5 text-xs font-semibold text-copper-ink ring-1 ring-copper/30"
        >
          ROOTS dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Members" value={data?.total ?? 0} icon={<Users className="size-4" />} />
        <Stat label="New · 30 days" value={last30} icon={<UserPlus className="size-4" />} />
        <Stat label="Active · 30 days" value={active30} icon={<Activity className="size-4" />} />
        <Stat label="Onboarded" value={onboarded} icon={<UserCheck className="size-4" />} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading members…</p>}
      {error && (
        <p className="rounded-xl bg-copper/10 p-3 text-sm text-copper-ink ring-1 ring-copper/30">
          {(error as Error).message === "Forbidden"
            ? "Admin role required to view members."
            : "Could not load members. Please try again."}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl bg-paper/70 ring-1 ring-line backdrop-blur-md">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3">Last visit</th>
              <th className="px-4 py-3">Onboarding</th>
              <th className="px-4 py-3 text-right">Check-ins</th>
              <th className="px-4 py-3 text-right">Metric days</th>
              <th className="px-4 py-3 text-right">Devices</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Email</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: MemberSummary) => (
              <tr key={m.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold">{m.display_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </td>
                <td className="px-4 py-3">{fmt(m.signed_up_at)}</td>
                <td className="px-4 py-3">{fmt(m.last_sign_in_at)}</td>
                <td className="px-4 py-3">
                  {m.onboarded_at ? (
                    <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                      Complete
                    </span>
                  ) : (
                    <span className="rounded-full bg-clay/40 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{m.checkins}</td>
                <td className="px-4 py-3 text-right">{m.metrics_days}</td>
                <td className="px-4 py-3 text-right">{m.devices_connected}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {m.roles.length ? m.roles.join(", ") : "member"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {m.preferred_channel === "email" && m.checkin_frequency !== "none" ? (
                      <NudgeButton member={m} />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {m.preferred_channel === "email" ? "no reminders" : "in-app"}
                      </span>
                    )}
                    {m.email && (
                      <button
                        onClick={() => {
                          setEmailCheck(m.email!);
                          document
                            .getElementById("email-delivery")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="rounded-full bg-paper px-3 py-1 text-[11px] font-semibold ring-1 ring-line hover:bg-background"
                      >
                        Check delivery
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmailInboxPanel onCheckRecipient={(email) => {
        setEmailCheck(email);
        document
          .getElementById("email-delivery")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }} />
      <EmailDeliveryPanel email={emailCheck} onEmailChange={setEmailCheck} />
      <AnnouncementsPanel />
      <FeedbackPanel members={members} />
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  sent: "Sent",
  rejected: "Refused by mail provider",
  bounced: "Bounced",
  complained: "Marked as spam",
  unsubscribed: "Unsubscribed",
  suppressed: "Blocked (do-not-send list)",
  rate_limited: "Delayed (sending limit)",
};

function EmailDeliveryPanel({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (value: string) => void;
}) {
  const [checked, setChecked] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof getEmailActivity>> | null>(null);

  async function check(target: string) {
    if (!target.trim()) {
      toast.error("Enter an email address first.");
      return;
    }
    setLoading(true);
    try {
      const res = await getEmailActivity({ data: { email: target.trim() } });
      setActivity(res);
      setChecked(target.trim());
    } catch {
      toast.error("Could not load the delivery history.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTest(template: "checkin-nudge" | "signup") {
    if (!email.trim()) {
      toast.error("Enter an email address first.");
      return;
    }
    setSending(true);
    try {
      const res = await sendMemberEmail({ data: { email: email.trim(), template } });
      if (res.sent) {
        toast.success("Test email sent. Give it a minute, then refresh the history below.");
        setTimeout(() => check(email), 4000);
      } else {
        toast.info("Not sent — this address is on the do-not-send list.");
      }
    } catch {
      toast.error("Could not send the test email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id="email-delivery"
      className="space-y-4 rounded-2xl bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <Mail className="size-4 text-copper-ink" />
        <h2 className="font-display text-lg font-semibold">Email delivery check</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Send a real test email to any member and see everything that has happened to their address:
        sends, bounces, spam reports, unsubscribes and blocks. Opens aren't tracked.
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="member@example.com"
          className="min-w-[240px] flex-1 rounded-xl bg-paper px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-copper/50"
        />
        <button
          onClick={() => check(email)}
          disabled={loading}
          className="rounded-full bg-paper px-4 py-2 text-xs font-semibold ring-1 ring-line disabled:opacity-50"
        >
          {loading ? "Checking…" : "Check history"}
        </button>
        <button
          onClick={() => sendTest("checkin-nudge")}
          disabled={sending}
          className="rounded-full bg-copper px-4 py-2 text-xs font-semibold text-paper disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send test nudge"}
        </button>
        <button
          onClick={() => sendTest("signup")}
          disabled={sending}
          className="rounded-full bg-paper px-4 py-2 text-xs font-semibold text-copper-ink ring-1 ring-copper/30 disabled:opacity-50"
        >
          Send test welcome
        </button>
      </div>

      {activity && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-semibold">{checked}</span>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                activity.subscribed === false
                  ? "bg-clay/40 text-foreground"
                  : "bg-sage/20 text-foreground"
              }`}
            >
              {activity.subscribed === false ? "Unsubscribed" : "Able to receive email"}
            </span>
            {activity.history_starts_at && (
              <span className="text-muted-foreground">
                history from {fmt(activity.history_starts_at)}
              </span>
            )}
          </div>

          {activity.events.length === 0 ? (
            <p className="rounded-xl bg-paper p-3 text-xs text-muted-foreground ring-1 ring-line">
              Nothing recorded for this address in the visible window. If she expected an email,
              send a test above — then check her spam and promotions folders.
            </p>
          ) : (
            <ul className="divide-y divide-line/60 overflow-hidden rounded-xl bg-paper ring-1 ring-line">
              {activity.events.map((e, i) => (
                <li key={`${e.timestamp}-${i}`} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                  <span className="font-semibold">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
                  <span className="text-muted-foreground">
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                  {e.status && <span className="text-muted-foreground/80">· {e.status}</span>}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground">{activity.note}</p>
        </div>
      )}
    </section>
  );
}



type FeedbackRow = {
  id: string;
  user_id: string;
  category: string;
  message: string;
  page_path: string | null;
  resolved: boolean;
  created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  idea: "Idea",
  bug: "Not working",
  confusing: "Confusing",
  general: "General",
};

function FeedbackPanel({ members }: { members: MemberSummary[] }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as FeedbackRow[];
    },
  });
  const items = data ?? [];
  const open = items.filter((f) => !f.resolved);

  const emailFor = (userId: string) =>
    members.find((m) => m.id === userId)?.email ?? "member";

  return (
    <section className="space-y-4 rounded-2xl bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md">
      <div className="flex items-center gap-2">
        <MessageCircleHeart className="size-4 text-copper-ink" />
        <h2 className="font-display text-lg font-semibold">Member feedback</h2>
        <span className="rounded-full bg-copper/15 px-2.5 py-0.5 text-[11px] font-semibold text-copper-ink">
          {open.length} open
        </span>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No feedback yet — members can share thoughts from the “Help us improve” button.
        </p>
      )}

      <ul className="space-y-2.5">
        {items.map((f) => (
          <li
            key={f.id}
            className={`rounded-xl bg-paper p-3.5 ring-1 ring-line ${f.resolved ? "opacity-55" : ""}`}
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-sky/15 px-2 py-0.5 font-semibold text-sky-ink">
                {CATEGORY_LABELS[f.category] ?? f.category}
              </span>
              <span className="font-semibold text-foreground">{emailFor(f.user_id)}</span>
              <span>{fmt(f.created_at)}</span>
              {f.page_path && <span className="text-muted-foreground/70">on {f.page_path}</span>}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed">{f.message}</p>
            <div className="mt-2 flex justify-end">
              <button
                onClick={async () => {
                  const { error } = await supabase
                    .from("feedback")
                    .update({ resolved: !f.resolved })
                    .eq("id", f.id);
                  if (error) {
                    toast.error("Couldn't update that item.");
                    return;
                  }
                  queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
                }}
                className="inline-flex items-center gap-1 rounded-full bg-paper px-3 py-1 text-[11px] font-semibold ring-1 ring-line hover:bg-background"
              >
                <Check className="size-3" />
                {f.resolved ? "Reopen" : "Mark resolved"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NudgeButton({ member }: { member: MemberSummary }) {
  const [sending, setSending] = useState(false);
  return (
    <button
      disabled={sending}
      onClick={async () => {
        setSending(true);
        try {
          const res = await sendCheckinNudge({ data: { memberId: member.id } });
          if (res.sent) {
            toast.success(`Check-in nudge sent to ${member.display_name ?? member.email}.`);
          } else {
            toast.info("Not sent — this address is currently on the do-not-send list.");
          }
        } catch {
          toast.error("Could not send the nudge. Try again in a moment.");
        } finally {
          setSending(false);
        }
      }}
      className="inline-flex items-center gap-1 rounded-full bg-copper/10 px-3 py-1 text-[11px] font-semibold text-copper-ink ring-1 ring-copper/30 transition-opacity hover:opacity-80 disabled:opacity-50"
    >
      <Mail className="size-3" />
      {sending ? "Sending…" : "Send nudge"}
    </button>
  );
}

function AnnouncementsPanel() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: () => listAnnouncements(),
  });
  const announcements = data?.announcements ?? [];

  async function publish(asDraft: boolean) {
    if (!title.trim()) {
      toast.error("Give the announcement a title.");
      return;
    }
    setSaving(true);
    try {
      await createAnnouncement({
        data: { title, body, cta_label: ctaLabel, cta_url: ctaUrl, published: !asDraft },
      });
      toast.success(asDraft ? "Saved as draft." : "Published to all members.");
      setTitle("");
      setBody("");
      setCtaLabel("");
      setCtaUrl("");
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-banner"] });
    } catch {
      toast.error("Could not save the announcement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Megaphone className="size-4 text-copper-ink" />
        <h2 className="font-display text-lg font-semibold">Announce to all members</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Published announcements appear as a banner at the top of every signed-in member's app until
        they dismiss it.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. New: moon-phase insights)"
          maxLength={140}
          className="rounded-xl bg-paper px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-copper/50 sm:col-span-2"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Short message (optional)"
          maxLength={2000}
          rows={2}
          className="rounded-xl bg-paper px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-copper/50 sm:col-span-2"
        />
        <input
          value={ctaLabel}
          onChange={(e) => setCtaLabel(e.target.value)}
          placeholder="Button label (optional)"
          maxLength={60}
          className="rounded-xl bg-paper px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-copper/50"
        />
        <input
          value={ctaUrl}
          onChange={(e) => setCtaUrl(e.target.value)}
          placeholder="Button link — /cycle or https://…"
          maxLength={500}
          className="rounded-xl bg-paper px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-copper/50"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => publish(false)}
          disabled={saving}
          className="rounded-full bg-copper px-5 py-2 text-xs font-semibold text-paper transition-opacity disabled:opacity-50"
        >
          Publish now
        </button>
        <button
          onClick={() => publish(true)}
          disabled={saving}
          className="rounded-full bg-paper px-5 py-2 text-xs font-semibold ring-1 ring-line transition-opacity disabled:opacity-50"
        >
          Save draft
        </button>
      </div>

      {announcements.length > 0 && (
        <ul className="divide-y divide-line/60 border-t border-line/60">
          {announcements.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <span
                className={`size-2 shrink-0 rounded-full ${a.published ? "bg-sage" : "bg-clay"}`}
                title={a.published ? "Published" : "Draft"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.published ? "Live" : "Draft"} · {fmt(a.created_at)}
                </p>
              </div>
              <button
                onClick={async () => {
                  await setAnnouncementPublished({ data: { id: a.id, published: !a.published } });
                  queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
                  queryClient.invalidateQueries({ queryKey: ["announcement-banner"] });
                }}
                className="rounded-full bg-paper px-3 py-1 text-[11px] font-semibold ring-1 ring-line"
              >
                {a.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={async () => {
                  await deleteAnnouncement({ data: { id: a.id } });
                  queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
                  queryClient.invalidateQueries({ queryKey: ["announcement-banner"] });
                }}
                aria-label="Delete announcement"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-paper"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
