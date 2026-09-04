import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { fetchPublishedRoots } from "@/lib/roots-public";
import type { RootsRecord } from "@/lib/roots";
import {
  BeginningRoot,
  BotanicalDivider,
  DangerousRoot,
  DiscoveryNote,
  Eyebrow,
  HeroRoot,
  KnewRoot,
  QuoteRoot,
  RootChipCard,
  RootTile,
  ThisDayRoot,
  WomanRoot,
} from "@/components/roots/editorial";
import { TerraMark } from "@/components/roots/primitives";
import {
  BRANCHES,
  BRANCH_BLURB,
  branchOf,
  hasExactDay,
  hasQuote,
  isSilenced,
  pickMany,
  pickOne,
  rotate,
  todaySeed,
} from "@/lib/roots-editorial";

export const Route = createFileRoute("/roots/")({
  head: () => ({
    meta: [
      { title: "ROOTS — the women who brought us here · Terra Woman" },
      {
        name: "description",
        content:
          "ROOTS is Terra Woman's living archive of women, wisdom and moments across thousands of years — healers, thinkers, voices and discoveries, told as stories.",
      },
      { property: "og:title", content: "ROOTS — the women who brought us here" },
      {
        property: "og:description",
        content: "The women, wisdom and moments that brought us here.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <RootsLanding />
    </AppShell>
  ),
});

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={className}>{children}</section>;
}

function RootsLanding() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["roots", "published"],
    queryFn: fetchPublishedRoots,
  });

  const composed = useMemo(() => compose(records), [records]);

  return (
    <div className="space-y-16 pb-24 pt-6 sm:space-y-20">
      <header className="mx-auto max-w-2xl text-center">
        <TerraMark className="mx-auto size-7 text-mint" />
        <h1 className="mt-6 font-display text-[3.2rem] leading-[0.92] sm:text-[4.5rem]">
          Roots<span className="text-copper">.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[24ch] font-display text-xl leading-snug text-muted-foreground sm:max-w-none sm:text-2xl">
          The women, wisdom and moments that brought us here.
        </p>
      </header>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Opening the archive…</p>
      ) : !records.length ? (
        <p className="mx-auto max-w-md text-center font-display text-2xl text-muted-foreground">
          The archive is still growing. Come back soon.
        </p>
      ) : (
        <>
          {composed.hero && (
            <Section>
              <HeroRoot record={composed.hero} />
            </Section>
          )}

          {composed.thisDay && (
            <Section>
              <ThisDayRoot record={composed.thisDay} />
            </Section>
          )}

          {composed.quote && (
            <Section>
              <QuoteRoot record={composed.quote} tone="forest" />
            </Section>
          )}

          {composed.woman && (
            <Section className="grid gap-6 md:grid-cols-5">
              <div className="md:col-span-3">
                <WomanRoot record={composed.woman} />
              </div>
              {composed.womanAside.length > 0 && (
                <div className="grid gap-4 md:col-span-2">
                  {composed.womanAside.map((r) => (
                    <RootTile key={r.id} record={r} />
                  ))}
                </div>
              )}
            </Section>
          )}

          {composed.discovery && (
            <Section className="py-4">
              <BotanicalDivider className="mb-10" />
              <DiscoveryNote record={composed.discovery} />
              <BotanicalDivider className="mt-10" />
            </Section>
          )}

          {composed.dangerous && (
            <Section>
              <DangerousRoot record={composed.dangerous} />
              {composed.dangerousMore.length > 0 && (
                <div className="-mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                  {composed.dangerousMore.map((r) => (
                    <RootChipCard key={r.id} record={r} />
                  ))}
                </div>
              )}
            </Section>
          )}

          {composed.knew && (
            <Section>
              <KnewRoot record={composed.knew} />
            </Section>
          )}

          {composed.beginning && (
            <Section>
              <BeginningRoot record={composed.beginning} />
            </Section>
          )}

          {composed.secondQuote && (
            <Section>
              <QuoteRoot record={composed.secondQuote} tone="cream" />
            </Section>
          )}

          {/* Explore the tree */}
          <Section>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow className="text-copper-ink">Explore the tree</Eyebrow>
              <p className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
                Every branch holds its own women.
              </p>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-line sm:grid-cols-2 lg:grid-cols-3">
              {BRANCHES.filter((b) => (composed.branchCounts[b] ?? 0) > 0).map((b) => (
                <Link
                  key={b}
                  to="/roots/branch/$branch"
                  params={{ branch: b.toLowerCase() }}
                  className="group bg-paper p-6 transition-colors hover:bg-background"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="roots-label text-foreground">{b}</span>
                    <span className="roots-meta text-muted-foreground">
                      {composed.branchCounts[b]}
                    </span>
                  </div>
                  <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-muted-foreground">
                    {BRANCH_BLURB[b]}
                  </p>
                </Link>
              ))}
            </div>
          </Section>

          {/* Keep reading */}
          <Section>
            <div className="flex items-baseline justify-between gap-4">
              <Eyebrow className="text-copper-ink">Keep reading</Eyebrow>
              <span className="roots-meta text-muted-foreground">
                {records.length} stories in the archive
              </span>
            </div>
            <div className="mt-4">
              {composed.rest.map((r) => (
                <RootTile key={r.id} record={r} />
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

/* ---------------- editorial composition ---------------- */

type Composed = {
  hero: RootsRecord | null;
  thisDay: RootsRecord | null;
  quote: RootsRecord | null;
  secondQuote: RootsRecord | null;
  woman: RootsRecord | null;
  womanAside: RootsRecord[];
  discovery: RootsRecord | null;
  dangerous: RootsRecord | null;
  dangerousMore: RootsRecord[];
  knew: RootsRecord | null;
  beginning: RootsRecord | null;
  rest: RootsRecord[];
  branchCounts: Partial<Record<string, number>>;
};

function compose(all: RootsRecord[]): Composed {
  const seed = todaySeed();
  const used = new Set<string>();
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const women = all.filter((r) => r.content_type === "wise_woman" || r.content_type === "healer");
  const quotes = all.filter(hasQuote);
  const silenced = all.filter(isSilenced);
  const deep = all.filter((r) => r.content_type === "from_the_beginning");
  const knew = all.filter((r) => r.content_type === "what_women_knew");

  const onThisDate = all.filter((r) => {
    if (!hasExactDay(r)) return false;
    const m = r.exact_date ? Number(r.exact_date.slice(5, 7)) : r.month;
    const d = r.exact_date ? Number(r.exact_date.slice(8, 10)) : r.day;
    return m === month && d === day;
  });
  const dated = all.filter(hasExactDay);

  const hero = pickOne(all.filter((r) => r.featured).length ? all.filter((r) => r.featured) : all, seed, used);
  const thisDay = pickOne(onThisDate.length ? onThisDate : dated, seed + 1, used);
  const quote = pickOne(quotes, seed + 2, used);
  const woman = pickOne(women.filter((r) => !isSilenced(r)), seed + 3, used);
  const womanAside = pickMany(women, seed + 4, 2, used);
  const discovery = pickOne(knew.length ? knew : all, seed + 5, used);
  const dangerous = pickOne(silenced, seed + 6, used);
  const dangerousMore = pickMany(silenced, seed + 7, 4, used);
  const knewCard = pickOne(knew, seed + 8, used);
  const beginning = pickOne(deep, seed + 9, used);
  const secondQuote = pickOne(quotes, seed + 10, used);

  const branchCounts: Partial<Record<string, number>> = {};
  for (const r of all) {
    const b = branchOf(r);
    if (b) branchCounts[b] = (branchCounts[b] ?? 0) + 1;
  }

  const rest = rotate(all.filter((r) => !used.has(r.id)), seed).slice(0, 24);

  return {
    hero,
    thisDay,
    quote,
    secondQuote,
    woman,
    womanAside,
    discovery,
    dangerous,
    dangerousMore,
    knew: knewCard,
    beginning,
    rest,
    branchCounts,
  };
}
