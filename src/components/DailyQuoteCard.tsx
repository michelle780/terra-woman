import { quoteOfTheDay } from "@/lib/quotes";
import { todayKey } from "@/lib/wellness";

/**
 * Quote of the day — editorial, oasis-inspired treatment.
 * Nods to The Female Quotient: warm cream stage, copper rule,
 * oversized serif headline, quiet empowering tone.
 */
export function DailyQuoteCard() {
  const q = quoteOfTheDay(todayKey());

  return (
    <section className="rise relative overflow-hidden rounded-[28px] bg-paper ring-1 ring-line">
      {/* warm oasis wash with a soft copper glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 88% -10%, color-mix(in oklab, var(--copper) 22%, transparent) 0%, transparent 55%), linear-gradient(160deg, color-mix(in oklab, var(--accent) 18%, transparent), transparent 60%)",
        }}
        aria-hidden
      />
      {/* hairline copper frame inside the card */}
      <div
        className="pointer-events-none absolute inset-2.5 rounded-[20px] ring-1 ring-copper/20"
        aria-hidden
      />

      <div className="relative px-6 py-7 sm:px-10 sm:py-9">
        <div className="flex items-center gap-2.5">
          <span className="h-px w-8 bg-copper/60" aria-hidden />
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-copper-ink"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Quote of the day
          </p>
        </div>

        <blockquote className="mt-5 max-w-[44ch] font-display text-[1.7rem] leading-[1.18] text-pretty text-foreground sm:text-[2.15rem] sm:leading-[1.14]">
          <span className="mr-1 align-top font-display text-copper/70">&ldquo;</span>
          {q.text}
          <span className="ml-0.5 font-display text-copper/70">&rdquo;</span>
        </blockquote>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-7 w-px bg-copper/40" aria-hidden />
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold text-foreground">
              {q.author}
            </p>
            <a
              href={q.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-copper underline-offset-4 hover:underline"
            >
              {q.source}
            </a>
          </div>
        </div>

        <p className="mt-6 text-[12px] italic text-muted-foreground">
          For reflection only — part of seeing your bigger picture.
        </p>
      </div>
    </section>
  );
}
