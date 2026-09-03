import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUOTES, quoteOfTheDay } from "@/lib/quotes";
import { todayKey } from "@/lib/wellness";

type RootsQuote = {
  id: string;
  quote: string;
  quote_attribution: string | null;
  source_name: string | null;
  source_url: string | null;
};

async function fetchRootsQuotes(): Promise<RootsQuote[]> {
  const { data, error } = await supabase
    .from("roots_content")
    .select("id, quote, quote_attribution, source_name, source_url")
    .eq("published", true)
    .eq("historical_accuracy_status", "VERIFIED")
    .not("quote", "is", null)
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).filter((r) => r.quote && r.quote.trim() !== "") as RootsQuote[];
}

function dayIndex(dateKey: string, modulo: number): number {
  let h = 0;
  for (const ch of dateKey) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % modulo;
}

/**
 * Quote of the day — pulled from the ROOTS archive (published, verified
 * "in her words" quotes), falling back to the curated list when the
 * archive has none. Editorial, oasis-inspired treatment.
 */
export function DailyQuoteCard() {
  const today = todayKey();
  const fallback = quoteOfTheDay(today);

  const { data: rootsQuotes = [] } = useQuery({
    queryKey: ["roots-quotes"],
    queryFn: fetchRootsQuotes,
    staleTime: 5 * 60_000,
  });

  // One combined pool — ROOTS "in her words" quotes first, then the curated
  // list — so the daily pick rotates across the whole library.
  const pool = [
    ...rootsQuotes.map((r) => ({
      text: r.quote,
      author: r.quote_attribution ?? "From the ROOTS archive",
      source: r.source_name ?? "Terra Woman ROOTS",
      url: r.source_url ?? undefined,
      fromRoots: true,
    })),
    ...QUOTES.map((c) => ({ ...c, fromRoots: false })),
  ];
  const q = pool.length > 0 ? pool[dayIndex(today, pool.length)]! : { ...fallback, fromRoots: false };

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
            {q.fromRoots ? "Quote of the day · In her words" : "Quote of the day"}
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
            {q.url ? (
              <a
                href={q.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-ink underline-offset-4 hover:underline"
              >
                {q.source}
              </a>
            ) : (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-ink">
                {q.source}
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-[12px] italic text-muted-foreground">
          For reflection only — part of seeing your bigger picture.
        </p>
      </div>
    </section>
  );
}
