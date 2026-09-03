import { supabase } from "@/integrations/supabase/client";

export type Medication = {
  id: string;
  name: string;
  dose: string | null;
  time_of_day: string | null;
  schedule_note: string | null;
  active: boolean;
};

export type MedicationLog = {
  id: string;
  medication_id: string;
  taken_on: string;
};

export type DailyMetric = {
  id: string;
  metric_date: string;
  sleep_minutes: number | null;
  sleep_score: number | null;
  readiness: number | null;
  hrv: number | null;
  resting_hr: number | null;
  steps: number | null;
  source: string;
};

export type JournalEntry = {
  id: string;
  entry_date: string;
  mood: string | null;
  energy: number | null;
  symptoms: string[];
  note: string | null;
};

export const MOODS = ["Calm", "Focused", "Restless", "Anxious", "Low"] as const;
export const SYMPTOMS = [
  "Headache",
  "Mild fatigue",
  "Brain fog",
  "Sore muscles",
  "Nausea",
  "Poor sleep",
  "None",
] as const;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(toDateKey(d));
  }
  return out;
}

export function formatSleep(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatTime(value: string | null): string {
  if (!value) return "Anytime";
  const [h, m] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

export async function fetchMedications(): Promise<Medication[]> {
  const { data, error } = await supabase
    .from("medications")
    .select("id, name, dose, time_of_day, schedule_note, active")
    .order("time_of_day", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Medication[];
}

export async function fetchMedicationLogs(from: string, to: string): Promise<MedicationLog[]> {
  const { data, error } = await supabase
    .from("medication_logs")
    .select("id, medication_id, taken_on")
    .gte("taken_on", from)
    .lte("taken_on", to);
  if (error) throw error;
  return (data ?? []) as MedicationLog[];
}

export async function fetchMetrics(from: string, to: string): Promise<DailyMetric[]> {
  const { data, error } = await supabase
    .from("daily_metrics")
    .select("id, metric_date, sleep_minutes, sleep_score, readiness, hrv, resting_hr, steps, source")
    .gte("metric_date", from)
    .lte("metric_date", to)
    .order("metric_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DailyMetric[];
}

export async function fetchJournal(from: string, to: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, entry_date, mood, energy, symptoms, note")
    .gte("entry_date", from)
    .lte("entry_date", to)
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JournalEntry[];
}
