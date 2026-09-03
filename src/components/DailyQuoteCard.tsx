import { Quote } from "lucide-react";
import { quoteOfTheDay } from "@/lib/quotes";
import { todayKey } from "@/lib/wellness";

export function DailyQuoteCard() {
  const q = quoteOfTheDay(todayKey());

  return (
    <section className="rise relative overflow-hidden rounded-[24px] bg-paper ring-1 ring-line">
      {/* warm tinted backdrop */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky/25 via-paper to-mint/20"
        aria-hidden
      />
      {/* oversized decorative quotation mark */}
      <span
        className="pointer-events-none absolute -top-6 left-3 select-none font-display text-[7rem] leading-none text-primary/15 sm:text-[9rem]"
        aria-hidden
      >
        “
      </span>

      <div className="relative p-6 sm:p-8">
        <p className="eyebrow flex items-center gap-1.5">
          <Quote className="size-3.5 text-primary" aria-hidden />
          Quote of the day
        </p>

        <blockquote className="mt-5 max-w-[46ch] font-display text-2xl leading-snug text-pretty text-foreground sm:text-[2rem] sm:leading-[1.15]">
          {q.text}
        </blockquote>

        <div className="mt-5 flex items-center gap-3">
          <span className="h-px w-10 bg-primary/40" aria-hidden />
          <p className="text-sm">
            <span className="font-semibold text-foreground">{q.author}</span>
            <span className="text-muted-foreground"> · </span>
            <a
              href={q.url}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline underline-offset-2"
            >
              {q.source}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
