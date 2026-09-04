/**
 * Auto-scrolling preview of the product shown beside the sign-in form.
 * Pure presentation — mock cards, no data fetching.
 */
const SCREENS = [
  {
    eyebrow: "Today",
    title: "Your morning, at a glance",
    body: "Readiness, sleep, HRV and steps from your ring and watch in one calm view.",
    chips: ["Readiness 82", "7h 20m sleep", "HRV 64 ms"],
    tone: "bg-sky/15 ring-sky/30",
  },
  {
    eyebrow: "Medications",
    title: "One tap to confirm",
    body: "Set your list once, then confirm the day's doses with a single tap.",
    chips: ["Confirm all", "3/3 taken", "As needed"],
    tone: "bg-mint/15 ring-mint/30",
  },
  {
    eyebrow: "Check-in",
    title: "How you actually feel",
    body: "Rate happiness, calm, energy, bloating and more from 1 to 10 in seconds.",
    chips: ["Happiness 8", "Calm 7", "Bloating 3"],
    tone: "bg-rose/15 ring-rose/30",
  },
  {
    eyebrow: "Cycle",
    title: "Your rhythm, mapped",
    body: "Period dates, flow and symptoms alongside the moon phase and your energy.",
    chips: ["Day 14", "Ovulation", "Full moon"],
    tone: "bg-amber/20 ring-amber/40",
  },
  {
    eyebrow: "Trends",
    title: "See the bigger picture",
    body: "Watch mood, sleep and symptoms move together over weeks, not days.",
    chips: ["7 days", "30 days", "Patterns"],
    tone: "bg-copper/10 ring-copper/30",
  },
  {
    eyebrow: "Roots",
    title: "Daily wisdom",
    body: "A quote or story from women who came before you, every single day.",
    chips: ["In her words", "Herbarium", "This day"],
    tone: "bg-sky/15 ring-sky/30",
  },
];

function PreviewCard({ screen }: { screen: (typeof SCREENS)[number] }) {
  return (
    <div className="rounded-[24px] bg-paper p-5 ring-1 ring-line">
      <p className="eyebrow">{screen.eyebrow}</p>
      <h3 className="mt-1 font-display text-xl leading-snug">{screen.title}</h3>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">{screen.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {screen.chips.map((c) => (
          <span
            key={c}
            className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${screen.tone}`}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProductPreview() {
  const loop = [...SCREENS, ...SCREENS];

  return (
    <div className="relative hidden h-[560px] overflow-hidden rounded-[32px] bg-background/40 p-4 ring-1 ring-line lg:block">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-background to-transparent"
      />
      <div className="preview-marquee space-y-4">
        {loop.map((screen, i) => (
          <PreviewCard key={`${screen.eyebrow}-${i}`} screen={screen} />
        ))}
      </div>
    </div>
  );
}
