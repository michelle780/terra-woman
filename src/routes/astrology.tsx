import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HoroscopeCard } from "@/components/HoroscopeCard";
import { moonPhase, todayKey } from "@/lib/wellness";

export const Route = createFileRoute("/astrology")({
  head: () => ({
    meta: [
      { title: "Astrology & Moon — Pulse wellness tracker" },
      {
        name: "description",
        content:
          "Today's moon phase and your daily horoscope in one place — a gentle reading for reflection, not advice.",
      },
      { property: "og:title", content: "Astrology & Moon — Pulse wellness tracker" },
      {
        property: "og:description",
        content: "Tonight's moon phase and a daily zodiac horoscope for rest, energy and self-care.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <AstrologyAndMoon />
    </AppShell>
  ),
});

function AstrologyAndMoon() {
  const today = todayKey();
  const moon = moonPhase(today);

  const next = (target: string) => {
    const d = new Date(`${today}T00:00:00Z`);
    for (let i = 1; i <= 60; i++) {
      d.setUTCDate(d.getUTCDate() + 1);
      const key = d.toISOString().slice(0, 10);
      if (key) {
        const p = moonPhase(key);
        if (p.name === target) return { key, illumination: p.illumination };
      }
    }
    return null;
  };
  const nextFull = next("Full Moon");
  const nextNew = next("New Moon");

  const upcoming: { key: string; name: string; icon: string; illumination: number }[] = [];
  const d = new Date(`${today}T00:00:00Z`);
  for (let i = 0; i <= 30; i++) {
    const key = d.toISOString().slice(0, 10);
    if (key) {
      const p = moonPhase(key);
      upcoming.push({ key, name: p.name, icon: p.icon, illumination: p.illumination });
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }

  const fmt = (k: string) =>
    new Date(`${k}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="mt-4 grid gap-4">
      {/* Today — the larger main section */}
      <section className="rise rounded-[28px] bg-paper p-5 ring-1 ring-line sm:p-8">
        <p className="eyebrow">Today · Moon & stars</p>
        <h1 className="mt-1 text-3xl leading-tight sm:text-4xl">
          {moon.name} · {moon.illumination}% lit
        </h1>
        <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
          Tonight's moon and your daily reading, side by side — a calm way to notice how your energy,
          sleep and mood shift with the cycles above.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Moon tonight */}
          <div className="rounded-[24px] bg-mint/15 px-5 py-5 ring-1 ring-mint/30">
            <div className="flex items-center gap-4">
              <span className="text-5xl" aria-hidden>
                {moon.icon}
              </span>
              <div>
                <p className="font-display text-2xl font-semibold">{moon.name}</p>
                <p className="text-xs text-muted-foreground">{moon.illumination}% illuminated</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              Some people like to notice how their energy and sleep shift with the lunar cycle.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
                <p className="eyebrow">Next full</p>
                <p className="font-display text-lg font-semibold">
                  {nextFull ? fmt(nextFull.key) : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
                <p className="eyebrow">Next new</p>
                <p className="font-display text-lg font-semibold">
                  {nextNew ? fmt(nextNew.key) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Horoscope today */}
          <HoroscopeCard />
        </div>
      </section>

      {/* Secondary — the 30-day lunar outlook */}
      <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Next 30 days</h2>
          <span className="text-xs text-muted-foreground">Lunar outlook</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {upcoming.map((u) => (
            <div
              key={u.key}
              className={`rounded-2xl px-3 py-2.5 text-center ring-1 ${
                u.key === today ? "bg-sky/15 ring-sky/30" : "bg-background ring-line"
              }`}
            >
              <span className="block text-2xl leading-none" aria-hidden>
                {u.icon}
              </span>
              <span className="mt-1 block text-[11px] font-semibold">{fmt(u.key)}</span>
              <span className="block text-[10px] text-muted-foreground">{u.illumination}% lit</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
