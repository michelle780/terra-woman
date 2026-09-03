import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CHECKIN_FIELDS, fetchCheckin, todayKey, type CheckinKey } from "@/lib/wellness";

type Scores = Record<CheckinKey, number>;

const DEFAULTS: Scores = {
  happiness: 5,
  fulfillment: 5,
  calm: 5,
  energy: 5,
  focus: 5,
  stress: 5,
  anxiety: 5,
  mood_swings: 5,
  bloating: 1,
  cramps: 1,
};

function Slider({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="font-display text-lg leading-none font-semibold text-primary">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export function CheckInCard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const today = todayKey();
  const [scores, setScores] = useState<Scores>(DEFAULTS);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["checkin", today],
    queryFn: () => fetchCheckin(today),
  });

  useEffect(() => {
    if (!existing) return;
    setScores((prev) => {
      const next = { ...prev };
      for (const { key } of CHECKIN_FIELDS) {
        const v = existing[key];
        if (v != null) next[key] = v;
      }
      return next;
    });
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("daily_checkins").upsert(
        {
          user_id: user!.id,
          checkin_date: today,
          ...scores,
        },
        { onConflict: "user_id,checkin_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkin", today] });
      qc.invalidateQueries({ queryKey: ["checkins"] });
      toast.success("Check-in saved");
    },
    onError: () => toast.error("Couldn't save your check-in — try again"),
  });

  return (
    <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Mind & body</p>
          <h2 className="mt-0.5 text-xl">Daily check-in</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A quick 1–10 on the things that ebb and flow — takes under a minute.
          </p>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || isLoading}
          className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : existing ? "Update check-in" : "Save check-in"}
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHECKIN_FIELDS.map(({ key, label, low, high }) => (
          <Slider
            key={key}
            label={label}
            low={low}
            high={high}
            value={scores[key]}
            onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
          />
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        For personal reflection only — not medical advice. If something feels off, check in with a
        clinician you trust.
      </p>
    </section>
  );
}
