import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoots, type RootsRecord } from "@/lib/roots";
import { RootsCard } from "@/components/roots/templates";
import { TerraWomanTree, PRIMARY_BRANCHES, type BranchName } from "@/components/roots/TerraWomanTree";
import { recommendTemplate, VISUAL_TEMPLATES, type VisualTemplate } from "@/lib/roots-visual";


/* A fully-populated fallback story so the lab renders even before content loads. */
const SAMPLE: RootsRecord = {
  id: "sample-043",
  title: "Knowledge didn't always live in books",
  short_title: "Knowledge didn't always live in books.",
  content_type: "what_women_knew",
  historical_period: "Middle Ages",
  approximate_year: 1150,
  exact_date: null,
  month: null,
  day: null,
  woman_name: "Hildegard von Bingen",
  woman_lifespan: "1098—1179",
  geography: "Rhineland",
  culture: "Benedictine",
  topic: "herbalism",
  short_body:
    "For generations, women learned care, birth and healing from one another — in kitchens, birthing rooms and gardens, long before any of it was written down.",
  body: null,
  quote: "I am the breeze that nurtures all things green.",
  quote_attribution: "Hildegard von Bingen",
  modern_context: null,
  why_it_matters:
    "The oral inheritance of women's medicine is the trunk everything after it grew from.",
  source_name: "Causae et Curae",
  source_url: "https://example.org",
  secondary_source_url: null,
  historical_accuracy_status: "VERIFIED",
  medical_context_required: false,
  featured: true,
  published: false,
  editorial_notes: null,
  visual_template: null,
  visual_asset_url: null,
  visual_asset_type: "manuscript",
  visual_asset_source: null,
  visual_asset_credit: null,
  visual_asset_rights_status: "UNKNOWN",
};

const SHOWCASE_TYPES = [
  "wise_woman",
  "healer",
  "from_the_beginning",
  "in_her_words",
  "this_day",
  "what_women_knew",
] as const;

function SectionHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <header className="mb-6 max-w-2xl">
      <span className="roots-label text-copper-ink">{eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{title}</h2>
      {note && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{note}</p>}
    </header>
  );
}


export function VisualLab() {
  const { data: records = [] } = useQuery({
    queryKey: ["roots-content"],
    queryFn: fetchRoots,
  });

  const sample = useMemo(() => {
    const withQuote = records.find(
      (r) => r.quote && r.quote_attribution && r.historical_accuracy_status === "VERIFIED",
    );
    return withQuote ?? records[0] ?? SAMPLE;
  }, [records]);

  const examples = useMemo(() => {
    return SHOWCASE_TYPES.map((type) => {
      const match =
        records.find((r) => r.content_type === type && r.historical_accuracy_status === "VERIFIED") ??
        records.find((r) => r.content_type === type);
      const record = match ?? { ...SAMPLE, id: `sample-${type}`, content_type: type };
      return { type, record, template: recommendTemplate(record) };
    });
  }, [records]);

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
    <div className="space-y-16 pb-20">
      <header className="max-w-3xl">
        <span className="roots-label text-copper-ink">Terra Woman · Editorial</span>
        <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">ROOTS Visual Lab</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Six reusable treatments for the living women's archive. Nothing here is published — this
          page exists so the visual language can be approved before it is applied across ROOTS.
          Archival imagery only appears where source, credit and rights status are recorded.
        </p>
      </header>

      {/* One story, six treatments */}
      <section>
        <SectionHeading
          eyebrow="One story · six treatments"
          title={sample.short_title || sample.title}
          note="The same ROOTS record rendered through every template, so variety across the feed can be judged directly."
        />
        <div className="grid gap-8 lg:grid-cols-2">
          {VISUAL_TEMPLATES.map((t) => (
            <figure key={t.key} className="grid gap-3">
              <RootsCard record={sample} template={t.key as VisualTemplate} />
              <figcaption className="flex items-baseline justify-between gap-4">
                <span className="roots-label text-foreground">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.blurb}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Recommended treatment per content type */}
      <section>
        <SectionHeading
          eyebrow="Assignment logic"
          title="Each content type, in its recommended treatment"
          note="Templates are recommended automatically from content type, topic and available rights-cleared imagery. Editors can override the recommendation."
        />
        <div className="grid gap-8 lg:grid-cols-2">
          {examples.map(({ type, record, template }) => (
            <figure key={type} className="grid gap-3">
              <RootsCard record={record} template={template} />
              <figcaption className="flex items-baseline justify-between gap-4">
                <span className="roots-label text-foreground">{type.replaceAll("_", " ")}</span>
                <span className="roots-meta text-copper-ink">{template.replaceAll("_", " ")}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Share format */}
      <section>
        <SectionHeading
          eyebrow="Sharing"
          title="Share this root — 1080 × 1350"
          note="Portrait share renders reuse the same templates, with attribution kept available but visually secondary."
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <RootsCard record={sample} template="in_her_words" format="share" />
          <RootsCard record={sample} template="this_day" format="share" />
          <RootsCard record={sample} template="living_tree" format="share" />
        </div>
      </section>

      {/* The Terra Woman Tree */}
      <section>
        <SectionHeading
          eyebrow="Architecture"
          title="The Terra Woman Tree"
          note="Roots are inherited knowledge, the trunk is what women accumulated, branches are areas of health and lived experience, and each leaf is one ROOTS story. Static prototype for now."
        />
        <TerraWomanTree counts={branchCounts} />
      </section>
    </div>
  );
}
