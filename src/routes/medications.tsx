import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  fetchMedicationLogs,
  fetchMedications,
  formatTime,
  lastNDays,
  todayKey,
} from "@/lib/wellness";

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

function Medications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const days = lastNDays(14);
  const today = todayKey();
  const [form, setForm] = useState({ name: "", dose: "", time_of_day: "" });
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", dose: "", time_of_day: "" });
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

  const meds = medsQ.data ?? [];
  const logs = logsQ.data ?? [];

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
        </form>
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
            const rate = Math.round((taken.size / days.length) * 100);
            return (
              <div key={med.id} className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{med.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {[med.dose, formatTime(med.time_of_day)].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-bold">
                      {rate}%
                    </span>
                    <button
                      onClick={() => remove.mutate(med.id)}
                      aria-label={`Remove ${med.name}`}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground ring-1 ring-line hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {days.map((d) => (
                    <span
                      key={d}
                      title={d}
                      className={`h-2.5 flex-1 rounded-full ${
                        taken.has(d) ? "bg-mint" : "bg-line"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
