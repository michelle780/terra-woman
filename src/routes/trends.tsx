import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { fetchMetrics, formatSleep, lastNDays, todayKey } from "@/lib/wellness";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trends — Pulse wellness tracker" },
      {
        name: "description",
        content:
          "See how sleep, readiness, HRV, resting heart rate and steps move over the last 7, 14 or 30 days.",
      },
      { property: "og:title", content: "Trends — Pulse wellness tracker" },
      {
        property: "og:description",
        content: "Weekly and monthly charts for sleep, readiness, HRV and activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Trends />
    </AppShell>
  ),
});

const SERIES = [
  { key: "readiness", label: "Readiness", color: "bg-sky" },
  { key: "sleep_score", label: "Sleep score", color: "bg-rose" },
  { key: "hrv", label: "HRV", color: "bg-mint" },
  { key: "steps", label: "Steps", color: "bg-amber" },
] as const;

function Trends() {
  const [range, setRange] = useState(7);
  const days = lastNDays(range);
  const from = days[0] as string;
  const today = todayKey();

  const metricsQ = useQuery({
    queryKey: ["metrics", range],
    queryFn: () => fetchMetrics(from, today),
  });

  const byDate = new Map((metricsQ.data ?? []).map((m) => [m.metric_date, m]));
  const sleepMinutes = (metricsQ.data ?? [])
    .map((m) => m.sleep_minutes)
    .filter((v): v is number => v != null);
  const avgSleepMinutes = sleepMinutes.length
    ? Math.round(sleepMinutes.reduce((a, b) => a + b, 0) / sleepMinutes.length)
    : null;

  return (
    <>
      <section className="rise mt-4 rounded-[28px] bg-paper p-5 ring-1 ring-line sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Trends</p>
            <h1 className="mt-1 text-3xl leading-tight">Last {range} days</h1>
          </div>
          <div className="flex gap-1.5">
            {[7, 14, 30].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                  range === r
                    ? "bg-sky/15 font-bold ring-sky/30"
                    : "bg-background text-muted-foreground ring-line"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-background px-4 py-3">
            <div className="text-xs font-semibold text-muted-foreground">Avg sleep</div>
            <div className="mt-1 font-display text-2xl font-semibold">
              {formatSleep(avgSleepMinutes)}
            </div>
          </div>
          {(["readiness", "hrv", "steps"] as const).map((key) => {
            const vals = (metricsQ.data ?? [])
              .map((m) => m[key])
              .filter((v): v is number => v != null);
            const avg = vals.length
              ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
              : null;
            return (
              <div key={key} className="rounded-2xl bg-background px-4 py-3">
                <div className="text-xs font-semibold text-muted-foreground">
                  Avg {key === "hrv" ? "HRV" : key}
                </div>
                <div className="mt-1 font-display text-2xl font-semibold">
                  {avg?.toLocaleString() ?? "—"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {SERIES.map((s) => {
        const values = days.map((d) => byDate.get(d)?.[s.key] ?? 0);
        const max = Math.max(1, ...values);
        return (
          <section key={s.key} className="rise mt-4 rounded-[24px] bg-paper p-5 ring-1 ring-line">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">{s.label}</h2>
              <span className="text-xs text-muted-foreground">peak {max.toLocaleString()}</span>
            </div>
            <div className="mt-4 flex h-28 items-end gap-1.5">
              {values.map((v, i) => (
                <div
                  key={days[i]}
                  title={`${days[i]}: ${v || "—"}`}
                  className={`flex-1 rounded-t-md ${v ? s.color : "bg-line"}`}
                  style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
