import { createFileRoute, Link } from "@tanstack/react-router";
import terraTree from "@/assets/terra-tree.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Why I Built Terra Woman — Our Story" },
      {
        name: "description",
        content:
          "Terra Woman started with frustration: more data than ever, and none of it telling the story of me. A place to see yourself whole.",
      },
      { property: "og:title", content: "Why I Built Terra Woman — Our Story" },
      {
        property: "og:description",
        content:
          "The founder story behind Terra Woman — holistic, not prescriptive. Data-driven, deeply human. See your WHOLE self.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const PARAGRAPHS: Array<{ text: string; lead?: boolean }> = [
  {
    text: "I was sitting at home one afternoon, a few hours before school pickup, between client calls. I was healthy. I was doing all the “right” things. And I was also deep in the haze of perimenopause: mood shifts, hormonal changes, fluctuations in energy and a body that suddenly seemed to be operating by a set of rules I hadn’t been given.",
  },
  { text: "The strange thing was, I had more information about myself than ever.", lead: true },
  {
    text: "My ring knew how I slept. My watch knew how I moved. Apple Health had years of data. I had medications and supplements I was trying to keep track of. I knew my cycle. I knew my moods. I knew when I felt incredible and when I absolutely did not.",
  },
  { text: "But none of it came together to tell me the story of me.", lead: true },
  {
    text: "Every app had its own interpretation. Sleep over here. Steps over there. Hormones somewhere else. Mood in my head. Medications in a bottle. The moon phase on another app. Astrology somewhere else entirely.",
  },
  { text: "I didn’t want another dashboard telling me whether I was doing well." },
  { text: "I wanted a place that reflected me back to me.", lead: true },
  {
    text: "I wanted to be able to look back and see: How have I actually felt for the past three months? When do I feel strongest? When am I depleted? What was happening with my sleep, my cycle, my mood, my medications, my supplements?",
  },
  {
    text: "And yes, I wanted to know when a full moon was coming. Not because an app should tell me the moon caused the way I felt, but because if that rhythm mattered to me, I wanted to see it alongside everything else. If my astrological sign suggested a period of flow, I wanted the choice to notice it, embrace it, and see whether it resonated with my actual experience.",
  },
];

const AS_I = ["Not as Oura interpreted me.", "Not as Apple interpreted me.", "As I experienced myself."];

const PARAGRAPHS_TWO: Array<{ text: string; lead?: boolean }> = [
  {
    text: "I wanted something holistic, but not prescriptive. Scientific, but open to the forms of wisdom women have turned to for generations. Data-driven, but deeply human.",
  },
  { text: "And I wanted to actually enjoy opening it." },
  {
    text: "Not another obligation. Not another red notification. Not another app reminding me of something I had failed to do.",
  },
  { text: "A place to return to myself.", lead: true },
  { text: "That’s why I built Terra Woman." },
  { text: "And from the beginning, I knew it couldn’t only be about us." },
  {
    text: "Women have been trying to understand their bodies, care for one another and pass knowledge from one generation to the next for thousands of years. Wise women. Healers. Midwives. Physicians. Scientists. Teachers. Mothers. Risk-takers. Women whose names we know and countless others whose names history never recorded.",
  },
  { text: "We stand on their shoulders.", lead: true },
  {
    text: "Their stories and wisdom are woven through Terra Woman’s Tree of Life: our roots representing those who came before us, the trunk bringing knowledge together, and the branches representing each woman’s own evolving story.",
  },
  { text: "Terra Woman isn’t here to tell you who you are." },
  { text: "It’s here to help you see yourself whole.", lead: true },
  { text: "And perhaps, in doing that, help you come home to yourself." },
];

const TREE_PARTS = [
  {
    label: "Roots",
    body: "The women who came before us — healers, midwives, scientists, mothers — and the wisdom they passed down.",
  },
  {
    label: "Trunk",
    body: "Your daily check-in, where sleep, mood, cycle, medications and rhythm come together in one place.",
  },
  {
    label: "Branches",
    body: "Your own evolving story — the patterns that grow as you keep showing up for yourself.",
  },
];

function AboutPage() {
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
          className="h-[92vh] w-auto max-w-none opacity-[0.14]"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={terraTree} alt="" width={40} height={40} className="size-10 object-contain" />
            <span className="font-display text-base font-semibold uppercase tracking-[0.22em]">
              Terra Woman
            </span>
          </Link>
          <Link
            to="/auth"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            Sign in
          </Link>
        </header>

        <article className="rise mt-6 rounded-[28px] bg-paper/92 p-6 ring-1 ring-line backdrop-blur-sm sm:p-10">
          <p className="eyebrow">Our story</p>
          <h1 className="mt-1 text-3xl leading-[1.08] sm:text-5xl">Why I Built Terra Woman</h1>
          <p className="mt-5 font-display text-xl text-copper-ink sm:text-2xl">
            Terra Woman started with frustration.
          </p>

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90 sm:text-base">
            {PARAGRAPHS.map((p) =>
              p.lead ? (
                <p key={p.text} className="font-display text-lg leading-snug text-foreground sm:text-2xl">
                  {p.text}
                </p>
              ) : (
                <p key={p.text}>{p.text}</p>
              ),
            )}

            <div className="rounded-[22px] bg-background/70 p-5 ring-1 ring-line">
              {AS_I.map((line, i) => (
                <p
                  key={line}
                  className={
                    i === AS_I.length - 1
                      ? "font-display text-lg text-copper-ink sm:text-xl"
                      : "text-muted-foreground"
                  }
                >
                  {line}
                </p>
              ))}
            </div>

            {PARAGRAPHS_TWO.map((p) =>
              p.lead ? (
                <p key={p.text} className="font-display text-lg leading-snug text-foreground sm:text-2xl">
                  {p.text}
                </p>
              ) : (
                <p key={p.text}>{p.text}</p>
              ),
            )}
          </div>

          <section className="mt-9 border-t border-line pt-7">
            <p className="eyebrow">The Tree of Life</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {TREE_PARTS.map((part) => (
                <div key={part.label} className="rounded-[20px] bg-background/70 p-4 ring-1 ring-line">
                  <p className="font-display text-lg">{part.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{part.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-9 rounded-[24px] bg-copper/10 p-7 text-center ring-1 ring-copper/25">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-copper-ink">
              Terra Woman
            </p>
            <p className="mt-2 font-display text-3xl sm:text-4xl">See your WHOLE self.</p>
            <Link
              to="/auth"
              className="mt-5 inline-block rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start your own record
            </Link>
          </section>
        </article>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Terra Woman is your personal wellness oasis — not medical advice.</span>
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
