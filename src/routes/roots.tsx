import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { fetchPublishedRoots } from "@/lib/roots-public";
import { RootsCard } from "@/components/roots/templates";
import { TerraWomanTree, PRIMARY_BRANCHES, type BranchName } from "@/components/roots/TerraWomanTree";
import { Label, Meta, TerraMark } from "@/components/roots/primitives";
import { resolveTemplate } from "@/lib/roots-visual";

export const Route = createFileRoute("/roots")({
  head: () => ({
    meta: [
      { title: "ROOTS — the living women's archive · Terra Woman" },
      {
        name: "description",
        content:
          "ROOTS is Terra Woman's living archive of women's inherited knowledge — healers, wise women, discoveries and words, rendered as a botanical editorial archive.",
      },
      { property: "og:title", content: "ROOTS — the living women's archive · Terra Woman" },
      {
        property: "og:description",
        content: "Part botanical field journal, part museum collection, part contemporary women's publication.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <RootsFeed />
    </AppShell>
  ),
});

const TYPE_FILTERS = [
  { key: "all", label: "All roots" },
  { key: "wise_woman", label: "Wise Women" },
  { key: "healer", label: "Healers" },
  { key: "from_the_beginning", label: "From the Beginning" },
  { key: "in_her_words", label: "In Her Words" },
  { key: "this_day", label: "This Day" },
  { key: "what_women_knew", label: "What Women Knew" },
] as const;

function RootsFeed() {
  const [filter, setFilter] = useState<string>("all");
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["roots", "published"],
    queryFn: fetchPublishedRoots,
  });

  const visible = useMemo(
    () => (filter === "all" ? records : records.filter((r) => r.content_type === filter)),
    [records, filter],
  );

  const branchCounts = useMemo(() => {
    const out: Partial<Record<BranchName, number>> = {};
    for (const r of records) {
      const topic = (r.topic ?? "").toUpperCase();
      const branch = PRIMARY_BRANCHES.find((b) => topic.includes(b) || b.includes(topic));
      if (branch) out[branch] = (out[branch] ?? 0) + 1;
    }
    return out;
  }, [records]);

  return (
    <div className="space-y-14 pb-20 pt-6">
      <header className="max-w-3xl">
        <div className="flex items-center gap-3">
          <TerraMark className="size-6 text-mint" />
          <Label className="text-copper-ink">Terra Woman · The living archive</Label>
        </div>
        <h1 className="mt-5 font-display text-5xl leading-[0.98] sm:text-6xl">
          Roots<span className="text-copper">.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          The women who came before us — their knowledge, their words, their surviving
          objects. Part botanical field journal, part museum collection, held together by
          the Terra Woman tree.
        </p>
      </header>

      {/* The tree as archive architecture */}
      <section className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl">The Terra Woman Tree</h2>
          <Meta className="text-muted-foreground">
            {records.length} {records.length === 1 ? "leaf" : "leaves"} in the archive
          </Meta>
        </div>
        <TerraWomanTree counts={branchCounts} />
      </section>

      {/* Filters */}
      <nav className="flex flex-wrap gap-1.5" aria-label="Filter by content type">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition-colors ${
              filter === f.key
                ? "bg-foreground text-background ring-foreground"
                : "bg-paper text-muted-foreground ring-line hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {/* Feed — alternating treatments, occasional full-bleed breaks */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Opening the archive…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl bg-paper p-10 text-center ring-1 ring-line">
          <TerraMark className="mx-auto size-8 text-mint" />
          <p className="mt-4 font-display text-2xl">The archive is being planted.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Verified roots will appear here as they are published from the editorial dashboard.
          </p>
        </div>
      ) : (
        <div className="grid gap-10">
          {visible.map((r, i) => {
            const template = resolveTemplate(r);
            const fullBleed = template === "this_day" || template === "in_her_words" || i % 7 === 3;
            return (
              <Link
                key={r.id}
                to="/roots/$id"
                params={{ id: r.id }}
                className={`group block transition-transform duration-500 hover:-translate-y-1 ${
                  fullBleed ? "" : "md:max-w-3xl md:odd:ml-auto md:even:mr-auto"
                }`}
              >
                <RootsCard record={r} className="ring-1 ring-line/60 shadow-sm transition-shadow group-hover:shadow-md" />
                <div className="mt-3 flex items-center justify-between px-1">
                  <Meta className="text-muted-foreground">
                    {r.geography ?? r.historical_period ?? "Long history"}
                  </Meta>
                  <Meta className="text-copper-ink opacity-0 transition-opacity group-hover:opacity-100">
                    Open this root →
                  </Meta>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
