import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { fetchPublishedRoots } from "@/lib/roots-public";
import { branchOf, eraLine, pickOne, seriesLabel, todaySeed } from "@/lib/roots-editorial";
import { TerraMark } from "@/components/roots/primitives";

export function RootsTodayCard() {
  const rootsQ = useQuery({
    queryKey: ["roots", "published"],
    queryFn: fetchPublishedRoots,
    staleTime: 60 * 60 * 1000,
  });

  const root =
    rootsQ.data && rootsQ.data.length > 0
      ? pickOne(rootsQ.data, todaySeed())
      : null;

  if (!root) return null;

  const branch = branchOf(root);
  const era = eraLine(root);

  return (
    <section className="rise rounded-[24px] bg-paper/55 p-5 ring-1 ring-line backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <TerraMark className="size-3.5 text-mint" />
            Roots · {seriesLabel(root)}
          </p>
          <h2 className="mt-0.5 text-xl">From the living archive</h2>
        </div>
        <Link to="/roots" className="text-xs font-semibold text-muted-foreground underline">
          Explore
        </Link>
      </div>

      <Link
        to="/roots/$id"
        params={{ id: root.id }}
        className="mt-4 block rounded-2xl bg-background px-4 py-4 ring-1 ring-line transition-colors hover:bg-cream"
      >
        {root.quote ? (
          <blockquote className="font-display text-lg leading-snug text-pretty">
            “{root.quote}”
          </blockquote>
        ) : (
          <p className="font-display text-lg leading-snug text-pretty">
            {root.short_title ?? root.title}
          </p>
        )}
        <p className="mt-2 text-xs font-semibold text-muted-foreground">
          {[root.quote_attribution ?? root.woman_name, era, branch]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {root.short_body && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {root.short_body}
          </p>
        )}
        <span className="mt-3 inline-block text-xs font-bold text-copper-ink underline">
          Read her story
        </span>
      </Link>
    </section>
  );
}
