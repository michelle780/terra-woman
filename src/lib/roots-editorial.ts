/**
 * Consumer-facing ROOTS editorial helpers.
 *
 * The database is the content source — never the interface. Nothing in here
 * exposes record ids, verification status, template names or raw metadata.
 */
import type { RootsRecord } from "@/lib/roots";

export const BRANCHES = [
  "BODY",
  "CYCLE",
  "BIRTH",
  "SEXUALITY",
  "MIND",
  "HEALING",
  "AGING",
  "SCIENCE",
  "COMMUNITY",
] as const;

export type Branch = (typeof BRANCHES)[number];

export const BRANCH_BLURB: Record<Branch, string> = {
  BODY: "What women have always known about their own bodies.",
  CYCLE: "Blood, rhythm and the long history of being told to hide it.",
  BIRTH: "Midwives, mothers and the oldest knowledge we have.",
  SEXUALITY: "Desire, autonomy and the women who spoke about both.",
  MIND: "Minds that were studied, silenced, and finally heard.",
  HEALING: "Healers, herbalists and physicians across every continent.",
  AGING: "Longer lives, later chapters, unfinished stories.",
  SCIENCE: "Discoveries made by women, often credited to someone else.",
  COMMUNITY: "Knowledge carried between women, generation to generation.",
};

const TOPIC_BRANCH: Record<string, Branch> = {
  medicine: "HEALING",
  healing: "HEALING",
  herbalism: "HEALING",
  science: "SCIENCE",
  education: "SCIENCE",
  leadership: "COMMUNITY",
  community: "COMMUNITY",
  motherhood: "COMMUNITY",
  body: "BODY",
  menstruation: "CYCLE",
  fertility: "BIRTH",
  birth: "BIRTH",
  mental_health: "MIND",
  aging: "AGING",
  general: "COMMUNITY",
};

export function branchOf(r: RootsRecord): Branch | null {
  const raw = (r.tree_branch ?? "").toUpperCase().trim() as Branch;
  if ((BRANCHES as readonly string[]).includes(raw)) return raw;
  return TOPIC_BRANCH[(r.topic ?? "").toLowerCase()] ?? null;
}

export function isSilenced(r: RootsRecord) {
  return (r.legacy_lens ?? "").toLowerCase() === "silenced_condemned";
}

export function hasQuote(r: RootsRecord) {
  return !!r.quote && !!(r.quote_attribution || r.woman_name);
}

export function hasExactDay(r: RootsRecord) {
  return !!r.exact_date || (r.month != null && r.day != null);
}

/** Consumer series name. Never a template or database label. */
export function seriesLabel(r: RootsRecord): string {
  if (hasQuote(r) && r.content_type === "in_her_words") return "In Her Words";
  switch (r.content_type) {
    case "wise_woman":
    case "healer":
      return isSilenced(r) ? "They Called Her Dangerous" : "Meet a Woman";
    case "from_the_beginning":
      return "From the Beginning";
    case "what_women_knew":
      return "What Women Knew";
    case "this_day":
      return "This Day";
    case "in_her_words":
      return "In Her Words";
    default:
      return "Roots";
  }
}

/* ---------------- time ---------------- */

export function yearOf(r: RootsRecord): number | null {
  if (r.exact_date) {
    const y = Number(r.exact_date.slice(0, 4));
    if (!Number.isNaN(y)) return y;
  }
  return r.approximate_year ?? null;
}

export function formatYear(year: number | null | undefined): string | null {
  if (year == null) return null;
  if (year < 0) return `c. ${Math.abs(year).toLocaleString()} BCE`;
  return String(year);
}

export function yearsAgo(r: RootsRecord, now = new Date()): number | null {
  const y = yearOf(r);
  if (y == null) return null;
  const diff = now.getFullYear() - y;
  return diff > 0 ? diff : null;
}

/** "3,800 years ago", rounded gently for deep history. */
export function yearsAgoLabel(r: RootsRecord): string | null {
  const n = yearsAgo(r);
  if (n == null) return null;
  const rounded =
    n >= 1000 ? Math.round(n / 100) * 100 : n >= 300 ? Math.round(n / 10) * 10 : n;
  return `${rounded.toLocaleString()} years ago`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function dayLabel(r: RootsRecord): string | null {
  let month = r.month;
  let day = r.day;
  if (r.exact_date) {
    month = Number(r.exact_date.slice(5, 7));
    day = Number(r.exact_date.slice(8, 10));
  }
  if (!month || !day) return null;
  return `${MONTHS[month - 1] ?? ""} ${day}`.trim();
}

/* ---------------- place ---------------- */

const REGION_SKIP = new Set(["global / multiple"]);

/** "ALEXANDRIA · EGYPT" — geography first, region only when it adds meaning. */
export function placeLine(r: RootsRecord): string | null {
  const parts: string[] = [];
  if (r.geography) parts.push(r.geography);
  const region = r.region_group ?? "";
  if (
    region &&
    !REGION_SKIP.has(region.toLowerCase()) &&
    !parts.some((p) => p.toLowerCase() === region.toLowerCase())
  ) {
    parts.push(region);
  }
  if (!parts.length && r.culture) parts.push(r.culture);
  return parts.length ? parts.join(" · ") : null;
}

/** A short line beneath a name: lifespan, era or year. */
export function eraLine(r: RootsRecord): string | null {
  if (r.woman_lifespan) return r.woman_lifespan;
  const y = formatYear(yearOf(r));
  if (y) return y;
  return r.historical_period ?? null;
}

/** "Physician · Reformer" style role line, built from what we know. */
export function roleLine(r: RootsRecord): string | null {
  const topic = r.topic ? r.topic.replaceAll("_", " ") : null;
  const bits = [topic, r.culture].filter(Boolean) as string[];
  return bits.length ? bits.join(" · ") : null;
}

/* ---------------- sources ---------------- */

const HOST_NAMES: Record<string, string> = {
  "pubmed.ncbi.nlm.nih.gov": "National Library of Medicine",
  "www.ncbi.nlm.nih.gov": "National Library of Medicine",
  "ncbi.nlm.nih.gov": "National Library of Medicine",
  "www.si.edu": "Smithsonian Institution",
  "si.edu": "Smithsonian Institution",
  "wellcomecollection.org": "Wellcome Collection",
  "www.britannica.com": "Encyclopaedia Britannica",
  "britannica.com": "Encyclopaedia Britannica",
  "www.worldhistory.org": "World History Encyclopedia",
  "www.loc.gov": "Library of Congress",
  "www.nobelprize.org": "The Nobel Prize",
  "en.wikipedia.org": "Wikipedia",
  "www.bl.uk": "The British Library",
  "www.who.int": "World Health Organization",
  "www.nature.com": "Nature",
};

function humanHost(url: string): string {
  try {
    const host = new URL(url).hostname;
    if (HOST_NAMES[host]) return HOST_NAMES[host]!;
    const bare = host.replace(/^www\./, "");
    const parts = bare.split(".");
    const main = parts.length > 2 ? parts.slice(-3, -1).join(" ") : parts[0]!;
    return main
      .replace(/[-_.]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Source";
  }
}

export type SourceLink = { name: string; url: string | null };

export function sourceLinks(r: RootsRecord): SourceLink[] {
  const out: SourceLink[] = [];
  const seen = new Set<string>();
  const push = (name: string, url: string | null) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name, url });
  };
  if (r.source_name) push(r.source_name, r.source_url ?? null);
  else if (r.source_url) push(humanHost(r.source_url), r.source_url);
  if (r.secondary_source_url) push(humanHost(r.secondary_source_url), r.secondary_source_url);
  return out;
}

/* ---------------- rotation ---------------- */

export function todaySeed(now = new Date()): number {
  return Number(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}`,
  );
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic per-day ordering so the archive rotates but never flickers. */
export function rotate<T extends { id: string }>(items: T[], seed: number): T[] {
  return [...items].sort((a, b) => hashString(a.id + seed) - hashString(b.id + seed));
}

export function pickOne<T extends { id: string }>(
  items: T[],
  seed: number,
  used: Set<string> = new Set(),
): T | null {
  const pool = rotate(items, seed).filter((i) => !used.has(i.id));
  const chosen = pool[0] ?? null;
  if (chosen) used.add(chosen.id);
  return chosen;
}

export function pickMany<T extends { id: string }>(
  items: T[],
  seed: number,
  count: number,
  used: Set<string> = new Set(),
): T[] {
  const pool = rotate(items, seed).filter((i) => !used.has(i.id));
  const chosen = pool.slice(0, count);
  chosen.forEach((c) => used.add(c.id));
  return chosen;
}

/** Related stories, scored by person, branch, topic, era, geography. */
export function relatedTo(r: RootsRecord, all: RootsRecord[], limit = 4): RootsRecord[] {
  const branch = branchOf(r);
  return all
    .filter((c) => c.id !== r.id)
    .map((c) => {
      let score = 0;
      if (r.woman_name && c.woman_name === r.woman_name) score += 6;
      if (branch && branchOf(c) === branch) score += 3;
      if (c.topic && c.topic === r.topic) score += 2;
      if (c.historical_period && c.historical_period === r.historical_period) score += 2;
      if (c.region_group && c.region_group === r.region_group) score += 1;
      if (c.culture && c.culture === r.culture) score += 1;
      if (isSilenced(r) && isSilenced(c)) score += 2;
      return { c, score: score + (hashString(c.id) % 2) * 0.1 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.c);
}

/** Internal editorial handling notes — never consumer-facing copy. */
const INTERNAL_NOTE =
  /\b(historical (educational |institutional |medical |herbal |practice|belief|description|profile|context)|not medical advice|never be surfaced|do not imply|no protective claim|short quot|editorial positioning|modern safety context|checking the scan|in product ui)\b/i;

/** Returns the text only if it is real story copy; null for internal notes. */
export function consumerContext(text: string | null | undefined): string | null {
  const t = text?.trim();
  if (!t) return null;
  return INTERNAL_NOTE.test(t) ? null : t;
}
