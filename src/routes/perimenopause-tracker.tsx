import { createFileRoute, Link } from "@tanstack/react-router";
import terraTree from "@/assets/terra-tree.png";

const TITLE = "Perimenopause Tracker — Track Symptoms, Sleep & Cycle";
const DESCRIPTION =
  "A private perimenopause tracker for symptoms, sleep, HRV, cycle shifts, mood and medications — see how they move together, in one place.";
const URL = "https://terrawoman.org/perimenopause-tracker";

export const Route = createFileRoute("/perimenopause-tracker")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          mainEntityOfPage: URL,
          author: { "@type": "Organization", name: "Terra Woman" },
          publisher: { "@type": "Organization", name: "Terra Woman" },
        }),
      },
    ],
  }),
  component: PerimenopausePage,
});

const WHAT_TO_TRACK = [
  {
    label: "Cycle shifts",
    body: "Perimenopause often shows up first as changing cycle length, skipped months and heavier or lighter bleeding. Log each period — start date, flow and symptoms — and leave the end date blank while it's ongoing.",
  },
  {
    label: "Sleep and night waking",
    body: "Sleep duration and sleep score come straight from your Oura ring, or you can enter Apple Watch numbers by hand. Broken sleep alongside a hot-flush note tells a fuller story than either on its own.",
  },
  {
    label: "HRV and resting heart rate",
    body: "Recovery markers drift through the perimenopause years and around each cycle. Seeing them on the same timeline as your mood and cycle is what turns numbers into a pattern.",
  },
  {
    label: "Mood, anxiety and brain fog",
    body: "A 1–10 daily check-in for happiness, calm, energy, focus, stress, anxiety and mood swings — a minute a day, and after a few weeks the heavy days start to have a shape.",
  },
  {
    label: "Bloating, cramps and other symptoms",
    body: "Physical symptoms sit in the same check-in, so you're never keeping a separate list in your head or in a notebook you can't search.",
  },
  {
    label: "Medications and supplements",
    body: "Set your medications and supplements up once, then confirm them with one tap each day — including anything taken only as needed.",
  },
];

const STEPS = [
  {
    n: "1",
    label: "Tell us your season",
    body: "Choose perimenopause when you sign up and Terra Woman leads with what matters now — cycle changes, sleep, recovery and mood — instead of a generic dashboard.",
  },
  {
    n: "2",
    label: "Bring your numbers in",
    body: "Connect an Oura ring for sleep, readiness, HRV, resting heart rate and steps, or enter Apple Watch figures manually. You can also import cycle history from your Apple Health export.",
  },
  {
    n: "3",
    label: "Check in for a minute a day",
    body: "Rate how you feel, note symptoms, confirm your medications. Small notes, kept consistently, are what make the patterns readable.",
  },
  {
    n: "4",
    label: "Look back, then bring it to your appointment",
    body: "Trends show your months side by side. When you're ready, you can share a chosen slice with a partner or clinician — with a signed consent you can withdraw at any time.",
  },
];

function PerimenopausePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <img
          src={terraTree}
          alt=""
          width={1005}
          height={1007}
          className="h-[92vh] w-auto max-w-none opacity-[0.16]"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-3"
          aria-label="Terra Woman home"
        >
          <span className="grid size-9 place-items-center rounded-full bg-copper/15 ring-1 ring-copper/30">
            <span className="size-2.5 rounded-full bg-copper" />
          </span>
          <span className="font-display text-base font-semibold uppercase tracking-[0.22em]">
            Terra Woman
          </span>
        </Link>

        <header className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-ink">
            A guide for the perimenopause years
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            A perimenopause tracker for the whole picture, not one symptom at a time
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Perimenopause rarely announces itself. Cycles get shorter, then longer. Sleep breaks
            up. Energy and mood move in ways that are hard to explain in a ten-minute appointment.
            Terra Woman keeps your symptoms, sleep, cycle, recovery data and medications in one
            private place, so you can look back and see the pattern instead of living through it
            again from memory.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-6 py-3 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start tracking free
            </Link>
            <Link
              to="/about"
              className="rounded-full bg-paper px-6 py-3 text-xs font-bold ring-1 ring-line transition-colors hover:bg-copper/10"
            >
              Why we built this
            </Link>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">
            What's worth tracking in perimenopause
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            No single number explains a perimenopause day. The value is in seeing them together.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {WHAT_TO_TRACK.map((item) => (
              <div key={item.label} className="rounded-3xl bg-card p-5 ring-1 ring-line">
                <h3 className="font-display text-base font-semibold">{item.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="flex gap-4 rounded-3xl bg-card p-5 ring-1 ring-line"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-copper/15 font-display text-sm font-bold text-copper-ink ring-1 ring-copper/30">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">{step.label}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 rounded-3xl bg-gradient-to-br from-copper/10 via-card to-sage/15 p-6 ring-1 ring-copper/25">
          <h2 className="font-display text-2xl font-semibold">
            The Tree of Life, in your own season
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Terra Woman is built as a tree. The <strong>roots</strong> hold the women who came
            before us — healers, midwives and physicians who wrote down what they knew about
            women's bodies when no one else would. The <strong>trunk</strong> is your daily
            check-in, where sleep, mood, cycle and medications come together. The{" "}
            <strong>branches</strong> are your own story as it grows. Perimenopause is a season on
            that tree, not a fault to be fixed.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Explore the{" "}
            <Link to="/roots" className="font-semibold hover:underline">
              living archive of women's knowledge
            </Link>{" "}
            behind it.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Private by default</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your check-ins, symptoms, cycle and medications are visible only to you. Nothing is
            shared with a partner or clinician unless you sign a consent choosing exactly what
            they see, and you can withdraw that access at any moment. You can download a copy of
            everything you've entered whenever you like. Read our{" "}
            <Link to="/privacy" className="font-semibold hover:underline">
              privacy promise
            </Link>
            .
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Terra Woman is a reflective tracking tool, not medical advice or a diagnosis. Talk to a
            clinician about symptoms that worry you — and bring your notes with you.
          </p>
        </section>

        <section className="mt-10 rounded-3xl bg-card p-6 text-center ring-1 ring-line">
          <h2 className="font-display text-2xl font-semibold">
            See your WHOLE self through this season
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A minute a day. Your symptoms, your sleep, your cycle and your medications, finally in
            one place.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-block rounded-full bg-primary px-7 py-3 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Create your private space
          </Link>
        </section>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Terra Woman ·{" "}
          <Link to="/about" className="font-semibold hover:underline">
            Our story
          </Link>{" "}
          ·{" "}
          <Link to="/privacy" className="font-semibold hover:underline">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link to="/terms" className="font-semibold hover:underline">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
