import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { fetchIsEditor } from "@/lib/roots";
import { listMembers, type MemberSummary } from "@/lib/members.functions";
import { Users, UserCheck, UserPlus, Activity } from "lucide-react";

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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
