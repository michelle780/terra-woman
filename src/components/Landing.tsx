import { Link } from "@tanstack/react-router";
import { moonPhase, todayKey } from "@/lib/wellness";
import { QUOTES } from "@/lib/quotes";
import { BRANCHES, BRANCH_BLURB } from "@/lib/roots-editorial";
import { ProductPreview } from "@/components/ProductPreview";
import { FounderPreview } from "@/components/FounderPreview";
import terraTree from "@/assets/terra-tree.png";

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

/** One quote per woman — the strip never repeats an author. */
const LANDING_QUOTES = (() => {
  const seen = new Set<string>();
  return QUOTES.filter((q) => {
    const key = q.author.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
})();

/** A taste of the living archive for the invite page. */
const ROOTS_TEASER_BRANCHES = BRANCHES.slice(0, 6);

export function Landing({ invitedBy }: { invitedBy?: string | null }) {
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
          className="h-[92vh] w-auto max-w-none opacity-[0.18]"
        />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={terraTree} alt="" width={40} height={40} className="size-10 object-contain" />
            <span className="font-display text-base font-semibold uppercase tracking-[0.22em]">Terra Woman</span>
          </div>
          <Link
            to="/auth"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            Sign in
          </Link>
        </header>

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rise rounded-[28px] bg-paper/90 p-7 ring-1 ring-line backdrop-blur-sm sm:p-10">
            {invitedBy ? (
              <p className="eyebrow">{invitedBy} invited you to Terra Woman</p>
            ) : (
              <p className="eyebrow">A calm oasis for your wellbeing</p>
            )}
            <h1 className="mt-2 max-w-2xl text-4xl leading-[1.05] sm:text-5xl">
              See yourself whole.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
              Terra Woman is a happy, empowering place to notice how your sleep, energy,
              symptoms, cycle and mood move together. Everything stays private to your own account.
            </p>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Built by a woman who had more data about herself than ever — and none of it telling
              the story of her.{" "}
              <Link to="/about" className="font-semibold text-copper-ink hover:underline">
                Read why I built Terra Woman
              </Link>
              .
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
            <p className="eyebrow mt-8">A living record — like a tree of life</p>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Roots hold the wisdom of women before you, the trunk is your daily check-in, and the
              branches are the patterns that grow as you keep showing up.
            </p>
          </section>
          <div className="rise">
            <p className="eyebrow mb-2 px-1">A look inside</p>
            <ProductPreview />
            <div className="rounded-[24px] bg-paper/90 p-5 ring-1 ring-line backdrop-blur-sm lg:hidden">
              <p className="text-sm text-muted-foreground">
                Today, medications, check-ins, cycle, trends and daily wisdom — all in one calm,
                private place.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <FounderPreview />
        </div>

        <section className="rise mt-4 rounded-[28px] bg-paper/90 p-6 ring-1 ring-line backdrop-blur-sm">
          <p className="eyebrow">In her words</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {LANDING_QUOTES.map((q) => (
              <figure key={q.text} className="rounded-[20px] bg-background/70 p-4 ring-1 ring-line">
                <blockquote className="font-display text-lg leading-snug text-pretty">
                  “{q.text}”
                </blockquote>
                <figcaption className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-copper-ink">
                  {q.author}
                </figcaption>
              </figure>
            ))}
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
          <span>Terra Woman is your personal wellness oasis — not medical advice.</span>
          <span className="flex gap-4">
            <Link to="/about" className="font-semibold hover:text-foreground">
              Our story
            </Link>
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

const ZODIAC_GLYPHS = [
  "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓",
];

function LandingMoon() {
  const moon = moonPhase(todayKey());
  return (
    <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="size-2 rounded-full bg-mint" />
        Tonight's moon
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {moon.icon}
        </span>
        <div>
          <p className="font-display text-xl font-semibold">
            {moon.name}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              · {moon.illumination}% lit
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            A gentle way to notice how your energy shifts with the lunar cycle.
          </p>
        </div>
      </div>
    </section>
  );
}

function LandingAstrology() {
  return (
    <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="size-2 rounded-full bg-amber" />
        Daily horoscope
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-2xl">
        {ZODIAC_GLYPHS.map((g) => (
          <span key={g} aria-hidden className="text-amber/80">
            {g}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        A short, daily reading for your sign — focused on rest, energy and self-care. Pick your
        sign when you sign up.
      </p>
    </section>
  );
}
