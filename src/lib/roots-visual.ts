import type { RootsRecord } from "@/lib/roots";

export type VisualTemplate =
  | "herbarium"
  | "woman"
  | "artifact"
  | "this_day"
  | "in_her_words"
  | "living_tree";

export const VISUAL_TEMPLATES: {
  key: VisualTemplate;
  label: string;
  blurb: string;
}[] = [
  { key: "herbarium", label: "The Herbarium", blurb: "A page from a healer's field journal, read as luxury editorial." },
  { key: "woman", label: "The Woman", blurb: "Archival portraiture, dramatically cropped and contemporary." },
  { key: "artifact", label: "The Artifact", blurb: "The surviving object is the hero, with museum metadata." },
  { key: "this_day", label: "This Day", blurb: "Forest ground, cream type, one dated moment." },
  { key: "in_her_words", label: "In Her Words", blurb: "Enormous quotation. Made to be shared." },
  { key: "living_tree", label: "The Living Tree", blurb: "A branch draws in and a leaf appears — the signature treatment." },
];

/** Which treatments each content type may use, in preference order. */
export const TEMPLATES_BY_TYPE: Record<string, VisualTemplate[]> = {
  wise_woman: ["woman", "living_tree"],
  healer: ["woman", "herbarium"],
  from_the_beginning: ["artifact", "living_tree"],
  in_her_words: ["in_her_words"],
  this_day: ["this_day"],
  what_women_knew: ["herbarium", "artifact"],
};

export const TOPIC_HINTS: Record<string, VisualTemplate> = {
  herbalism: "herbarium",
  community: "herbarium",
  birth: "herbarium",
  body: "herbarium",
  medicine: "artifact",
  menstruation: "artifact",
  science: "artifact",
};

function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function hasUsableAsset(r: RootsRecord) {
  const rights = (r.visual_asset_rights_status ?? "UNKNOWN").toUpperCase();
  return (
    !!r.visual_asset_url &&
    !!r.visual_asset_source &&
    (rights === "CLEARED" || rights === "PUBLIC DOMAIN")
  );
}

export function canUseThisDay(r: RootsRecord) {
  return !!r.exact_date || (r.month != null && r.day != null);
}

export function canUseInHerWords(r: RootsRecord) {
  return (
    !!r.quote &&
    !!r.quote_attribution &&
    (!!r.source_url || !!r.source_name) &&
    r.historical_accuracy_status === "VERIFIED"
  );
}

/** Which treatments are actually available for this record right now. */
export function allowedTemplates(r: RootsRecord): VisualTemplate[] {
  const all: VisualTemplate[] = [
    "herbarium",
    "woman",
    "artifact",
    "this_day",
    "in_her_words",
    "living_tree",
  ];
  return all.filter((t) => {
    if (t === "this_day") return canUseThisDay(r);
    if (t === "in_her_words") return canUseInHerWords(r);
    if (t === "woman" || t === "artifact") return true; // degrade gracefully without imagery
    return true;
  });
}

/** Automatic recommendation. Deterministic per record so the feed stays stable. */
export function recommendTemplate(r: RootsRecord): VisualTemplate {
  const byType = TEMPLATES_BY_TYPE[r.content_type ?? ""] ?? [];
  const options = byType.filter((t) => {
    if (t === "this_day") return canUseThisDay(r);
    if (t === "in_her_words") return canUseInHerWords(r);
    return true;
  });

  if (r.content_type === "this_day" && !canUseThisDay(r)) return "artifact";
  if (r.content_type === "in_her_words" && !canUseInHerWords(r)) return "herbarium";

  if (!options.length) {
    const hint = TOPIC_HINTS[r.topic ?? ""];
    return hint ?? "living_tree";
  }
  if (options.length === 1) return options[0]!;

  // Featured stories lean into the signature treatment when it is an option.
  if (r.featured && options.includes("living_tree")) return "living_tree";
  // Portrait-led treatments only when there is a rights-cleared image.
  if (options[0] === "woman" && !hasUsableAsset(r)) return options[1] ?? "living_tree";
  if (options[0] === "artifact" && !hasUsableAsset(r)) {
    const hint = TOPIC_HINTS[r.topic ?? ""];
    if (hint && options.includes(hint)) return hint;
  }
  return options[hash(r.id) % options.length]!;
}

export function resolveTemplate(r: RootsRecord): VisualTemplate {
  const chosen = r.visual_template as VisualTemplate | null | undefined;
  if (chosen && VISUAL_TEMPLATES.some((t) => t.key === chosen)) return chosen;
  return recommendTemplate(r);
}

/* ---------------- display helpers ---------------- */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function eventYear(r: RootsRecord): number | null {
  if (r.exact_date) {
    const y = Number(r.exact_date.slice(0, 4));
    if (!Number.isNaN(y)) return y;
  }
  return r.approximate_year ?? null;
}

export function yearsAgo(r: RootsRecord, now = new Date()): number | null {
  const y = eventYear(r);
  if (y == null) return null;
  const diff = now.getFullYear() - y;
  return diff > 0 ? diff : null;
}

export function dayLabel(r: RootsRecord): string | null {
  let month = r.month;
  let day = r.day;
  if (r.exact_date) {
    month = Number(r.exact_date.slice(5, 7));
    day = Number(r.exact_date.slice(8, 10));
  }
  if (!month || !day) return null;
  return `${MONTHS[month - 1] ?? ""} ${day}`.trim().toUpperCase();
}

/** Catalog number in the archive, e.g. ROOTS / 043 */
export function catalogNumber(r: RootsRecord): string {
  const digits = r.id.replace(/\D/g, "").slice(-3);
  return `ROOTS / ${digits.padStart(3, "0")}`;
}

export function placeAndEra(r: RootsRecord): string {
  return [r.historical_period, r.geography].filter(Boolean).join(" · ");
}
