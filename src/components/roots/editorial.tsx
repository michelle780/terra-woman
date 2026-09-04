/**
 * The consumer ROOTS experience — editorial compositions, not database cards.
 *
 * Nothing here renders record ids, verification, templates or raw URLs.
 * Mobile-first: large readable type, generous vertical rhythm, few containers.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { RootsRecord } from "@/lib/roots";
import { Branch, Label, RootLines, Sprig, TerraMark, useReveal } from "@/components/roots/primitives";
import {
  dayLabel,
  eraLine,
  formatYear,
  placeLine,
  roleLine,
  seriesLabel,
  yearOf,
  yearsAgo,
  yearsAgoLabel,
} from "@/lib/roots-editorial";

/* ---------------- shared bits ---------------- */

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Label className={`block ${className}`}>{children}</Label>;
}

export function PlaceEra({ record: r, className = "" }: { record: RootsRecord; className?: string }) {
  const bits = [placeLine(r), eraLine(r)].filter(Boolean) as string[];
  if (!bits.length) return null;
  return (
    <span className={`roots-meta block ${className}`}>{bits.join(" · ")}</span>
  );
}

export function DiscoverLine({ label = "Discover", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`roots-label inline-flex items-center gap-2 ${className}`}>
      {label} <span aria-hidden>→</span>
    </span>
  );
}

export function BotanicalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 py-2 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-line" />
      <TerraMark className="size-5 text-mint" />
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function Panel({
  to,
  tone = "cream",
  className = "",
  children,
}: {
  to: string;
  tone?: "cream" | "forest" | "bare";
  className?: string;
  children: ReactNode;
}) {
  const { ref, className: revealed } = useReveal<HTMLDivElement>();
  const skin =
    tone === "forest"
      ? "roots-forest"
      : tone === "cream"
        ? "roots-paper bg-paper ring-1 ring-line/70"
        : "";
  return (
    <Link to="/roots/$id" params={{ id: to }} className="group block">
      <div
        ref={ref}
        className={`relative isolate overflow-hidden rounded-3xl transition-transform duration-500 group-hover:-translate-y-0.5 ${skin} ${revealed} ${className}`}
      >
        {children}
      </div>
    </Link>
  );
}

function title(r: RootsRecord) {
  return r.short_title || r.title;
}

/* ---------------- 1. Today's root — the hero ---------------- */

export function HeroRoot({ record: r }: { record: RootsRecord }) {
  const ago = yearsAgoLabel(r);
  return (
    <Panel to={r.id} tone="forest" className="px-6 py-12 sm:px-12 sm:py-16">
      <Sprig className="pointer-events-none absolute -right-4 top-4 h-56 w-20 text-background opacity-25" leaves={4} />
      <RootLines className="pointer-events-none absolute inset-x-0 -bottom-2 h-24 w-full text-background opacity-20" />
      <div className="relative max-w-2xl">
        <Eyebrow className="text-background/70">Today's root</Eyebrow>
        <h2 className="mt-5 font-display text-[2.6rem] leading-[0.98] sm:text-6xl">
          {title(r)}
        </h2>
        {r.short_body && (
          <p className="mt-6 max-w-[46ch] text-[0.98rem] leading-relaxed text-background/85">
            {r.short_body}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-1">
            {r.woman_name && <span className="roots-label text-background">{r.woman_name}</span>}
            <PlaceEra record={r} className="text-background/70" />
            {ago && <span className="roots-meta text-background/60">{ago}</span>}
          </div>
          <DiscoverLine className="text-background/90" />
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- 2. In her words ---------------- */

export function QuoteRoot({
  record: r,
  tone = "forest",
}: {
  record: RootsRecord;
  tone?: "forest" | "cream";
}) {
  const quote = r.quote ?? "";
  const long = quote.length > 150;
  return (
    <Panel to={r.id} tone={tone} className="px-6 py-14 sm:px-14 sm:py-20">
      <Sprig
        className={`pointer-events-none absolute -left-2 bottom-4 h-36 w-14 ${
          tone === "forest" ? "text-background opacity-25" : "text-mint opacity-60"
        }`}
        leaves={3}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <Eyebrow className={tone === "forest" ? "text-background/70" : "text-copper-ink"}>
          In her words
        </Eyebrow>
        <blockquote
          className={`mt-8 font-display leading-[1.08] ${
            long ? "text-[1.9rem] sm:text-[3rem]" : "text-[2.4rem] sm:text-[4rem]"
          }`}
        >
          “{quote}”
        </blockquote>
        <div className="mt-10 grid gap-1.5">
          <span className="roots-label">{r.quote_attribution ?? r.woman_name}</span>
          {roleLine(r) && (
            <span className={`roots-meta ${tone === "forest" ? "text-background/70" : "text-muted-foreground"}`}>
              {roleLine(r)}
            </span>
          )}
          {r.woman_lifespan && (
            <span className={`roots-meta ${tone === "forest" ? "text-background/60" : "text-muted-foreground"}`}>
              {r.woman_lifespan}
            </span>
          )}
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 opacity-70">
          <TerraMark className="size-4" />
          <Label>Terra Woman</Label>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- 3. Meet a woman ---------------- */

export function WomanRoot({ record: r }: { record: RootsRecord }) {
  return (
    <Panel to={r.id} tone="cream" className="px-6 py-10 sm:px-10 sm:py-12">
      <Branch className="pointer-events-none absolute -right-16 -top-6 h-48 w-72 text-mint opacity-50" flip />
      <div className="relative">
        <Eyebrow className="text-copper-ink">Meet a woman</Eyebrow>
        <h3 className="mt-5 max-w-[18ch] font-display text-[2.1rem] leading-[1.02] sm:text-[3rem]">
          {r.woman_name ?? title(r)}
        </h3>
        <div className="mt-3 grid gap-1">
          {r.woman_lifespan && <span className="roots-meta text-muted-foreground">{r.woman_lifespan}</span>}
          {roleLine(r) && <span className="roots-label text-foreground/70">{roleLine(r)}</span>}
          {placeLine(r) && <span className="roots-meta text-muted-foreground">{placeLine(r)}</span>}
        </div>
        {r.short_body && (
          <p className="mt-6 max-w-[48ch] text-[0.95rem] leading-relaxed text-foreground/85">
            {r.short_body}
          </p>
        )}
        <DiscoverLine label="Discover her story" className="mt-8 text-copper-ink" />
      </div>
    </Panel>
  );
}

/* ---------------- 4. What women knew ---------------- */

export function KnewRoot({ record: r }: { record: RootsRecord }) {
  return (
    <Panel to={r.id} tone="cream" className="px-6 py-12 sm:px-12 sm:py-14">
      <Sprig className="pointer-events-none absolute -right-1 top-6 h-52 w-20 text-mint opacity-60" />
      <div className="relative max-w-xl">
        <Eyebrow className="text-copper-ink">What women knew</Eyebrow>
        <h3 className="mt-5 max-w-[16ch] font-display text-[2.2rem] leading-[1.02] sm:text-[3.1rem]">
          {title(r)}
        </h3>
        {r.short_body && (
          <p className="mt-6 max-w-[44ch] text-[0.95rem] leading-relaxed text-muted-foreground">
            {r.short_body}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <PlaceEra record={r} className="text-muted-foreground" />
          <DiscoverLine label="Explore" className="text-copper-ink" />
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- 5. From the beginning ---------------- */

export function BeginningRoot({ record: r }: { record: RootsRecord }) {
  const ago = yearsAgoLabel(r);
  const year = formatYear(yearOf(r));
  return (
    <Panel to={r.id} tone="forest" className="px-6 py-12 sm:px-12 sm:py-16">
      <RootLines className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-background opacity-20" />
      <div className="relative">
        <Eyebrow className="text-background/70">From the beginning</Eyebrow>
        {ago && (
          <p className="mt-6 font-display text-[3.2rem] leading-[0.92] uppercase sm:text-[4.5rem]">
            {ago}
          </p>
        )}
        <h3 className="mt-6 max-w-[20ch] font-display text-2xl leading-[1.1] text-background/90 sm:text-[2.1rem]">
          {title(r)}
        </h3>
        <div className="mt-8 grid gap-1">
          {placeLine(r) && <span className="roots-meta text-background/70">{placeLine(r)}</span>}
          {year && <span className="roots-meta text-background/60">{year}</span>}
        </div>
        <DiscoverLine className="mt-8 text-background/90" />
      </div>
    </Panel>
  );
}

/* ---------------- 6. This day ---------------- */

export function ThisDayRoot({ record: r }: { record: RootsRecord }) {
  const day = dayLabel(r);
  const year = formatYear(yearOf(r));
  const ago = yearsAgo(r);
  return (
    <Panel to={r.id} tone="forest" className="px-6 py-12 sm:px-12 sm:py-16">
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute right-6 top-6 size-16 text-background opacity-40" fill="none" aria-hidden>
        <path d="M70 30a26 26 0 1 1-23-25.8A30 30 0 0 0 70 30Z" stroke="currentColor" strokeWidth="0.9" />
      </svg>
      <div className="relative">
        <Eyebrow className="text-background/70">This day</Eyebrow>
        {day && (
          <p className="mt-5 font-display text-3xl uppercase leading-none sm:text-4xl">{day}</p>
        )}
        {year && <p className="mt-2 roots-meta text-background/70">{year}</p>}
        <h3 className="mt-8 max-w-[16ch] font-display text-[2.4rem] leading-[0.98] sm:text-[3.4rem]">
          {title(r)}
        </h3>
        {r.short_body && (
          <p className="mt-6 max-w-[44ch] text-[0.95rem] leading-relaxed text-background/85">
            {r.short_body}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {ago && <span className="roots-meta text-background/60">{ago.toLocaleString()} years ago</span>}
          <DiscoverLine className="text-background/90" />
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- 7. They called her dangerous ---------------- */

export function DangerousRoot({ record: r }: { record: RootsRecord }) {
  return (
    <Panel to={r.id} tone="forest" className="px-6 py-14 sm:px-14 sm:py-18">
      <Branch className="pointer-events-none absolute -left-12 bottom-0 h-52 w-80 text-background opacity-20" />
      <div className="relative max-w-2xl">
        <Eyebrow className="text-copper-soft">Terra Woman series</Eyebrow>
        <p className="mt-5 font-display text-[2.6rem] leading-[0.94] uppercase sm:text-[3.6rem]">
          They called her
          <br />
          dangerous.
        </p>
        <div className="mt-10 grid gap-2">
          <span className="font-display text-2xl sm:text-3xl">{r.woman_name ?? title(r)}</span>
          {roleLine(r) && <span className="roots-label text-background/80">{roleLine(r)}</span>}
          <PlaceEra record={r} className="text-background/60" />
        </div>
        {r.short_body && (
          <p className="mt-7 max-w-[46ch] text-[0.95rem] leading-relaxed text-background/85">
            {r.short_body}
          </p>
        )}
        <DiscoverLine label="Discover her story" className="mt-8 text-background/90" />
      </div>
    </Panel>
  );
}

/* ---------------- 8. A small discovery — no container at all ---------------- */

export function DiscoveryNote({ record: r }: { record: RootsRecord }) {
  const { ref, className } = useReveal<HTMLDivElement>();
  return (
    <Link to="/roots/$id" params={{ id: r.id }} className="group block">
      <div ref={ref} className={`mx-auto max-w-2xl text-center ${className}`}>
        <Eyebrow className="text-copper-ink">Did you know?</Eyebrow>
        <p className="mt-6 font-display text-[1.65rem] leading-[1.2] sm:text-[2.2rem]">
          {r.short_body ?? title(r)}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <PlaceEra record={r} className="text-muted-foreground" />
        </div>
        <DiscoverLine className="mt-6 text-copper-ink opacity-70 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

/* ---------------- 9. Compact browse item ---------------- */

export function RootTile({ record: r }: { record: RootsRecord }) {
  const { ref, className } = useReveal<HTMLDivElement>();
  return (
    <Link to="/roots/$id" params={{ id: r.id }} className="group block">
      <div
        ref={ref}
        className={`grid gap-2 border-t border-line py-6 transition-colors group-hover:border-copper/60 ${className}`}
      >
        <Eyebrow className="text-copper-ink">{seriesLabel(r)}</Eyebrow>
        <h4 className="max-w-[26ch] font-display text-[1.45rem] leading-[1.12] sm:text-[1.7rem]">
          {r.woman_name ?? title(r)}
        </h4>
        {r.short_body && (
          <p className="line-clamp-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            {r.short_body}
          </p>
        )}
        <PlaceEra record={r} className="text-muted-foreground/80" />
      </div>
    </Link>
  );
}

/* ---------------- 10. Horizontal carousel item ---------------- */

export function RootChipCard({ record: r }: { record: RootsRecord }) {
  return (
    <Link
      to="/roots/$id"
      params={{ id: r.id }}
      className="group block w-[15rem] shrink-0 snap-start rounded-2xl bg-paper p-5 ring-1 ring-line/70 transition-transform duration-500 hover:-translate-y-0.5 sm:w-[17rem]"
    >
      <Eyebrow className="text-copper-ink">{seriesLabel(r)}</Eyebrow>
      <p className="mt-4 font-display text-[1.35rem] leading-[1.12]">
        {r.woman_name ?? title(r)}
      </p>
      <PlaceEra record={r} className="mt-3 text-muted-foreground" />
      {r.short_body && (
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{r.short_body}</p>
      )}
    </Link>
  );
}

/* ---------------- story hero (no photograph available) ---------------- */

export function StoryHero({ record: r }: { record: RootsRecord }) {
  const silenced = seriesLabel(r) === "They Called Her Dangerous";
  const ago = yearsAgoLabel(r);
  return (
    <div
      className={`relative isolate overflow-hidden rounded-3xl px-6 py-14 sm:px-14 sm:py-20 ${
        silenced ? "roots-forest" : "roots-paper bg-paper ring-1 ring-line/70"
      }`}
    >
      <Branch
        className={`pointer-events-none absolute -left-10 bottom-0 h-56 w-80 ${
          silenced ? "text-background opacity-20" : "text-mint opacity-50"
        }`}
      />
      <Sprig
        className={`pointer-events-none absolute -right-2 top-4 h-52 w-20 ${
          silenced ? "text-background opacity-20" : "text-mint opacity-50"
        }`}
        leaves={4}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <Eyebrow className={silenced ? "text-copper-soft" : "text-copper-ink"}>{seriesLabel(r)}</Eyebrow>
        <h1 className="mt-6 font-display text-[2.4rem] leading-[1.0] sm:text-[3.4rem]">
          {r.woman_name ?? title(r)}
        </h1>
        {r.woman_name && title(r) !== r.woman_name && (
          <p className={`mt-4 font-display text-xl ${silenced ? "text-background/80" : "text-muted-foreground"}`}>
            {title(r)}
          </p>
        )}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {placeLine(r) && (
            <span className={`roots-meta ${silenced ? "text-background/70" : "text-muted-foreground"}`}>
              {placeLine(r)}
            </span>
          )}
          {eraLine(r) && (
            <span className={`roots-meta ${silenced ? "text-background/70" : "text-muted-foreground"}`}>
              {eraLine(r)}
            </span>
          )}
          {ago && (
            <span className={`roots-meta ${silenced ? "text-background/60" : "text-muted-foreground/80"}`}>
              {ago}
            </span>
          )}
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 opacity-70">
          <TerraMark className="size-4" />
          <Label>Terra Woman</Label>
        </div>
      </div>
    </div>
  );
}
