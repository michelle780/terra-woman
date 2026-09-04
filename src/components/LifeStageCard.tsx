import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { LIFE_STAGES, getLifeStage, type LifeStageValue } from "@/lib/life-stage";

/**
 * A personalised card on Today that speaks to where she is right now —
 * trying to conceive, pregnant, feeding, perimenopause, menopause or beyond.
 */
export function LifeStageCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (value: LifeStageValue) => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, life_stage: value }, { onConflict: "id" });
      if (error) throw error;
      return value;
    },
    onSuccess: (value) => {
      queryClient.setQueryData(["profile", user?.id], (old: Record<string, unknown> | null) => ({
        ...(old ?? {}),
        life_stage: value,
      }));
      setEditing(false);
      toast.success("Personalised for where you are.");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not save that just now"),
  });

  if (!user) return null;

  const stage = getLifeStage(profile?.life_stage);

  if (!stage || editing) {
    return (
      <section className="rise rounded-[24px] bg-paper/55 p-5 ring-1 ring-line backdrop-blur-md">
        <p className="eyebrow">Made for you</p>
        <h2 className="mt-0.5 text-xl">Where are you in your journey right now?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This shapes what Terra Woman leads with. You can change it any time.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LIFE_STAGES.map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate(s.value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-colors disabled:opacity-60 ${
                profile?.life_stage === s.value
                  ? "bg-copper/15 text-copper-ink ring-copper/40"
                  : "bg-paper text-muted-foreground ring-line hover:bg-copper/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="mt-4 text-xs font-semibold text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="rise rounded-[24px] bg-paper/55 p-5 ring-1 ring-line backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Made for you · {stage.label}</p>
          <h2 className="mt-0.5 text-xl leading-snug">{stage.headline}</h2>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-full bg-paper px-3 py-1.5 text-[11px] font-bold ring-1 ring-line hover:bg-cream"
        >
          Change
        </button>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {stage.watchFor.map((item) => (
          <li
            key={item}
            className="rounded-full bg-copper/12 px-3 py-1.5 text-[11px] font-semibold text-copper-ink ring-1 ring-copper/25"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {stage.suggestions.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="rounded-full bg-sky/20 px-4 py-1.5 text-xs font-bold ring-1 ring-sky/30"
          >
            {s.label}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        For personal reflection only — not medical advice.
      </p>
    </section>
  );
}
