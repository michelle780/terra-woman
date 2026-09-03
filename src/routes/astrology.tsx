import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HoroscopeCard } from "@/components/HoroscopeCard";

export const Route = createFileRoute("/astrology")({
  head: () => ({
    meta: [
      { title: "Astrology — Pulse wellness tracker" },
      {
        name: "description",
        content:
          "Your daily horoscope by zodiac sign — a short, gentle reading for reflection, not advice.",
      },
      { property: "og:title", content: "Astrology — Pulse wellness tracker" },
      {
        property: "og:description",
        content: "Daily zodiac horoscope for rest, energy and self-care.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Astrology />
    </AppShell>
  ),
});

function Astrology() {
  return (
    <div className="mt-4 grid gap-4">
      <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line sm:p-7">
        <p className="eyebrow">Astrology</p>
        <h1 className="mt-1 text-3xl leading-tight">Daily horoscope</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick your sign for a short, gentle reading each day — focused on energy, rest and
          self-care. Saved to your profile so it's here whenever you open the app.
        </p>
      </section>

      <HoroscopeCard />
    </div>
  );
}
