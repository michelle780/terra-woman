import { Link } from "@tanstack/react-router";
import { moonPhase, todayKey } from "@/lib/wellness";

const FEATURES = [
  {
    dot: "bg-sky",
    title: "Daily check-in",
    body: "Rate energy, happiness, fulfillment, cramps, bloating and more on a simple 1–10 scale.",
  },
  {
    dot: "bg-mint",
    title: "Sleep, HRV & readiness",
    body: "Log what your ring or watch reports and watch the patterns build over weeks.",
  },
  {
    dot: "bg-rose",
    title: "Medications",
    body: "Keep your list in one place and tick off what you have taken today.",
  },
  {
    dot: "bg-amber",
    title: "Journal & horoscope",
    body: "A private note for each day, plus a little daily reflection for your sign.",
  },
];

export function Landing({ invitedBy }: { invitedBy?: string | null }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-sky/15 ring-1 ring-sky/30">
              <span className="size-2.5 rounded-full bg-sky" />
            </div>
            <span className="text-base font-bold">Pulse</span>
          </div>
          <Link
            to="/auth"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            Sign in
          </Link>
        </header>

        <section className="rise mt-6 rounded-[28px] bg-paper p-7 ring-1 ring-line sm:p-10">
          {invitedBy ? (
            <p className="eyebrow">{invitedBy} invited you to Pulse</p>
          ) : (
            <p className="eyebrow">A private wellness log</p>
          )}
          <h1 className="mt-2 max-w-2xl text-4xl leading-[1.05] sm:text-6xl">
            Notice how your body and your mood move together.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Pulse is a calm daily log for sleep, energy, symptoms, medications and how you actually
            felt. Everything stays private to your own account.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Create your free account
            </Link>
            <Link
              to="/auth"
              className="rounded-2xl bg-background px-5 py-3 text-sm font-semibold ring-1 ring-line transition-colors hover:bg-cream"
            >
              I already have one
            </Link>
          </div>
        </section>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <LandingMoon />
          <LandingAstrology />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <section key={f.title} className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className={`size-2 rounded-full ${f.dot}`} />
                {f.title}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </section>
          ))}
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted-foreground">
          <span>Pulse is a personal wellness log — not medical advice.</span>
          <span className="flex gap-4">
            <Link to="/privacy" className="font-semibold hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="font-semibold hover:text-foreground">
              Terms
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
