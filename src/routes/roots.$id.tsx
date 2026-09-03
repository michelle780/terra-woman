import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, Bookmark, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { fetchPublishedRoot, fetchRelatedRoots } from "@/lib/roots-public";
import { RootsCard, typeLabel } from "@/components/roots/templates";
import { Label, Meta, Rule, TerraMark } from "@/components/roots/primitives";
import { placeAndEra } from "@/lib/roots-visual";

export const Route = createFileRoute("/roots/$id")({
  head: () => ({
    meta: [
      { title: "ROOTS — Terra Woman" },
      {
        name: "description",
        content: "A story from Terra Woman's living archive of women's inherited knowledge.",
      },
      { property: "og:title", content: "ROOTS — Terra Woman" },
      {
        property: "og:description",
        content: "Part botanical field journal, part museum collection, part contemporary women's publication.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <RootStory />
    </AppShell>
  ),
});

function RootStory() {
  const { id } = Route.useParams();
  const [saved, setSaved] = useState(false);

  const { data: record, isLoading } = useQuery({
    queryKey: ["roots", "published", id],
    queryFn: () => fetchPublishedRoot(id),
  });

  const { data: related = [] } = useQuery({
    queryKey: ["roots", "related", id],
    enabled: !!record,
    queryFn: () => fetchRelatedRoots(record!),
  });

  if (isLoading) {
    return <p className="pt-6 text-sm text-muted-foreground">Opening the archive…</p>;
  }

  if (!record) {
    return (
      <div className="rounded-2xl bg-paper p-10 text-center ring-1 ring-line">
        <TerraMark className="mx-auto size-8 text-mint" />
        <p className="mt-4 font-display text-2xl">This root isn't in the public archive.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Only verified, published stories appear in ROOTS.
        </p>
        <Link to="/roots" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-copper-ink hover:underline">
          <ArrowLeft className="size-4" /> Back to the archive
        </Link>
      </div>
    );
  }

  async function share() {
    const url = window.location.href;
    const shareData = {
      title: `${record!.title} — ROOTS · Terra Woman`,
      text: record!.short_body ?? record!.title,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — share this root.");
    } catch {
      // dismissed
    }
  }

  return (
    <article className="space-y-12 pb-20 pt-6">
      <Link
        to="/roots"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> THE ARCHIVE
      </Link>

      {/* Visual hero — continues the card treatment */}
      <RootsCard record={record} className="ring-1 ring-line/60 shadow-sm" />

      {/* Title block */}
      <header className="mx-auto max-w-2xl text-center">
        <Label className="text-copper-ink">{typeLabel(record)}</Label>
        <h1 className="mt-4 font-display text-4xl leading-[1.04] sm:text-5xl">{record.title}</h1>
        <Meta className="mt-4 block text-muted-foreground">{placeAndEra(record)}</Meta>
      </header>

      {/* Story */}
      <div className="mx-auto max-w-2xl space-y-8">
        {record.body && (
          <p className="whitespace-pre-line text-base leading-[1.85] text-foreground/90">
            {record.body}
          </p>
        )}

        {record.quote && (
          <blockquote className="border-l-2 border-copper pl-6">
            <p className="font-display text-2xl leading-snug">“{record.quote}”</p>
            {record.quote_attribution && (
              <cite className="mt-3 block not-italic">
                <Meta className="text-muted-foreground">{record.quote_attribution}</Meta>
              </cite>
            )}
          </blockquote>
        )}

        {record.why_it_matters && (
          <section className="rounded-2xl bg-paper p-6 ring-1 ring-line">
            <Label className="text-copper-ink">Why it matters</Label>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{record.why_it_matters}</p>
          </section>
        )}

        {record.medical_context_required && record.modern_context && (
          <section className="rounded-2xl bg-paper p-6 ring-1 ring-line">
            <Label className="text-copper-ink">Then / Now</Label>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{record.modern_context}</p>
            <p className="mt-3 text-[11px] text-muted-foreground/80">
              Historical context only — Terra Woman is not medical advice.
            </p>
          </section>
        )}

        {/* Sources */}
        {(record.source_name || record.source_url) && (
          <footer className="space-y-2">
            <Rule />
            <div className="pt-3">
              <Meta className="block text-muted-foreground">Sources</Meta>
              <ul className="mt-2 space-y-1 text-sm">
                {record.source_url ? (
                  <li>
                    <a
                      href={record.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-copper-ink hover:underline"
                    >
                      {record.source_name ?? record.source_url}
                    </a>
                  </li>
                ) : (
                  record.source_name && <li className="font-medium">{record.source_name}</li>
                )}
                {record.secondary_source_url && (
                  <li>
                    <a
                      href={record.secondary_source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:underline"
                    >
                      {record.secondary_source_url}
                    </a>
                  </li>
                )}
              </ul>
              {(record.visual_asset_source || record.visual_asset_credit) && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Image: {[record.visual_asset_credit, record.visual_asset_source]
                    .filter(Boolean)
                    .join(" · ")}
                  {record.visual_asset_rights_status &&
                    ` · ${record.visual_asset_rights_status}`}
                </p>
              )}
            </div>
          </footer>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-bold text-background transition-opacity hover:opacity-90"
          >
            <Share2 className="size-3.5" /> Share this root
          </button>
          <button
            onClick={() => {
              setSaved((s) => !s);
              toast.success(saved ? "Removed from My Roots" : "Saved to My Roots");
            }}
            className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2 text-xs font-bold ring-1 ring-line transition-colors hover:bg-mint/20"
          >
            {saved ? <Check className="size-3.5" /> : <Bookmark className="size-3.5" />}
            {saved ? "Saved to My Roots" : "Save to My Roots"}
          </button>
        </div>
      </div>

      {/* Keep exploring */}
      {related.length > 0 && (
        <section className="pt-6">
          <div className="mb-6 flex items-center gap-3">
            <TerraMark className="size-5 text-mint" />
            <Label className="text-copper-ink">Keep exploring the tree</Label>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} to="/roots/$id" params={{ id: r.id }} className="group block">
                <RootsCard record={r} className="ring-1 ring-line/60 shadow-sm transition-shadow group-hover:shadow-md" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
