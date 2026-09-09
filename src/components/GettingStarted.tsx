import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { todayKey } from "@/lib/wellness";

const DISMISS_KEY = "terra-getting-started-v1";

export type StarterStep = {
  id: string;
  title: string;
  body: string;
  cta: string;
  to: string;
  search?: Record<string, string>;
  done: boolean;
};

export function useStarterSteps() {
  const { user } = useAuth();
  const today = todayKey();

  const q = useQuery({
    queryKey: ["getting-started", user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const [devices, meds, cycles, checkins, metrics] = await Promise.all([
        supabase.from("device_connections").select("id, status").limit(5),
        supabase.from("medications").select("id").limit(1),
        supabase.from("cycle_periods").select("id").limit(1),
        supabase.from("daily_checkins").select("id").eq("checkin_date", today).limit(1),
        supabase.from("daily_metrics").select("id").limit(1),
      ]);
      return {
        connected:
          (devices.data ?? []).some((d) => d.status === "connected") ||
          (metrics.data ?? []).length > 0,
        hasMeds: (meds.data ?? []).length > 0,
        hasCycle: (cycles.data ?? []).length > 0,
        checkedIn: (checkins.data ?? []).length > 0,
      };
    },
  });

  const d = q.data;
  const steps: StarterStep[] = [
    {
      id: "connect",
      title: "Connect your ring or watch",
      body: "Link Oura, or add your Apple Watch numbers by hand — sleep, HRV and readiness start filling in.",
      cta: "Connect a device",
      to: "/health",
      search: { tab: "devices" },
      done: !!d?.connected,
    },
    {
      id: "checkin",
      title: "Do your first check-in",
      body: "Ten quick sliders — how you feel today. This is what makes the patterns show up later.",
      cta: "Check in",
      to: "/",
      done: !!d?.checkedIn,
    },
    {
      id: "meds",
      title: "Add your medications",
      body: "Set them up once, then it's one tap a day to confirm you took them.",
      cta: "Add medications",
      to: "/health",
      search: { tab: "meds" },
      done: !!d?.hasMeds,
    },
    {
      id: "cycle",
      title: "Log your cycle",
      body: "Add your last period — leave the end date blank if it's still going.",
      cta: "Log a period",
      to: "/health",
      search: { tab: "cycle" },
      done: !!d?.hasCycle,
    },
  ];

  return { steps, ready: !q.isLoading && !!d };
}

export function GettingStarted({
  onSelectTab,
  className = "",
}: {
  onSelectTab?: (tab: string) => void;
  className?: string;
}) {
  const { steps, ready } = useStarterSteps();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed || !ready) return null;
  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;

  const doneCount = steps.length - remaining.length;

  return (
    <section
      className={`rise rounded-[28px] bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Getting started</p>
          <h2 className="mt-1 font-display text-xl">Let's set up your first week</h2>
          <p className="mt-1 max-w-[54ch] text-sm text-muted-foreground">
            Four small steps. You don't have to do them all today — anything you add starts
            building your picture.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-background px-3 py-1 text-[11px] font-bold text-copper-ink ring-1 ring-copper/30">
            {doneCount} of {steps.length} done
          </span>
          <button
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setDismissed(true);
            }}
            className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
          >
            Hide
          </button>
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2.5">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={`flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 ring-1 ${
              s.done ? "bg-background/60 ring-line" : "bg-background ring-line"
            }`}
          >
            <span
              aria-hidden
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                s.done
                  ? "bg-primary text-primary-foreground"
                  : "bg-paper text-muted-foreground ring-1 ring-line"
              }`}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <div className="min-w-[12rem] flex-1">
              <p
                className={`text-sm font-semibold ${
                  s.done ? "text-muted-foreground line-through" : ""
                }`}
              >
                {s.title}
              </p>
              {!s.done && (
                <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{s.body}</p>
              )}
            </div>
            {!s.done &&
              (onSelectTab && s.search?.tab ? (
                <button
                  onClick={() => onSelectTab(s.search!.tab as string)}
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  {s.cta}
                </button>
              ) : (
                <Link
                  to={s.to}
                  search={s.search as never}
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  {s.cta}
                </Link>
              ))}
          </li>
        ))}
      </ol>
    </section>
  );
}
