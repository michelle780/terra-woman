import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  DAY_LABELS,
  fetchMedicationLogs,
  fetchMedications,
  formatTime,
  isScheduledOn,
  lastNDays,
  scheduleLabel,
  todayKey,
  type MedFrequency,
  type Medication,
} from "@/lib/wellness";

const FREQUENCIES: { value: MedFrequency; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "specific_days", label: "Certain days" },
  { value: "as_needed", label: "As needed" },
];

function DayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (days: number[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DAY_LABELS.map((label, i) => {
        const on = value.includes(i);
        return (
          <button
            key={label}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((d) => d !== i) : [...value, i])}
            className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
              on ? "bg-mint/30 ring-mint/50" : "bg-background ring-line text-muted-foreground"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export const Route = createFileRoute("/medications")({
  head: () => ({
    meta: [
      { title: "Medications — Terra Woman wellness tracker" },
      {
        name: "description",
        content:
          "Keep your medication list, doses and times, and see how consistently you have taken them over the last two weeks.",
      },
      { property: "og:title", content: "Medications — Terra Woman wellness tracker" },
      {
        property: "og:description",
        content: "Doses, timing and adherence for every medication you take.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Medications />
    </AppShell>
  ),
});

type ParsedMed = { name: string; dose: string | null; time_of_day: string | null };

/** Parse one med per line: "Name, dose, time" — dose and time optional. Skips headers and blank lines. */
function parseMedLines(text: string): ParsedMed[] {
  const out: ParsedMed[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/[,\t]/).map((p) => p.trim());
    const first = (parts[0] ?? "").toLowerCase();
    if (first === "name" || first === "medication") continue; // header row
    const name = parts[0] ?? "";
    if (!name) continue;
    let time: string | null = null;
    const timeRaw = parts[2] ?? "";
    const m = timeRaw.match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?$/i);
    if (m) {
      let h = parseInt(m[1]!, 10);
      const min = m[2] ?? "00";
      if (m[3]?.toLowerCase() === "pm" && h < 12) h += 12;
      if (m[3]?.toLowerCase() === "am" && h === 12) h = 0;
      if (h <= 23) time = `${String(h).padStart(2, "0")}:${min}`;
    }
    out.push({ name, dose: parts[1] || null, time_of_day: time });
  }
  return out;
}

export function Medications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const days = lastNDays(14);
  const today = todayKey();
  const [form, setForm] = useState<{
    name: string;
    dose: string;
    time_of_day: string;
    frequency: MedFrequency;
    days_of_week: number[];
  }>({ name: "", dose: "", time_of_day: "", frequency: "daily", days_of_week: [] });
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [preview, setPreview] = useState<ParsedMed[] | null>(null);

  const medsQ = useQuery({ queryKey: ["medications"], queryFn: fetchMedications });
  const logsQ = useQuery({
    queryKey: ["medication-logs", "14d"],
    queryFn: () => fetchMedicationLogs(days[0] as string, today),
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("medications").insert({
        user_id: user!.id,
        name: form.name.trim(),
        dose: form.dose.trim() || null,
        time_of_day: form.time_of_day || null,
        frequency: form.frequency,
        days_of_week: form.frequency === "specific_days" ? form.days_of_week : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", dose: "", time_of_day: "", frequency: "daily", days_of_week: [] });
      qc.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medication added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const existingNames = new Set(
    (medsQ.data ?? []).map((m) => m.name.trim().toLowerCase()),
  );
  const newMeds = (preview ?? []).filter((p) => !existingNames.has(p.name.toLowerCase()));
  const skipped = (preview ?? []).length - newMeds.length;

  const importAll = useMutation({
    mutationFn: async () => {
      if (newMeds.length === 0) return;
      const { error } = await supabase
        .from("medications")
        .insert(newMeds.map((m) => ({ ...m, user_id: user!.id })));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Imported ${newMeds.length} medication${newMeds.length === 1 ? "" : "s"}`);
      setPreview(null);
      setImportText("");
      setShowImport(false);
      qc.invalidateQueries({ queryKey: ["medications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    void file.text().then((text) => {
      setImportText(text);
      setPreview(parseMedLines(text));
    });
  };

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSchedule = useMutation({
    mutationFn: async (vars: { id: string; frequency: MedFrequency; days_of_week: number[] }) => {
      const { error } = await supabase
        .from("medications")
        .update({
          frequency: vars.frequency,
          days_of_week: vars.frequency === "specific_days" ? vars.days_of_week : [],
        })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Schedule updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleToday = useMutation({
    mutationFn: async (vars: { id: string; taken: boolean }) => {
      if (vars.taken) {
        const { error } = await supabase
          .from("medication_logs")
          .delete()
          .eq("medication_id", vars.id)
          .eq("taken_on", today);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("medication_logs")
          .insert({ user_id: user!.id, medication_id: vars.id, taken_on: today });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medication-logs"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const meds = medsQ.data ?? [];
  const logs = logsQ.data ?? [];
  const takenToday = new Set(logs.filter((l) => l.taken_on === today).map((l) => l.medication_id));
  const activeMeds = meds.filter((m) => m.active);
  const dueToday = activeMeds.filter((m) => isScheduledOn(m, today));
  const asNeeded = activeMeds.filter((m) => m.frequency === "as_needed");
  const remaining = dueToday.filter((m) => !takenToday.has(m.id));

  const confirmAll = useMutation({
    mutationFn: async () => {
      if (remaining.length === 0) return;
      const { error } = await supabase.from("medication_logs").insert(
        remaining.map((m) => ({ user_id: user!.id, medication_id: m.id, taken_on: today })),
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medication-logs"] });
      toast.success("Confirmed for today");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scheduledDays = (med: Medication) => days.filter((d) => isScheduledOn(med, d));

  return (
    <>
      <section className="rise mt-4 rounded-[28px] bg-paper p-5 ring-1 ring-line sm:p-7">
        <p className="eyebrow">Medications</p>
        <h1 className="mt-1 text-3xl leading-tight">What you take, and when</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            add.mutate();
          }}
          className="mt-5 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <label className="block">
            <span className="text-[11px] font-semibold text-muted-foreground">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Levothyroxine"
              className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-muted-foreground">Dose</span>
            <input
              value={form.dose}
              onChange={(e) => setForm({ ...form, dose: e.target.value })}
              placeholder="75 mcg"
              className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-muted-foreground">Time</span>
            <input
              type="time"
              value={form.time_of_day}
              onChange={(e) => setForm({ ...form, time_of_day: e.target.value })}
              className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <button
            type="submit"
            disabled={add.isPending}
            className="self-end rounded-full bg-sky px-5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
          >
            Add
          </button>
          <div className="sm:col-span-4">
            <span className="text-[11px] font-semibold text-muted-foreground">How often</span>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={form.frequency === f.value}
                  onClick={() => setForm({ ...form, frequency: f.value })}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
                    form.frequency === f.value
                      ? "bg-sky/25 ring-sky/40"
                      : "bg-background ring-line text-muted-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {form.frequency === "specific_days" && (
              <div className="mt-2">
                <DayPicker
                  value={form.days_of_week}
                  onChange={(days_of_week) => setForm({ ...form, days_of_week })}
                />
              </div>
            )}
          </div>
        </form>

        <div className="mt-5 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className="text-xs font-bold text-primary underline-offset-2 hover:underline"
          >
            {showImport ? "Hide import" : "Import a list instead"}
          </button>
          {showImport && (
            <div className="mt-3 rounded-2xl bg-background/70 p-4 ring-1 ring-line">
              <p className="text-xs text-muted-foreground">
                Paste or upload your medication list — one per line as{" "}
                <span className="font-semibold">Name, dose, time</span> (dose and time optional).
                Nothing is saved until you confirm below.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={5}
                placeholder={"Levothyroxine, 75 mcg, 07:30\nMagnesium, 200 mg, 9:00 pm\nVitamin D3"}
                className="mt-3 w-full rounded-xl bg-background px-3 py-2 font-mono text-xs ring-1 ring-line outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded-full bg-paper px-4 py-1.5 text-xs font-semibold ring-1 ring-line hover:bg-muted">
                  Upload .csv / .txt
                  <input
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => onImportFile(e.target.files?.[0])}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setPreview(parseMedLines(importText))}
                  className="rounded-full bg-sky px-4 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  Preview import
                </button>
              </div>

              {preview && (
                <div className="mt-4">
                  <p className="text-xs font-semibold">
                    {newMeds.length} to import
                    {skipped > 0 && ` · ${skipped} skipped (already on your list)`}
                    {preview.length === 0 && " — nothing recognized"}
                  </p>
                  {newMeds.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {newMeds.map((m, i) => (
                        <li
                          key={`${m.name}-${i}`}
                          className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-xs ring-1 ring-line"
                        >
                          <span className="font-semibold">{m.name}</span>
                          <span className="text-muted-foreground">
                            {[m.dose, formatTime(m.time_of_day)].filter(Boolean).join(" · ") ||
                              "no dose/time"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {newMeds.length > 0 && (
                    <button
                      type="button"
                      disabled={importAll.isPending}
                      onClick={() => importAll.mutate()}
                      className="mt-3 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
                    >
                      {importAll.isPending ? "Importing…" : `Confirm import (${newMeds.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rise mt-4 rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Today</p>
            <h2 className="mt-0.5 text-xl">Confirm what you took</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-bold">
              {dueToday.length - remaining.length}/{dueToday.length} done
            </span>
            {remaining.length > 0 && (
              <button
                type="button"
                onClick={() => confirmAll.mutate()}
                disabled={confirmAll.isPending}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
              >
                Confirm all {remaining.length}
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {dueToday.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing scheduled today. Add a medication above, or log an as-needed dose below.
            </p>
          )}
          {[...dueToday, ...asNeeded].map((med) => {
            const taken = takenToday.has(med.id);
            return (
              <button
                key={med.id}
                type="button"
                onClick={() => toggleToday.mutate({ id: med.id, taken })}
                className="flex w-full items-center gap-3 rounded-2xl bg-background px-3 py-2.5 text-left ring-1 ring-line transition-colors hover:bg-cream"
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
                    {[med.dose, formatTime(med.time_of_day), scheduleLabel(med)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    taken ? "text-mint" : "bg-amber/20"
                  }`}
                >
                  {taken ? "Taken" : med.frequency === "as_needed" ? "Log dose" : "Confirm"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rise mt-4 rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Adherence</p>
            <h2 className="mt-0.5 text-xl">Last 14 days</h2>
          </div>
          <span className="text-xs text-muted-foreground">Filled dot = taken</span>
        </div>

        <div className="mt-4 space-y-3">
          {meds.length === 0 && (
            <p className="text-sm text-muted-foreground">Add a medication above to start tracking.</p>
          )}
          {meds.map((med) => {
            const taken = new Set(
              logs.filter((l) => l.medication_id === med.id).map((l) => l.taken_on),
            );
            const sched = scheduledDays(med);
            const takenScheduled = sched.filter((d) => taken.has(d)).length;
            const rate = sched.length ? Math.round((takenScheduled / sched.length) * 100) : null;
            return (
              <div key={med.id} className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{med.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {[med.dose, formatTime(med.time_of_day), scheduleLabel(med)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-bold">
                      {rate === null ? "As needed" : `${rate}%`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setScheduleFor(scheduleFor === med.id ? null : med.id)}
                      className="rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-line hover:bg-muted"
                    >
                      {scheduleFor === med.id ? "Close" : "Schedule"}
                    </button>
                    <button
                      onClick={() => remove.mutate(med.id)}
                      aria-label={`Remove ${med.name}`}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground ring-1 ring-line hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
                {scheduleFor === med.id && (
                  <div className="mt-3 rounded-2xl bg-paper p-3 ring-1 ring-line">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {FREQUENCIES.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          aria-pressed={med.frequency === f.value}
                          onClick={() =>
                            updateSchedule.mutate({
                              id: med.id,
                              frequency: f.value,
                              days_of_week: med.days_of_week ?? [],
                            })
                          }
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
                            med.frequency === f.value
                              ? "bg-sky/25 ring-sky/40"
                              : "bg-background ring-line text-muted-foreground"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    {med.frequency === "specific_days" && (
                      <div className="mt-2">
                        <DayPicker
                          value={med.days_of_week ?? []}
                          onChange={(days_of_week) =>
                            updateSchedule.mutate({
                              id: med.id,
                              frequency: "specific_days",
                              days_of_week,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 flex gap-1.5">
                  {days.map((d) => {
                    const scheduled = isScheduledOn(med, d);
                    return (
                      <span
                        key={d}
                        title={`${d}${scheduled ? "" : " · not scheduled"}`}
                        className={`h-2.5 flex-1 rounded-full ${
                          taken.has(d) ? "bg-mint" : scheduled ? "bg-line" : "bg-line/40"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
