import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { MOODS, SYMPTOMS, fetchJournal, lastNDays, todayKey } from "@/lib/wellness";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Pulse wellness tracker" },
      {
        name: "description",
        content:
          "Record mood, energy, symptoms and a short note each day so patterns show up next to your sleep and recovery data.",
      },
      { property: "og:title", content: "Journal — Pulse wellness tracker" },
      {
        property: "og:description",
        content: "Daily mood, energy and symptom notes alongside your health metrics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Journal />
    </AppShell>
  ),
});

function Journal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = todayKey();
  const days = lastNDays(30);
  const from = days[0] as string;

  const journalQ = useQuery({
    queryKey: ["journal", "30d"],
    queryFn: () => fetchJournal(from, today),
  });

  const entry = journalQ.data?.find((e) => e.entry_date === today);
  const [mood, setMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState<number>(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!entry) return;
    setMood(entry.mood);
    setEnergy(entry.energy ?? 0);
    setSymptoms(entry.symptoms);
    setNote(entry.note ?? "");
  }, [entry]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("journal_entries").upsert(
        {
          user_id: user!.id,
          entry_date: today,
          mood,
          energy: energy || null,
          symptoms,
          note: note.trim() || null,
        },
        { onConflict: "user_id,entry_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      toast.success("Journal saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const past = (journalQ.data ?? []).filter((e) => e.entry_date !== today);

  return (
    <>
      <section className="rise mt-4 rounded-[28px] bg-paper p-5 ring-1 ring-line sm:p-7">
        <p className="eyebrow">Journal</p>
        <h1 className="mt-1 text-3xl leading-tight">How are you landing today?</h1>

        <div className="mt-5">
          <div className="text-xs font-semibold text-muted-foreground">Mood</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m === mood ? null : m)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                  mood === m
                    ? "bg-rose/20 font-bold ring-rose/40"
                    : "bg-background text-muted-foreground ring-line"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground">Energy</div>
          <div className="mt-2 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`Energy ${n} of 5`}
                onClick={() => setEnergy(n === energy ? 0 : n)}
                className={`size-6 rounded-full ${
                  energy >= n ? "bg-amber" : "bg-background ring-1 ring-line"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground">Symptoms</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => {
              const on = symptoms.includes(s);
              return (
                <button
                  key={s}
                  onClick={() =>
                    setSymptoms(on ? symptoms.filter((x) => x !== s) : [...symptoms, s])
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                    on ? "bg-sky/15 font-bold ring-sky/30" : "bg-background text-muted-foreground ring-line"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Anything worth remembering about today…"
          className="mt-4 w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-sky"
        />

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-3 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          {entry ? "Update entry" : "Save entry"}
        </button>
      </section>

      <section className="rise mt-4 rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <p className="eyebrow">Recent</p>
        <h2 className="mt-0.5 text-xl">Last 30 days</h2>
        <div className="mt-4 space-y-3">
          {past.length === 0 && (
            <p className="text-sm text-muted-foreground">No earlier entries yet.</p>
          )}
          {past.map((e) => (
            <div key={e.id} className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {new Date(`${e.entry_date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {e.mood ?? "—"} · energy {e.energy ?? "—"}/5
                </span>
              </div>
              {e.symptoms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.symptoms.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-sky/15 px-2.5 py-1 text-[11px] font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {e.note && <p className="mt-2 text-sm text-muted-foreground">{e.note}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
