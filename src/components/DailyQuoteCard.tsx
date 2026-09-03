import { Quote } from "lucide-react";
import { quoteOfTheDay } from "@/lib/quotes";
import { todayKey } from "@/lib/wellness";

export function DailyQuoteCard() {
  const q = quoteOfTheDay(todayKey());

  return (
    <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
      <p className="eyebrow flex items-center gap-1.5">
        <Quote className="size-3.5 text-primary" aria-hidden />
        Quote of the day
      </p>
      <blockquote className="mt-2 text-lg leading-snug text-pretty sm:text-xl">
        “{q.text}”
      </blockquote>
      <p className="mt-2 text-sm text-muted-foreground">
        — {q.author} ·{" "}
        <a
          href={q.url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline underline-offset-2"
        >
          {q.source}
        </a>
      </p>
    </section>
  );
}
