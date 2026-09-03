import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

import { CheckInCard } from "@/components/CheckInCard";
import { DailyQuoteCard } from "@/components/DailyQuoteCard";
import { InviteCard } from "@/components/InviteCard";

import { useAuth } from "@/lib/auth";
import {
  fetchJournal,
  fetchMedicationLogs,
  fetchMedications,
  fetchMetrics,
  formatSleep,
  formatTime,
  lastNDays,
  todayKey,
  type DailyMetric,
} from "@/lib/wellness";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse — your private daily wellness log" },
      {
        name: "description",
        content:
          "Track sleep, readiness, HRV, energy, symptoms and medications in one calm private log, and see how they move together.",
      },
      { property: "og:title", content: "Pulse — your private daily wellness log" },
      {
        property: "og:description",
        content: "Ring and watch metrics, medications, symptoms and daily journal in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // AppShell redirects to /auth when signed out, so Today is always the
  // landing page after sign-in.
  return (
    <AppShell>
      <Today />
    </AppShell>
  );
}


function Gauge({ value }: { value: number | null }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="relative mx-auto size-44 shrink-0 md:mx-0">
      <div className="absolute inset-0 rounded-full bg-sky/15" />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(var(--sky) 0deg ${pct * 3.6}deg, transparent ${pct * 3.6}deg 360deg)`,
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 13px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 13px))",
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-5xl leading-none font-semibold">
            {value ?? "—"}
          </div>
          <div className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Readiness
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ dot, label, value, sub }: { dot: string; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-background px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span className={`size-2 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function MetricsForm({ metric, onDone }: { metric?: DailyMetric | undefined; onDone: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState({
    readiness: metric?.readiness?.toString() ?? "",
    sleep_minutes: metric?.sleep_minutes?.toString() ?? "",
    sleep_score: metric?.sleep_score?.toString() ?? "",
    hrv: metric?.hrv?.toString() ?? "",
    resting_hr: metric?.resting_hr?.toString() ?? "",
    steps: metric?.steps?.toString() ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const num = (v: string) => (v.trim() === "" ? null : Number(v));
      const { error } = await supabase.from("daily_metrics").upsert(
        {
          user_id: user!.id,
          metric_date: todayKey(),
          readiness: num(form.readiness),
          sleep_minutes: num(form.sleep_minutes),
          sleep_score: num(form.sleep_score),
          hrv: num(form.hrv),
          resting_hr: num(form.resting_hr),
          steps: num(form.steps),
          source: "manual",
        },
        { onConflict: "user_id,metric_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metrics"] });
      toast.success("Today's numbers saved");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fields: Array<[keyof typeof form, string]> = [
    ["readiness", "Readiness (0-100)"],
    ["sleep_minutes", "Sleep (minutes)"],
    ["sleep_score", "Sleep score"],
    ["hrv", "HRV (ms)"],
    ["resting_hr", "Resting HR"],
    ["steps", "Steps"],
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {fields.map(([key, label]) => (
        <label key={key} className="block">
          <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
          <input
            inputMode="numeric"
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      ))}
      <div className="col-span-2 flex gap-2 sm:col-span-3">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          Save numbers
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full bg-background px-4 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-line"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Today() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = todayKey();
  const week = lastNDays(7);
  const from = week[0] as string;
  const [editing, setEditing] = useState(false);

  const metricsQ = useQuery({
    queryKey: ["metrics", from, today],
    queryFn: () => fetchMetrics(from, today),
  });
  const medsQ = useQuery({ queryKey: ["medications"], queryFn: fetchMedications });
  const logsQ = useQuery({
    queryKey: ["medication-logs", today],
    queryFn: () => fetchMedicationLogs(today, today),
  });
  const journalQ = useQuery({
    queryKey: ["journal", today],
    queryFn: () => fetchJournal(today, today),
  });

  const metric = metricsQ.data?.find((m) => m.metric_date === today);
  const meds = (medsQ.data ?? []).filter((m) => m.active);
  const takenIds = new Set((logsQ.data ?? []).map((l) => l.medication_id));
  const entry = journalQ.data?.[0];

  const toggle = useMutation({
    mutationFn: async (medicationId: string) => {
      if (takenIds.has(medicationId)) {
        const { error } = await supabase
          .from("medication_logs")
          .delete()
          .eq("medication_id", medicationId)
          .eq("taken_on", today);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("medication_logs")
          .insert({ user_id: user!.id, medication_id: medicationId, taken_on: today });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medication-logs"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const sleepSeries = week.map((d) => metricsQ.data?.find((m) => m.metric_date === d)?.sleep_score ?? 0);
  const maxSleep = Math.max(100, ...sleepSeries);
  const scored = sleepSeries.filter((s) => s > 0);
  const avgSleep = scored.length
    ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
    : null;

  return (
    <>
      <section className="rise mt-4 rounded-[28px] bg-paper p-5 ring-1 ring-line sm:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Gauge value={metric?.readiness ?? null} />
          <div className="flex-1">
            <p className="eyebrow">This morning</p>
            <h1 className="mt-1 text-3xl leading-tight text-balance sm:text-4xl">
              {metric?.readiness
                ? metric.readiness >= 80
                  ? "You're well recovered"
                  : "Take the first hour gently"
                : "Log today's numbers"}
            </h1>
            <p className="mt-2 max-w-[52ch] text-base text-pretty text-muted-foreground">
              {metric
                ? "Ring and watch numbers for today are recorded. Live syncing with Oura and Apple Watch can be switched on later."
                : "Nothing recorded yet today. Add your ring and watch numbers manually until live syncing is connected."}
            </p>
            <button
              onClick={() => setEditing((v) => !v)}
              className="mt-3 rounded-full bg-sky/20 px-4 py-1.5 text-xs font-bold ring-1 ring-sky/30"
            >
              {metric ? "Edit today's numbers" : "Add today's numbers"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1 lg:grid-cols-2">
            <Stat
              dot="bg-sky"
              label="Sleep"
              value={formatSleep(metric?.sleep_minutes)}
              sub={metric?.sleep_score ? `Score ${metric.sleep_score}` : "No score"}
            />
            <Stat
              dot="bg-rose"
              label="HRV"
              value={metric?.hrv ? `${metric.hrv} ms` : "—"}
              sub="Overnight average"
            />
            <Stat
              dot="bg-mint"
              label="Resting HR"
              value={metric?.resting_hr ? `${metric.resting_hr}` : "—"}
              sub="Beats per min"
            />
            <Stat
              dot="bg-amber"
              label="Steps"
              value={metric?.steps ? metric.steps.toLocaleString() : "—"}
              sub="Apple Watch"
            />
          </div>
        </div>
        {editing && <MetricsForm metric={metric} onDone={() => setEditing(false)} />}
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Medications</p>
              <h2 className="mt-0.5 text-xl">Today's check-in</h2>
            </div>
            <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-bold">
              {takenIds.size}/{meds.length} taken
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {meds.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No medications yet.{" "}
                <Link to="/medications" className="font-semibold underline">
                  Add your first one
                </Link>
                .
              </p>
            )}
            {meds.map((med) => {
              const taken = takenIds.has(med.id);
              return (
                <button
                  key={med.id}
                  onClick={() => toggle.mutate(med.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-background px-3 py-2.5 text-left transition-colors hover:bg-cream"
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full text-paper ${
                      taken ? "bg-mint" : "ring-1 ring-line"
                    }`}
                    aria-hidden
                  >
                    {taken ? "✓" : ""}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{med.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {[med.dose, formatTime(med.time_of_day)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      taken ? "text-mint" : "bg-amber/20"
                    }`}
                  >
                    {taken ? "Taken" : "Log"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Journal</p>
              <h2 className="mt-0.5 text-xl">Personal check-in</h2>
            </div>
            <Link to="/journal" className="text-xs font-semibold text-muted-foreground underline">
              Open
            </Link>
          </div>
          {entry ? (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Mood</div>
                <span className="mt-2 inline-block rounded-full bg-rose/20 px-3 py-1.5 text-xs font-bold ring-1 ring-rose/40">
                  {entry.mood ?? "Not set"}
                </span>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Energy</div>
                <div className="mt-2 flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`size-5 rounded-full ${
                        (entry.energy ?? 0) >= n ? "bg-amber" : "bg-background ring-1 ring-line"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {entry.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.symptoms.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-sky/15 px-3 py-1.5 text-xs font-bold ring-1 ring-sky/30"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {entry.note && (
                <p className="rounded-2xl bg-background px-4 py-3 text-sm text-pretty text-muted-foreground ring-1 ring-line">
                  {entry.note}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Nothing written down today yet — mood, energy and symptoms take about a minute.
              </p>
              <Link
                to="/journal"
                className="mt-3 inline-block rounded-full bg-sky/20 px-4 py-1.5 text-xs font-bold ring-1 ring-sky/30"
              >
                Write today's entry
              </Link>
            </div>
          )}
        </section>

        <div className="md:col-span-2">
          <CheckInCard />
        </div>
      </div>

      <div className="mt-4">
        <DailyQuoteCard />
      </div>

      <InviteCard />

      <section className="rise mt-4 rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Trends</p>
            <h2 className="mt-0.5 text-xl">Last 7 days</h2>
          </div>
          <Link
            to="/trends"
            className="rounded-full bg-sky/15 px-3 py-1.5 text-xs font-bold ring-1 ring-sky/30"
          >
            All trends
          </Link>
        </div>
        <div className="mt-5">
          <div className="flex h-36 items-end justify-between gap-2">
            {week.map((d, i) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-lg ${i === week.length - 1 ? "bg-sky" : "bg-sky/60"}`}
                  style={{ height: `${((sleepSeries[i] ?? 0) / maxSleep) * 100}%` }}
                />
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {i === week.length - 1
                    ? "Today"
                    : new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-muted-foreground">
            <span>
              Average sleep score <span className="font-bold text-foreground">{avgSleep ?? "—"}</span>
            </span>
            <span>
              Days logged{" "}
              <span className="font-bold text-foreground">{metricsQ.data?.length ?? 0}</span>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
