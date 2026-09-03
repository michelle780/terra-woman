import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  CYCLE_SYMPTOMS,
  FLOW_LEVELS,
  averageCycleLength,
  cycleStatus,
  moonPhase,
  fetchCheckins,
  fetchPeriods,
  periodLength,
  todayKey,
  type CyclePeriod,
  type FlowLevel,
} from "@/lib/wellness";

export const Route = createFileRoute("/cycle")({
  head: () => ({
    meta: [
      { title: "Menstrual cycle — Pulse wellness tracker" },
      {
        name: "description",
        content:
          "Log period start and end dates, flow and symptoms, and see how your daily 1–10 check-in shifts across each cycle phase.",
      },
      { property: "og:title", content: "Menstrual cycle — Pulse wellness tracker" },
      {
        property: "og:description",
        content: "Period dates, duration, flow and symptoms linked to your daily check-in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Cycle />
    </AppShell>
  ),
});

const CHECKIN_SIGNALS = [
  { key: "cramps", label: "Cramps" },
  { key: "bloating", label: "Bloating" },
  { key: "mood_swings", label: "Mood swings" },
  { key: "energy", label: "Energy" },
  { key: "happiness", label: "Happiness" },
] as const;

function fmt(date: string | null): string {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Cycle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = todayKey();

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [flow, setFlow] = useState<FlowLevel>("medium");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ["cycle-periods"],
    queryFn: fetchPeriods,
  });
  const { data: checkins = [] } = useQuery({
    queryKey: ["checkins", "cycle"],
    queryFn: () => fetchCheckins("2000-01-01", today),
  });

  const status = cycleStatus(periods, today);
  const avg = averageCycleLength(periods);
  const moon = moonPhase(today);

  function reset() {
    setEditing(null);
    setStartDate(today);
    setEndDate("");
    setFlow("medium");
    setSymptoms([]);
    setNotes("");
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        start_date: startDate,
        end_date: endDate || null,
        flow,
        symptoms,
        notes: notes.trim() || null,
      };
      const { error } = editing
        ? await supabase.from("cycle_periods").update(payload).eq("id", editing)
        : await supabase.from("cycle_periods").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycle-periods"] });
      toast.success(editing ? "Period updated" : "Period logged");
      reset();
    },
    onError: () => toast.error("Couldn't save that period — check the dates and try again"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cycle_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycle-periods"] });
      toast.success("Period removed");
    },
  });

  function startEdit(p: CyclePeriod) {
    setEditing(p.id);
    setStartDate(p.start_date);
    setEndDate(p.end_date ?? "");
    setFlow(p.flow ?? "medium");
    setSymptoms(p.symptoms ?? []);
    setNotes(p.notes ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function averagesFor(p: CyclePeriod) {
    const end = p.end_date ?? p.start_date;
    const rows = checkins.filter((c) => c.checkin_date >= p.start_date && c.checkin_date <= end);
    if (rows.length === 0) return null;
    return CHECKIN_SIGNALS.map(({ key, label }) => {
      const vals = rows.map((r) => r[key]).filter((v): v is number => v != null);
      return {
        label,
        value: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null,
      };
    }).filter((s) => s.value != null);
  }

  return (
    <div className="mt-5 grid gap-5">
      <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <p className="eyebrow">Cycle</p>
        <h1 className="mt-0.5 text-2xl">Menstrual cycle</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Period dates, flow and symptoms — kept private to your account and read alongside your
          daily check-in.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl bg-rose/15 px-4 py-3 ring-1 ring-rose/30">
            <p className="eyebrow">Cycle day</p>
            <p className="font-display text-2xl font-semibold">{status ? status.day : "—"}</p>
          </div>
          <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
            <p className="eyebrow">Phase</p>
            <p className="font-display text-2xl font-semibold">{status ? status.phase : "—"}</p>
          </div>
          <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
            <p className="eyebrow">Luteal window</p>
            {status ? (
              <>
                <p className="font-display text-2xl font-semibold">
                  Day {status.lutealStart}–{status.cycleLength}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {status.phase === "Luteal" ? "You're in it now" : `Starts ~day ${status.lutealStart}`}
                </p>
              </>
            ) : (
              <p className="font-display text-2xl font-semibold">—</p>
            )}
          </div>
          <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
            <p className="eyebrow">Ovulation (est.)</p>
            <p className="font-display text-2xl font-semibold">
              {status ? `Day ${status.ovulationDay}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
            <p className="eyebrow">Avg cycle</p>
            <p className="font-display text-2xl font-semibold">{avg ? `${avg}d` : "—"}</p>
          </div>
          <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
            <p className="eyebrow">Next expected</p>
            <p className="font-display text-lg font-semibold">
              {status?.nextPredicted ? fmt(status.nextPredicted) : "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-sage/15 px-4 py-3 ring-1 ring-sage/30">
          <span className="text-3xl" aria-hidden>
            {moon.icon}
          </span>
          <div>
            <p className="font-display text-lg font-semibold">
              {moon.name} <span className="text-sm font-normal text-muted-foreground">· {moon.illumination}% lit</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Tonight's moon phase — some people like to notice how their energy and sleep shift with
              the lunar cycle.
            </p>
          </div>
        </div>
      </section>

      <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <h2 className="text-xl">{editing ? "Edit period" : "Log a period"}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-background px-4 py-2.5 text-sm font-normal ring-1 ring-line focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold">
            End date <span className="text-muted-foreground">(leave blank if ongoing)</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-background px-4 py-2.5 text-sm font-normal ring-1 ring-line focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </label>
        </div>

        <p className="mt-4 eyebrow">Flow</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FLOW_LEVELS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFlow(f.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                flow === f.value
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-background ring-line hover:bg-rose/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="mt-4 eyebrow">Symptoms</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CYCLE_SYMPTOMS.map((s) => {
            const on = symptoms.includes(s);
            return (
              <button
                key={s}
                onClick={() =>
                  setSymptoms((prev) => (on ? prev.filter((x) => x !== s) : [...prev, s]))
                }
                className={`rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                  on ? "bg-rose/30 ring-rose/50" : "bg-background ring-line hover:bg-rose/10"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything else worth remembering about this cycle…"
          className="mt-4 w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-line focus:ring-2 focus:ring-primary focus:outline-none"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !startDate}
            className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : editing ? "Update period" : "Save period"}
          </button>
          {editing && (
            <button
              onClick={reset}
              className="rounded-full bg-background px-5 py-2 text-xs font-bold ring-1 ring-line"
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <h2 className="text-xl">Cycle history</h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : periods.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No periods logged yet. Add your most recent start date above to begin tracking.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {periods.map((p) => {
              const len = periodLength(p);
              const avgs = averagesFor(p);
              return (
                <li key={p.id} className="rounded-2xl bg-background p-4 ring-1 ring-line">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-semibold">
                        {fmt(p.start_date)} → {p.end_date ? fmt(p.end_date) : "ongoing"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {len ? `${len} day${len === 1 ? "" : "s"}` : "Duration pending"}
                        {p.flow ? ` · ${p.flow} flow` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="rounded-full bg-paper px-4 py-1.5 text-xs font-bold ring-1 ring-line"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove.mutate(p.id)}
                        className="rounded-full bg-paper px-4 py-1.5 text-xs font-bold text-muted-foreground ring-1 ring-line"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {p.symptoms.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.symptoms.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-rose/20 px-3 py-1 text-[11px] font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.notes && <p className="mt-2 text-sm">{p.notes}</p>}
                  <div className="mt-3 rounded-xl bg-paper px-3 py-2 ring-1 ring-line">
                    <p className="eyebrow">Daily check-in during these days</p>
                    {avgs && avgs.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        {avgs.map((s) => (
                          <span key={s.label}>
                            <span className="text-muted-foreground">{s.label}</span>{" "}
                            <span className="font-bold">{s.value}/10</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        No check-ins saved for these dates yet.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground">
          Cycle predictions are rough estimates from your own logs — not contraception guidance or
          medical advice.
        </p>
      </section>
    </div>
  );
}
