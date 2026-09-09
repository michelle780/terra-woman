import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { LIFE_STAGES } from "@/lib/life-stage";

const TAB_IDS = ["profile", "email", "privacy"] as const;
type TabId = (typeof TAB_IDS)[number];

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: TAB_IDS.includes(search["tab"] as TabId) ? (search["tab"] as TabId) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your account — Terra Woman" },
      {
        name: "description",
        content:
          "Update your name, season of life, focus areas, reminder rhythm and privacy settings in your private Terra Woman account.",
      },
      { property: "og:title", content: "Your account — Terra Woman" },
      {
        property: "og:description",
        content: "Manage your Terra Woman profile, email preferences and privacy settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

const FREQUENCIES = [
  { value: "daily", label: "Every day", hint: "A steady daily rhythm" },
  { value: "weekdays", label: "Weekdays", hint: "Monday through Friday" },
  { value: "few_times_week", label: "A few times a week", hint: "Three-ish nudges" },
  { value: "weekly", label: "Once a week", hint: "A gentle weekly reset" },
  { value: "none", label: "No reminders", hint: "I'll come when I come" },
] as const;

const CHANNELS = [
  { value: "app", label: "In the app", hint: "A quiet card waiting for me" },
  { value: "email", label: "Email", hint: "A short note in my inbox" },
] as const;

const FOCUS = [
  "Sleep & recovery",
  "Energy",
  "Mood & emotions",
  "Stress & anxiety",
  "Cycle & hormones",
  "Medications & supplements",
  "Movement",
  "Astrology & moon",
] as const;

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "email", label: "Email & reminders" },
  { id: "privacy", label: "Privacy & data" },
];

function AccountPage() {
  return (
    <AppShell>
      <Account />
    </AppShell>
  );
}

type Form = {
  displayName: string;
  lifeStage: string;
  lifeStageNotes: string;
  focus: string[];
  notes: string;
  frequency: string;
  reminderTime: string;
  channel: string;
};

const EMPTY: Form = {
  displayName: "",
  lifeStage: "",
  lifeStageNotes: "",
  focus: [],
  notes: "",
  frequency: "daily",
  reminderTime: "08:00",
  channel: "app",
};

function Account() {
  const { user } = useAuth();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fallback, setFallback] = useState<TabId>("profile");
  const active: TabId = tab ?? fallback;
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      displayName: profile.display_name ?? "",
      lifeStage: profile.life_stage ?? "",
      lifeStageNotes: profile.life_stage_notes ?? "",
      focus: profile.focus_areas ?? [],
      notes: profile.onboarding_notes ?? "",
      frequency: profile.checkin_frequency ?? "daily",
      reminderTime: (profile.reminder_time ?? "08:00").slice(0, 5),
      channel: profile.preferred_channel ?? "app",
    });
  }, [profile]);

  function select(id: TabId) {
    setFallback(id);
    navigate({ to: "/account", search: { tab: id }, replace: true });
  }

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      const row = {
        id: user.id,
        display_name: form.displayName.trim() || null,
        life_stage: form.lifeStage || null,
        life_stage_notes: form.lifeStageNotes.trim() || null,
        focus_areas: form.focus,
        onboarding_notes: form.notes.trim() || null,
        checkin_frequency: form.frequency,
        reminder_time: form.frequency === "none" ? null : `${form.reminderTime}:00`,
        preferred_channel: form.channel,
      };
      const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
      if (error) throw error;
      queryClient.setQueryData(["profile", user.id], (old: Record<string, unknown> | null) => ({
        ...(old ?? {}),
        ...row,
      }));
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your name, your season, how often we reach out, and who can ever see your notes.
        </p>
      </div>

      <nav className="flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => select(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ring-1 backdrop-blur-md transition-colors ${
              active === t.id
                ? "bg-sky/20 text-foreground ring-sky/30"
                : "bg-paper/70 text-muted-foreground ring-line hover:bg-copper/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {active === "profile" && (
        <section className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-line">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              What we call you
            </span>
            <input
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              placeholder="Your name"
              className="mt-1.5 w-full rounded-2xl bg-paper px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-copper/40"
            />
          </label>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Your season right now
            </span>
            <div className="mt-1.5 grid gap-1.5">
              {LIFE_STAGES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("lifeStage", s.value)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-2 text-left ring-1 transition-colors ${
                    form.lifeStage === s.value
                      ? "bg-copper/12 ring-copper/40"
                      : "bg-paper ring-line hover:bg-copper/10"
                  }`}
                >
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className="text-xs text-muted-foreground">{s.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              What matters most
            </span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {FOCUS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    set(
                      "focus",
                      form.focus.includes(item)
                        ? form.focus.filter((f) => f !== item)
                        : [...form.focus, item],
                    )
                  }
                  className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-colors ${
                    form.focus.includes(item)
                      ? "bg-copper/15 text-copper-ink ring-copper/40"
                      : "bg-paper text-muted-foreground ring-line hover:bg-copper/10"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Anything else we should know
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-2xl bg-paper px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-copper/40"
            />
          </label>

          <p className="text-xs text-muted-foreground">
            Signed in as {user?.email}. Your birth details for astrology live on the{" "}
            <Link to="/astrology" className="font-semibold hover:underline">
              Astrology &amp; Moon
            </Link>{" "}
            page.
          </p>

          <SaveButton saving={saving} onClick={save} />
        </section>
      )}

      {active === "email" && (
        <section className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-line">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              How often we nudge you
            </span>
            <div className="mt-1.5 grid gap-1.5">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => set("frequency", f.value)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-2 text-left ring-1 transition-colors ${
                    form.frequency === f.value
                      ? "bg-copper/12 ring-copper/40"
                      : "bg-paper ring-line hover:bg-copper/10"
                  }`}
                >
                  <span className="text-sm font-semibold">{f.label}</span>
                  <span className="text-xs text-muted-foreground">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {form.frequency !== "none" && (
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Best time of day
              </span>
              <input
                type="time"
                value={form.reminderTime}
                onChange={(e) => set("reminderTime", e.target.value)}
                className="mt-1.5 w-40 rounded-2xl bg-paper px-4 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-copper/40"
              />
            </label>
          )}

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Where to meet you
            </span>
            <div className="mt-1.5 grid gap-1.5">
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set("channel", c.value)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-2 text-left ring-1 transition-colors ${
                    form.channel === c.value
                      ? "bg-copper/12 ring-copper/40"
                      : "bg-paper ring-line hover:bg-copper/10"
                  }`}
                >
                  <span className="text-sm font-semibold">{c.label}</span>
                  <span className="text-xs text-muted-foreground">{c.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Emails go to {user?.email}. Choosing “No reminders” or “In the app” means we won't
            email you check-in nudges.
          </p>

          <SaveButton saving={saving} onClick={save} />
        </section>
      )}

      {active === "privacy" && <PrivacyPanel />}
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {saving ? "Saving…" : "Save changes"}
    </button>
  );
}

function PrivacyPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);

  const { data: grants } = useQuery({
    queryKey: ["account-share-grants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("share_grants")
        .select("id, recipient_name, relationship, scopes, expires_at, revoked_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const active = (grants ?? []).filter((g) => !g.revoked_at);

  async function revoke(id: string) {
    const { error } = await supabase
      .from("share_grants")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["account-share-grants"] });
    toast.success("Access revoked.");
  }

  async function exportData() {
    if (!user) return;
    setExporting(true);
    try {
      const tables = [
        "profiles",
        "daily_checkins",
        "daily_metrics",
        "journal_entries",
        "cycle_periods",
        "medications",
        "medication_logs",
        "share_grants",
      ] as const;
      const bundle: Record<string, unknown> = { exported_at: new Date().toISOString() };
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) throw error;
        bundle[table] = data ?? [];
      }
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `terra-woman-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export your data");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-lg font-semibold">Who can see your pages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing you write is shared unless you sign a consent to share it. You can withdraw
          access at any moment.
        </p>
        {active.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No one has access right now.{" "}
            <Link to="/share" className="font-semibold hover:underline">
              Share with a partner or provider
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {active.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3 ring-1 ring-line"
              >
                <div>
                  <p className="text-sm font-semibold">{g.recipient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.relationship} · {g.scopes.length} section
                    {g.scopes.length === 1 ? "" : "s"}
                    {g.expires_at
                      ? ` · until ${new Date(g.expires_at).toLocaleDateString()}`
                      : " · no end date"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(g.id)}
                  className="rounded-full bg-amber/25 px-4 py-1.5 text-xs font-bold ring-1 ring-amber/40 transition-colors hover:bg-amber/40"
                >
                  Withdraw
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Manage details and view history on the{" "}
          <Link to="/share" className="font-semibold hover:underline">
            Share
          </Link>{" "}
          page.
        </p>
      </div>

      <div className="rounded-3xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-lg font-semibold">Your copy of everything</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Download a file with your profile, check-ins, journal, cycle, medications and device
          readings — yours to keep.
        </p>
        <button
          type="button"
          onClick={exportData}
          disabled={exporting}
          className="mt-3 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {exporting ? "Preparing…" : "Download my data"}
        </button>
      </div>

      <div className="rounded-3xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-lg font-semibold">Closing your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Want everything deleted? Email{" "}
          <a href="mailto:michelle@thedigitalfuture.xyz" className="font-semibold hover:underline">
            michelle@thedigitalfuture.xyz
          </a>{" "}
          and your account and all of your entries will be removed. Read the{" "}
          <Link to="/privacy" className="font-semibold hover:underline">
            privacy promise
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
