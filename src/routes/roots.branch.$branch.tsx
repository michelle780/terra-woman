import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchPublishedRoots } from "@/lib/roots-public";
import { RootTile, Eyebrow, QuoteRoot, WomanRoot } from "@/components/roots/editorial";
import { TerraMark } from "@/components/roots/primitives";
import {
  BRANCHES,
  BRANCH_BLURB,
  branchOf,
  hasQuote,
  rotate,
  todaySeed,
  type Branch,
} from "@/lib/roots-editorial";

export const Route = createFileRoute("/roots/branch/$branch")({
  head: () => ({
    meta: [
      { title: "A branch of the Terra Woman tree · ROOTS" },
      {
        name: "description",
        content:
          "Follow one branch of the Terra Woman tree — the women, knowledge and moments gathered under it.",
      },
      { property: "og:title", content: "A branch of the Terra Woman tree · ROOTS" },
      {
        property: "og:description",
        content: "The women, wisdom and moments gathered under one branch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <BranchCollection />
    </AppShell>
  ),
});

function BranchCollection() {
  const { branch } = Route.useParams();
  const key = branch.toUpperCase() as Branch;
  const valid = (BRANCHES as readonly string[]).includes(key);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["roots", "published"],
    queryFn: fetchPublishedRoots,
  });

  const items = useMemo(
    () => rotate(records.filter((r) => branchOf(r) === key), todaySeed()),
    [records, key],
  );

  const lead = items.find((r) => hasQuote(r)) ?? null;
  const woman = items.find((r) => r.woman_name && r.id !== lead?.id) ?? null;
  const rest = items.filter((r) => r.id !== lead?.id && r.id !== woman?.id);

  return (
    <div className="space-y-14 pb-24 pt-6">
      <Link
        to="/roots"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> ROOTS
      </Link>

      <header className="mx-auto max-w-2xl text-center">
        <TerraMark className="mx-auto size-6 text-mint" />
        <Eyebrow className="mt-6 text-copper-ink">A branch of the tree</Eyebrow>
        <h1 className="mt-4 font-display text-[3rem] leading-[0.95] sm:text-[4rem]">
          {valid ? key.charAt(0) + key.slice(1).toLowerCase() : "Unknown"}
        </h1>
        {valid && (
          <p className="mx-auto mt-5 max-w-[32ch] text-base leading-relaxed text-muted-foreground">
            {BRANCH_BLURB[key]}
          </p>
        )}
      </header>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Opening the archive…</p>
      ) : !items.length ? (
        <p className="mx-auto max-w-md text-center font-display text-2xl text-muted-foreground">
          This branch is still growing.
        </p>
      ) : (
        <div className="space-y-12">
          {lead && <QuoteRoot record={lead} tone="forest" />}
          {woman && <WomanRoot record={woman} />}
          <div>
            {rest.map((r) => (
              <RootTile key={r.id} record={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
