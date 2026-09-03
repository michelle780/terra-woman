import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHECKIN_FIELDS,
  cycleStatus,
  fetchCheckins,
  fetchPeriods,
  type CheckinKey,
} from "@/lib/wellness";

const PHASE_COLORS: Record<string, string> = {
  Menstrual: "#c26a7e",
  Follicular: "#7d9c84",
  Ovulatory: "#c9a35c",
  Luteal: "#8b6f92",
};

const PHASES = ["Menstrual", "Follicular", "Ovulatory", "Luteal"] as const;

export function MoodTrendsChart({ from, to }: { from: string; to: string }) {
  const [metric, setMetric] = useState<CheckinKey>("happiness");

  const checkinsQ = useQuery({
    queryKey: ["checkins", from, to],
    queryFn: () => fetchCheckins(from, to),
  });
  const periodsQ = useQuery({
    queryKey: ["periods"],
    queryFn: fetchPeriods,
  });

  const periods = periodsQ.data ?? [];
  const points = (checkinsQ.data ?? [])
    .map((c) => {
      const value = c[metric];
      if (value == null) return null;
      const status = cycleStatus(periods, c.checkin_date);
      return {
        date: c.checkin_date,
        label: new Date(`${c.checkin_date}T00:00:00`).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        value,
        phase: status?.phase ?? "Unknown",
      };
    })
    .filter((p): p is NonNullable<typeof p> => p != null);

  const phaseAverages = PHASES.map((phase) => {
    const vals = points.filter((p) => p.phase === phase).map((p) => p.value);
    const avg = vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : null;
    return { phase, avg, count: vals.length };
  });

  const field = CHECKIN_FIELDS.find((f) => f.key === metric)!;
  const hasCycles = periods.length > 0;

  return (
    <section className="rise mt-4 rounded-[28px] bg-paper p-5 ring-1 ring-line sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Mood trends</p>
          <h2 className="mt-1 text-2xl leading-tight">Check-in scores by cycle phase</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your daily 1–10 check-ins over time, colored by the cycle phase they landed in.
          </p>
        </div>
        {hasCycles && (
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            {PHASES.map((phase) => (
              <span key={phase} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: PHASE_COLORS[phase] }}
                />
                {phase}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {CHECKIN_FIELDS.map((f) => (
          <button
            key={f.key}
            onClick={() => setMetric(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
              metric === f.key
                ? "bg-rose/15 font-bold ring-rose/30"
                : "bg-background text-muted-foreground ring-line hover:bg-rose/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {checkinsQ.isLoading ? (
        <div className="mt-6 h-56 animate-pulse rounded-2xl bg-background" />
      ) : points.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-background px-4 py-6 text-center text-sm text-muted-foreground">
          No check-ins yet for {field.label.toLowerCase()} in this range. Add a personal check-in on
          the Today page to start seeing your trends.
        </p>
      ) : (
        <>
          <div className="mt-5 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as
                      | { label: string; value: number; phase: string }
                      | undefined;
                    if (!active || !p) return null;
                    return (
                      <div className="rounded-xl bg-paper px-3 py-2 text-xs shadow-md ring-1 ring-line">
                        <div className="font-bold">{p.label}</div>
                        <div className="mt-0.5">
                          {field.label}: <span className="font-bold">{p.value}/10</span>
                        </div>
                        {p.phase !== "Unknown" && (
                          <div className="mt-0.5 inline-flex items-center gap-1.5 text-muted-foreground">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ backgroundColor: PHASE_COLORS[p.phase] }}
                            />
                            {p.phase} phase
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--rosewood)"
                  strokeWidth={2}
                  connectNulls
                  dot={(props: Record<string, unknown>) => {
                    const { cx, cy, payload } = props as {
                      cx: number;
                      cy: number;
                      payload: { phase: string };
                    };
                    return (
                      <circle
                        key={`${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={PHASE_COLORS[payload.phase] ?? "var(--rosewood)"}
                        stroke="var(--paper)"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {hasCycles && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {phaseAverages.map(({ phase, avg, count }) => (
                <div key={phase} className="rounded-2xl bg-background px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: PHASE_COLORS[phase] }}
                    />
                    {phase}
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold">
                    {avg ?? "—"}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      {count ? `avg · ${count} day${count === 1 ? "" : "s"}` : "no data"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasCycles && (
            <p className="mt-4 rounded-2xl bg-background px-4 py-3 text-xs text-muted-foreground">
              Log your period dates on the Cycle page and this chart will group your scores by
              menstrual, follicular, ovulatory and luteal phases.
            </p>
          )}
        </>
      )}

      <p className="mt-4 text-[11px] text-muted-foreground">
        Phases are estimates from your logged period dates. This chart is for personal reflection,
        not medical advice.
      </p>
    </section>
  );
}
