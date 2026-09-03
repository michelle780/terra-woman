import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { moonPhase, todayKey } from "@/lib/wellness";

export const Route = createFileRoute("/moon")({
  head: () => ({
    meta: [
      { title: "Moon phase — Pulse wellness tracker" },
      {
        name: "description",
        content:
          "Tonight's moon phase, illumination and the next full and new moons — for noticing how your energy shifts with the lunar cycle.",
      },
      { property: "og:title", content: "Moon phase — Pulse wellness tracker" },
      {
        property: "og:description",
        content: "Tonight's moon phase and upcoming lunar phases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Moon />
    </AppShell>
  ),
});

function Moon() {
  const today = todayKey();
  const moon = moonPhase(today);

  // Next full and new moon: walk forward up to ~60 days.
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

  // Upcoming phases for the next 30 days.
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
    new Date(`${k}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="mt-4 grid gap-4">
      <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line sm:p-7">
        <p className="eyebrow">Moon</p>
        <h1 className="mt-1 text-3xl leading-tight">Tonight's moon</h1>

        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-mint/15 px-5 py-4 ring-1 ring-mint/30">
          <span className="text-5xl" aria-hidden>
            {moon.icon}
          </span>
          <div>
            <p className="font-display text-2xl font-semibold">
              {moon.name}{" "}
              <span className="text-base font-normal text-muted-foreground">
                · {moon.illumination}% lit
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tonight's moon phase — some people like to notice how their energy and sleep shift
              with the lunar cycle.
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
            <p className="eyebrow">Next full moon</p>
            <p className="font-display text-xl font-semibold">
              {nextFull ? fmt(nextFull.key) : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-line">
            <p className="eyebrow">Next new moon</p>
            <p className="font-display text-xl font-semibold">
              {nextNew ? fmt(nextNew.key) : "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <h2 className="text-xl">Next 30 days</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
              <span className="block text-[10px] text-muted-foreground">
                {u.illumination}% lit
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
