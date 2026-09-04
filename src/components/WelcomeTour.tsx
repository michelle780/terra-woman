import { useEffect, useState } from "react";

const STORAGE_KEY = "terra-woman-tour-v1";

const STEPS = [
  {
    title: "Welcome to Terra Woman",
    body: "Your private oasis for how your body and mood actually move together. Nothing here is shared — it's yours alone.",
  },
  {
    title: "Start with Today",
    body: "Your morning numbers, a quick 1–10 check-in on how you feel, and your medications all live on the Today page.",
  },
  {
    title: "One-tap medications",
    body: "Add your medications once with a schedule, then confirm the day's doses with a single tap — or confirm them all at once.",
  },
  {
    title: "Watch the patterns appear",
    body: "After a few days, Trends, Cycle and Astrology & Moon start showing how sleep, mood and your cycle connect.",
  },
];

export function WelcomeTour({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    setOpen(true);
  }, [enabled]);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "done");
    } catch {
      // Private mode — the tour simply shows again next visit.
    }
    setOpen(false);
  }

  if (!open) return null;
  const current = STEPS[step]!;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Terra Woman"
        className="rise w-full max-w-md rounded-[28px] bg-paper p-6 ring-1 ring-line"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-copper/15 ring-1 ring-copper/30">
            <span className="size-2.5 rounded-full bg-copper" />
          </div>
          <span className="font-display text-xs font-semibold tracking-[0.22em] uppercase">
            Terra Woman
          </span>
        </div>

        <h2 className="mt-4 font-display text-2xl leading-tight">{current.title}</h2>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">{current.body}</p>

        <div className="mt-5 flex items-center gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-copper" : "bg-line"}`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={finish}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
          <button
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {last ? "Start my day" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
