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

export type CheckinKey =
  | "happiness"
  | "fulfillment"
  | "calm"
  | "energy"
  | "focus"
  | "stress"
  | "anxiety"
  | "mood_swings"
  | "bloating"
  | "cramps";

export type DailyCheckin = {
  id: string;
  checkin_date: string;
} & Record<CheckinKey, number | null>;

export const CHECKIN_FIELDS: { key: CheckinKey; label: string; low: string; high: string }[] = [
  { key: "happiness", label: "Happiness", low: "Low", high: "Joyful" },
  { key: "fulfillment", label: "Fulfillment", low: "Empty", high: "Fulfilled" },
  { key: "calm", label: "Calm", low: "Tense", high: "At ease" },
  { key: "energy", label: "Energy", low: "Drained", high: "Energized" },
  { key: "focus", label: "Focus", low: "Foggy", high: "Sharp" },
  { key: "stress", label: "Stress", low: "None", high: "Overwhelmed" },
  { key: "anxiety", label: "Anxiety", low: "None", high: "Intense" },
  { key: "mood_swings", label: "Mood swings", low: "Steady", high: "All over" },
  { key: "bloating", label: "Bloating", low: "None", high: "Severe" },
  { key: "cramps", label: "Cramps", low: "None", high: "Severe" },
];

export async function fetchCheckin(date: string): Promise<DailyCheckin | null> {
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("id, checkin_date, happiness, fulfillment, calm, energy, focus, stress, anxiety, mood_swings, bloating, cramps")
    .eq("checkin_date", date)
    .maybeSingle();
  if (error) throw error;
  return (data as DailyCheckin | null) ?? null;
}

export async function fetchCheckins(from: string, to: string): Promise<DailyCheckin[]> {
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("id, checkin_date, happiness, fulfillment, calm, energy, focus, stress, anxiety, mood_swings, bloating, cramps")
    .gte("checkin_date", from)
    .lte("checkin_date", to)
    .order("checkin_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DailyCheckin[];
}

export type FlowLevel = "spotting" | "light" | "medium" | "heavy";

export const FLOW_LEVELS: { value: FlowLevel; label: string }[] = [
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

export const CYCLE_SYMPTOMS = [
  "Cramps",
  "Bloating",
  "Headache",
  "Breast tenderness",
  "Back pain",
  "Fatigue",
  "Mood swings",
  "Acne",
  "Cravings",
  "Nausea",
  "Insomnia",
] as const;

export type CyclePeriod = {
  id: string;
  start_date: string;
  end_date: string | null;
  flow: FlowLevel | null;
  symptoms: string[];
  notes: string | null;
};

export async function fetchPeriods(): Promise<CyclePeriod[]> {
  const { data, error } = await supabase
    .from("cycle_periods")
    .select("id, start_date, end_date, flow, symptoms, notes")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CyclePeriod[];
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function periodLength(p: CyclePeriod): number | null {
  if (!p.end_date) return null;
  return daysBetween(p.start_date, p.end_date) + 1;
}

/** Average gap between period start dates, in days. */
export function averageCycleLength(periods: CyclePeriod[]): number | null {
  const starts = periods.map((p) => p.start_date).sort();
  if (starts.length < 2) return null;
  let total = 0;
  for (let i = 1; i < starts.length; i += 1) total += daysBetween(starts[i - 1], starts[i]);
  return Math.round(total / (starts.length - 1));
}

export type CycleStatus = {
  day: number;
  phase: string;
  bleeding: boolean;
  nextPredicted: string | null;
};

export function cycleStatus(periods: CyclePeriod[], date = todayKey()): CycleStatus | null {
  const past = periods
    .filter((p) => p.start_date <= date)
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  const current = past[0];
  if (!current) return null;
  const day = daysBetween(current.start_date, date) + 1;
  const bleeding = current.end_date ? date <= current.end_date : day <= 5;
  const avg = averageCycleLength(periods) ?? 28;
  let phase = "Luteal";
  if (bleeding) phase = "Menstrual";
  else if (day <= Math.round(avg / 2) - 2) phase = "Follicular";
  else if (day <= Math.round(avg / 2) + 1) phase = "Ovulatory";
  const next = new Date(`${current.start_date}T00:00:00`);
  next.setDate(next.getDate() + avg);
  return { day, phase, bleeding, nextPredicted: toDateKey(next) };
}

export type DeviceConnection = {
  id: string;
  provider: string;
  status: string;
  last_synced_at: string | null;
};

export async function fetchDeviceConnections(): Promise<DeviceConnection[]> {
  const { data, error } = await supabase
    .from("device_connections")
    .select("id, provider, status, last_synced_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DeviceConnection[];
}
