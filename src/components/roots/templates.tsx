/**
 * The six ROOTS visual treatments.
 *
 * Contemporary editorial + botanical archive + museum collection, held
 * together by Terra Woman forest green and cream. Roughly 70% Terra Woman,
 * 30% historical material — the archive never becomes entirely antique.
 */
import type { ReactNode } from "react";
import type { RootsRecord } from "@/lib/roots";
import {
  ArchivalImage,
  Branch,
  Label,
  Meta,
  RightsPending,
  RootLines,
  Rule,
  Signature,
  Sprig,
  TerraMark,
  useReveal,
} from "@/components/roots/primitives";
import {
  catalogNumber,
  dayLabel,
  eventYear,
  hasUsableAsset,
  placeAndEra,
  resolveTemplate,
  yearsAgo,
  type VisualTemplate,
} from "@/lib/roots-visual";

export type RootsCardProps = {
  record: RootsRecord;
  /** "card" = archive feed, "share" = 1080x1350 portrait proportions. */
  format?: "card" | "share" | undefined;
  className?: string | undefined;
};

const TYPE_LABEL: Record<string, string> = {
  wise_woman: "Wise Woman",
  healer: "Healer",
  from_the_beginning: "From the Beginning",
  in_her_words: "In Her Words",
  this_day: "This Day",
  what_women_knew: "What Women Knew",
};

export function typeLabel(r: RootsRecord) {
  return (TYPE_LABEL[r.content_type ?? ""] ?? r.content_type ?? "Roots").toUpperCase();
}

function Frame({
  children,
  tone,
  format = "card",
  className = "",
}: {
  children: ReactNode;
  tone: "cream" | "forest";
  format?: "card" | "share" | undefined;
  className?: string | undefined;
}) {
  const { ref, className: revealed } = useReveal<HTMLElement>();
  return (
    <article
      ref={ref}
      className={`relative isolate overflow-hidden ${revealed} ${
        tone === "forest" ? "roots-forest" : "roots-paper bg-paper text-foreground"
      } ${format === "share" ? "aspect-[1080/1350]" : "min-h-[26rem]"} ${className}`}
    >
      {children}
    </article>
  );
}

/* ---------------- 1. THE HERBARIUM ---------------- */

export function HerbariumCard({ record: r, format, className }: RootsCardProps) {
  return (
    <Frame tone="cream" format={format} className={className}>
      <Sprig className="pointer-events-none absolute -right-2 top-8 h-56 w-24 text-mint opacity-50" />
      <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">
        <header className="flex items-start justify-between gap-6">
          <Label className="text-copper-ink">{typeLabel(r)}</Label>
          <Meta className="text-muted-foreground">{catalogNumber(r)}</Meta>
        </header>

        <div className="max-w-[26ch] py-8">
          <h3 className="font-display text-4xl leading-[1.05] font-normal sm:text-5xl">
            {r.short_title || r.title}
          </h3>
          {r.short_body && (
            <p className="mt-6 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
              {r.short_body}
            </p>
          )}
        </div>

        <footer>
          <Rule className="mb-3" />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid gap-1">
              <Meta className="text-muted-foreground">{placeAndEra(r) || "Long history"}</Meta>
              {r.topic && <Meta className="text-copper-ink">{r.topic}</Meta>}
            </div>
            <Signature />
          </div>
        </footer>
      </div>
    </Frame>
  );
}

/* ---------------- 2. THE WOMAN ---------------- */

export function WomanCard({ record: r, format, className }: RootsCardProps) {
  const usable = hasUsableAsset(r);
  return (
    <Frame tone="cream" format={format} className={className}>
      <div className="grid h-full grid-cols-5">
        <div className="relative col-span-2 border-r border-line">
          {usable ? (
            <ArchivalImage
              url={r.visual_asset_url!}
              alt={r.woman_name ?? r.title}
              className="h-full w-full"
              imgClassName="object-cover object-[30%_20%] grayscale-[0.15] contrast-[1.05]"
            />
          ) : (
            <RightsPending />
          )}
          {/* fine tree lines crossing the portrait boundary */}
          <Branch className="pointer-events-none absolute -right-16 bottom-6 h-32 w-56 text-background mix-blend-soft-light" />
        </div>

        <div className="relative col-span-3 flex flex-col justify-between p-7 sm:p-9">
          <div>
            <Label className="text-copper-ink">{typeLabel(r)}</Label>
            <h3 className="mt-4 font-display text-3xl leading-[1.02] sm:text-[2.6rem]">
              {r.woman_name ?? r.title}
            </h3>
            {r.woman_lifespan && (
              <Meta className="mt-2 block text-muted-foreground">{r.woman_lifespan}</Meta>
            )}
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
              {[r.topic, r.culture, r.geography].filter(Boolean).map((t) => (
                <Meta key={t as string} className="text-foreground/70">
                  {t}
                </Meta>
              ))}
            </div>
          </div>

          <p className="my-6 max-w-[42ch] text-sm leading-relaxed text-foreground/85">
            {r.quote ? `“${r.quote}”` : r.short_body}
          </p>

          <footer>
            <Rule className="mb-3" />
            <div className="flex items-end justify-between gap-3">
              <Meta className="text-muted-foreground">{catalogNumber(r)}</Meta>
              <Signature variant="slash" />
            </div>
          </footer>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- 3. THE ARTIFACT ---------------- */

export function ArtifactCard({ record: r, format, className }: RootsCardProps) {
  const usable = hasUsableAsset(r);
  const y = eventYear(r);
  const ago = yearsAgo(r);
  return (
    <Frame tone="cream" format={format} className={className}>
      <div className="relative flex h-full flex-col p-8 sm:p-10">
        <header className="flex items-baseline justify-between gap-4">
          <Label className="text-copper-ink">
            {ago ? `${ago.toLocaleString()} years ago` : typeLabel(r)}
          </Label>
          <Meta className="text-muted-foreground">{catalogNumber(r)}</Meta>
        </header>

        <h3 className="mt-5 max-w-[20ch] font-display text-3xl leading-[1.05] sm:text-[2.7rem]">
          {r.short_title || r.title}
        </h3>

        <div className="relative my-7 grid flex-1 grid-cols-12 items-center gap-6">
          <div className="col-span-7 h-full min-h-40">
            {usable ? (
              <ArchivalImage
                url={r.visual_asset_url!}
                alt={r.title}
                className="h-full w-full"
                imgClassName="object-contain"
              />
            ) : (
              <RightsPending />
            )}
          </div>
          <dl className="col-span-5 grid gap-3 border-l border-line pl-5">
            {[
              ["Object", r.visual_asset_type ?? r.content_type?.replaceAll("_", " ")],
              ["Date", r.exact_date ?? (y ? String(y) : r.historical_period)],
              ["Place", r.geography],
              ["Collection", r.visual_asset_source ?? "—"],
              ["Source", r.source_name],
            ].map(([k, v]) => (
              <div key={k as string}>
                <Meta className="block text-muted-foreground/80">{k}</Meta>
                <span className="text-xs leading-snug">{(v as string) || "—"}</span>
              </div>
            ))}
          </dl>
        </div>

        <footer>
          <Rule className="mb-3" />
          <div className="flex items-end justify-between gap-3">
            <p className="max-w-[40ch] text-xs leading-relaxed text-muted-foreground">{r.short_body}</p>
            <Signature />
          </div>
        </footer>
      </div>
    </Frame>
  );
}

/* ---------------- 4. THIS DAY ---------------- */

export function ThisDayCard({ record: r, format, className }: RootsCardProps) {
  const day = dayLabel(r);
  const y = eventYear(r);
  const ago = yearsAgo(r);
  return (
    <Frame tone="forest" format={format} className={className}>
      <RootLines className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-background opacity-25" />
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute right-8 top-8 size-20 text-background opacity-40" fill="none" aria-hidden>
        <path d="M70 30a26 26 0 1 1-23-25.8A30 30 0 0 0 70 30Z" stroke="currentColor" strokeWidth="0.9" />
        <circle cx="18" cy="72" r="1" fill="currentColor" />
        <circle cx="34" cy="86" r="0.8" fill="currentColor" />
        <circle cx="82" cy="66" r="0.8" fill="currentColor" />
      </svg>

      <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">
        <header className="grid gap-2">
          <Label className="text-background/70">This Day</Label>
          <Meta className="text-background/90">{day ?? placeAndEra(r)}</Meta>
          {y && <span className="font-display text-2xl text-background/80">{y}</span>}
        </header>

        <h3 className="max-w-[14ch] py-8 font-display text-5xl leading-[0.95] uppercase sm:text-6xl">
          {r.short_title || r.title}
        </h3>

        <div className="grid gap-4">
          <p className="max-w-[40ch] text-sm leading-relaxed text-background/85">{r.short_body}</p>
          {ago && <Meta className="text-background/70">{ago.toLocaleString()} years ago</Meta>}
          <Rule />
          <div className="flex items-end justify-between gap-3">
            <Meta className="text-background/60">{catalogNumber(r)}</Meta>
            <Signature />
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- 5. IN HER WORDS ---------------- */

export function InHerWordsCard({ record: r, format, className }: RootsCardProps) {
  const quote = r.quote ?? r.short_body ?? "";
  return (
    <Frame tone="forest" format={format} className={className}>
      <Sprig className="pointer-events-none absolute -left-3 bottom-6 h-40 w-16 text-background opacity-30" leaves={3} />
      <div className="relative flex h-full flex-col justify-between p-8 sm:p-12">
        <Label className="text-background/70">In Her Words</Label>

        <blockquote className="py-8">
          <p className="font-display text-[2.1rem] leading-[1.08] sm:text-[3.1rem]">
            “{quote}”
          </p>
        </blockquote>

        <footer className="grid gap-3">
          <div className="grid gap-1">
            <span className="roots-label text-background">{r.quote_attribution ?? r.woman_name}</span>
            {r.topic && <Meta className="text-background/70">{r.topic}</Meta>}
            {r.woman_lifespan && <Meta className="text-background/70">{r.woman_lifespan}</Meta>}
          </div>
          <Rule />
          <div className="flex items-end justify-between gap-3">
            <Meta className="text-background/60">{catalogNumber(r)}</Meta>
            <div className="flex items-center gap-2 opacity-80">
              <TerraMark className="size-4" />
              <Label>Terra Woman</Label>
            </div>
          </div>
        </footer>
      </div>
    </Frame>
  );
}

/* ---------------- 6. THE LIVING TREE ---------------- */

export function LivingTreeCard({ record: r, format, className }: RootsCardProps) {
  return (
    <Frame tone="cream" format={format} className={className}>
      <Branch className="pointer-events-none absolute -left-10 bottom-0 h-64 w-[26rem] text-mint opacity-70" />
      <RootLines className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full text-copper-soft opacity-40" />

      <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">
        <header className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <Label className="text-copper-ink">{typeLabel(r)}</Label>
            <Meta className="text-muted-foreground">Added to the Terra Woman tree</Meta>
          </div>
          <TerraMark className="size-8 text-mint" />
        </header>

        <div className="ml-auto max-w-[24ch] py-10 text-right">
          <h3 className="font-display text-[2.4rem] leading-[1.03] sm:text-[3.2rem]">
            {r.short_title || r.title}
          </h3>
          {r.why_it_matters && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{r.why_it_matters}</p>
          )}
        </div>

        <footer className="ml-auto w-full max-w-md">
          <Rule className="mb-3" />
          <div className="flex items-end justify-between gap-3">
            <Meta className="text-muted-foreground">{placeAndEra(r)}</Meta>
            <Signature variant="slash" />
          </div>
        </footer>
      </div>
    </Frame>
  );
}

/* ---------------- dispatcher ---------------- */

export const TEMPLATE_COMPONENTS: Record<
  VisualTemplate,
  (props: RootsCardProps) => ReactNode
> = {
  herbarium: HerbariumCard,
  woman: WomanCard,
  artifact: ArtifactCard,
  this_day: ThisDayCard,
  in_her_words: InHerWordsCard,
  living_tree: LivingTreeCard,
};

export function RootsCard({
  record,
  template,
  ...rest
}: RootsCardProps & { template?: VisualTemplate }) {
  const key = template ?? resolveTemplate(record);
  const Component = TEMPLATE_COMPONENTS[key];
  return <Component record={record} {...rest} />;
}
