import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { AppleCycleImport } from "@/components/AppleCycleImport";
import { useAuth } from "@/lib/auth";
import { fetchMetrics, formatSleep, lastNDays, todayKey } from "@/lib/wellness";

export const Route = createFileRoute("/apple-health")({
  head: () => ({
    meta: [
      { title: "Apple Watch entry — Terra Woman" },
      {
        name: "description",
        content:
          "Enter your Apple Watch and Apple Health numbers — sleep, steps, resting heart rate and HRV — straight into your private Terra Woman timeline, no native app required.",
      },
      { property: "og:title", content: "Apple Watch entry — Terra Woman" },
      {
        property: "og:description",
        content: "Log Apple Health sleep, steps, resting heart rate and HRV by hand in Terra Woman.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <AppleHealth />
    </AppShell>
  ),
});

type FormState = {
  metric_date: string;
  sleep_hours: string;
  sleep_minutes: string;
  steps: string;
  resting_hr: string;
  hrv: string;
};

const EMPTY: FormState = {
  metric_date: todayKey(),
  sleep_hours: "",
  sleep_minutes: "",
  steps: "",
  resting_hr: "",
  hrv: "",
};

function toInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-bold">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        className="rounded-2xl bg-background/70 px-4 py-2.5 text-sm ring-1 ring-line backdrop-blur-md focus:ring-2 focus:ring-primary focus:outline-none"
      />
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function AppleHealth() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);

  const days = lastNDays(14);
  const from = days[0] as string;
  const to = days[days.length - 1] as string;

  const { data: metrics = [] } = useQuery({
    queryKey: ["metrics", from, to],
    queryFn: () => fetchMetrics(from, to),
  });

  const existing = metrics.find((m) => m.metric_date === form.metric_date);

  // Prefill the form whenever the chosen day already has numbers saved.
  useEffect(() => {
    if (!existing) return;
    setForm((f) => ({
      ...f,
      sleep_hours: existing.sleep_minutes != null ? String(Math.floor(existing.sleep_minutes / 60)) : "",
      sleep_minutes: existing.sleep_minutes != null ? String(existing.sleep_minutes % 60) : "",
      steps: existing.steps != null ? String(existing.steps) : "",
      resting_hr: existing.resting_hr != null ? String(existing.resting_hr) : "",
      hrv: existing.hrv != null ? String(existing.hrv) : "",
    }));
  }, [existing?.id, form.metric_date]);

  const save = useMutation({
    mutationFn: async () => {
      const hours = toInt(form.sleep_hours) ?? 0;
      const mins = toInt(form.sleep_minutes) ?? 0;
      const sleepTotal = form.sleep_hours || form.sleep_minutes ? hours * 60 + mins : null;
      const payload = {
        user_id: user!.id,
        metric_date: form.metric_date,
        sleep_minutes: sleepTotal,
        steps: toInt(form.steps),
        resting_hr: toInt(form.resting_hr),
        hrv: toInt(form.hrv),
        source: "apple_health",
      };
      if (
        payload.sleep_minutes == null &&
        payload.steps == null &&
        payload.resting_hr == null &&
        payload.hrv == null
      ) {
        throw new Error("empty");
      }
      const { error } = await supabase
        .from("daily_metrics")
        .upsert(payload, { onConflict: "user_id,metric_date" });
      if (error) throw error;

      await supabase.from("device_connections").upsert(
        {
          user_id: user!.id,
          provider: "apple_health",
          status: "connected",
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metrics"] });
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      toast.success("Saved to your timeline");
    },
    onError: (e: Error) =>
      toast.error(e.message === "empty" ? "Add at least one number first" : "Couldn't save — try again"),
  });

  const recent = [...metrics].reverse();

  return (
    <div className="mt-5 grid gap-5">
      <section className="rise rounded-[24px] bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md">
        <p className="eyebrow">Apple Watch & Health</p>
        <h1 className="mt-0.5 text-2xl">Enter your Apple Health numbers</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Apple keeps Health data on your iPhone — it can only leave through a native app, so Terra
          Woman lets you bring it in yourself. Open Health → Browse, read the day's numbers, and
          type them here. They land in the same private timeline as everything else, and Trends
          treats them exactly like ring data.
        </p>
      </section>

      <section className="rise rounded-[24px] bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-bold">Day</span>
            <input
              type="date"
              value={form.metric_date}
              max={todayKey()}
              onChange={(e) => setForm({ ...EMPTY, metric_date: e.target.value })}
              className="rounded-2xl bg-background/70 px-4 py-2.5 text-sm ring-1 ring-line backdrop-blur-md focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </label>
          {existing && (
            <span className="rounded-full bg-sage/25 px-3 py-1 text-[11px] font-bold">
              Already logged · editing
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <Field
              label="Sleep — hours"
              value={form.sleep_hours}
              onChange={(v) => setForm({ ...form, sleep_hours: v })}
              placeholder="7"
            />
            <Field
              label="Sleep — minutes"
              value={form.sleep_minutes}
              onChange={(v) => setForm({ ...form, sleep_minutes: v })}
              placeholder="20"
            />
          </div>
          <Field
            label="Steps"
            hint="Health → Activity → Steps"
            value={form.steps}
            onChange={(v) => setForm({ ...form, steps: v })}
            placeholder="8400"
          />
          <Field
            label="Resting heart rate (bpm)"
            hint="Health → Heart → Resting Heart Rate"
            value={form.resting_hr}
            onChange={(v) => setForm({ ...form, resting_hr: v })}
            placeholder="58"
          />
          <Field
            label="HRV (ms)"
            hint="Health → Heart → Heart Rate Variability"
            value={form.hrv}
            onChange={(v) => setForm({ ...form, hrv: v })}
            placeholder="45"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : existing ? "Update this day" : "Save this day"}
          </button>
          <button
            onClick={() => setForm({ ...EMPTY, metric_date: form.metric_date })}
            className="rounded-full bg-background/70 px-4 py-2 text-xs font-bold ring-1 ring-line"
          >
            Clear
          </button>
          <Link
            to="/devices"
            className="ml-auto text-[11px] font-semibold text-copper-ink hover:underline"
          >
            Back to devices
          </Link>
        </div>
      </section>

      <AppleCycleImport />

      <section className="rise rounded-[24px] bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md">
        <h2 className="text-xl">Last 14 days</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Nothing logged yet — start with last night's sleep.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {recent.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background/60 px-4 py-3 ring-1 ring-line"
              >
                <button
                  onClick={() => setForm({ ...EMPTY, metric_date: m.metric_date })}
                  className="text-sm font-bold hover:underline"
                >
                  {new Date(`${m.metric_date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </button>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span>Sleep {formatSleep(m.sleep_minutes)}</span>
                  <span>Steps {m.steps ?? "—"}</span>
                  <span>RHR {m.resting_hr ?? "—"}</span>
                  <span>HRV {m.hrv ?? "—"}</span>
                  <span className="font-semibold">
                    {m.source === "apple_health" ? "Apple" : m.source === "oura" ? "Oura" : "Manual"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
