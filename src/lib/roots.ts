import { supabase } from "@/integrations/supabase/client";

export const ROOTS_COLUMNS = [
  "id",
  "title",
  "short_title",
  "content_type",
  "historical_period",
  "approximate_year",
  "exact_date",
  "month",
  "day",
  "woman_name",
  "woman_lifespan",
  "geography",
  "culture",
  "topic",
  "short_body",
  "body",
  "quote",
  "quote_attribution",
  "modern_context",
  "why_it_matters",
  "source_name",
  "source_url",
  "secondary_source_url",
  "historical_accuracy_status",
  "medical_context_required",
  "featured",
  "published",
  "editorial_notes",
] as const;

export type RootsColumn = (typeof ROOTS_COLUMNS)[number];

const NUMBER_COLUMNS: RootsColumn[] = ["approximate_year", "month", "day"];
const BOOLEAN_COLUMNS: RootsColumn[] = ["medical_context_required", "featured", "published"];

export const STATUSES = ["DRAFT", "NEEDS VERIFICATION", "VERIFIED", "PUBLISHED"] as const;

export type RootsRecord = {
  id: string;
  title: string;
  short_title: string | null;
  content_type: string | null;
  historical_period: string | null;
  approximate_year: number | null;
  exact_date: string | null;
  month: number | null;
  day: number | null;
  woman_name: string | null;
  woman_lifespan: string | null;
  geography: string | null;
  culture: string | null;
  topic: string | null;
  short_body: string | null;
  body: string | null;
  quote: string | null;
  quote_attribution: string | null;
  modern_context: string | null;
  why_it_matters: string | null;
  source_name: string | null;
  source_url: string | null;
  secondary_source_url: string | null;
  historical_accuracy_status: string;
  medical_context_required: boolean;
  featured: boolean;
  published: boolean;
  editorial_notes: string | null;
  updated_at?: string;
};

export async function fetchRoots(): Promise<RootsRecord[]> {
  const { data, error } = await supabase
    .from("roots_content")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RootsRecord[];
}

export async function fetchIsEditor(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).some((r) => r.role === "admin" || r.role === "editor");
}

/* ---------------- editorial warnings ---------------- */

export type Warning = { id: string; title: string; kind: string; detail: string };

const REQUIRED_WHEN_VERIFIED: RootsColumn[] = [
  "title",
  "content_type",
  "historical_period",
  "topic",
  "short_body",
  "body",
  "source_name",
  "source_url",
];

function empty(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function recordWarnings(r: RootsRecord): Warning[] {
  const out: Warning[] = [];
  const base = { id: r.id, title: r.title };
  const hasSource = !empty(r.source_url) || !empty(r.source_name);

  if (!hasSource) {
    out.push({ ...base, kind: "No source", detail: "Record has no source name or source URL." });
  }
  if (!empty(r.quote) && empty(r.source_url)) {
    out.push({ ...base, kind: "Quote without source", detail: "A quote is present but no traceable source URL is recorded." });
  }
  if (r.content_type === "this_day" && (empty(r.exact_date) || empty(r.month) || empty(r.day))) {
    out.push({ ...base, kind: "This Day without exact date", detail: "This Day content requires a sourced exact date (exact_date, month, day)." });
  }
  if (r.medical_context_required && empty(r.modern_context)) {
    out.push({ ...base, kind: "Missing medical context", detail: "Record is flagged as medical context required but modern_context is empty." });
  }
  if (r.historical_accuracy_status === "VERIFIED") {
    const missing = REQUIRED_WHEN_VERIFIED.filter((c) => empty(r[c as keyof RootsRecord]));
    if (missing.length) {
      out.push({ ...base, kind: "VERIFIED with missing fields", detail: `Missing: ${missing.join(", ")}` });
    }
  }
  if (r.published && r.historical_accuracy_status !== "VERIFIED") {
    out.push({ ...base, kind: "Published but not VERIFIED", detail: "Only VERIFIED records may appear publicly." });
  }
  return out;
}

export function countBy(records: RootsRecord[], key: keyof RootsRecord) {
  const map = new Map<string, number>();
  for (const r of records) {
    const value = empty(r[key]) ? "— unspecified —" : String(r[key]);
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/* ---------------- CSV import ---------------- */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

export type ImportRow = {
  record: RootsRecord;
  status: "new" | "updated" | "unchanged";
  changedFields: string[];
  warnings: Warning[];
};

export type ImportError = { line: number; id: string; message: string };

export type ImportPreview = {
  rows: ImportRow[];
  errors: ImportError[];
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
};

function toBool(raw: string): boolean | null {
  const v = raw.trim().toLowerCase();
  if (v === "") return false;
  if (["true", "yes", "y", "1"].includes(v)) return true;
  if (["false", "no", "n", "0"].includes(v)) return false;
  return null;
}

export function buildPreview(csv: string, existing: RootsRecord[]): ImportPreview {
  const table = parseCsv(csv);
  const errors: ImportError[] = [];
  const rows: ImportRow[] = [];
  if (!table.length) {
    return { rows, errors: [{ line: 0, id: "", message: "The file is empty." }], newCount: 0, updatedCount: 0, unchangedCount: 0 };
  }

  const header = (table[0] ?? []).map((h) => h.trim());
  const missingCols = ["id", "title"].filter((c) => !header.includes(c));
  if (missingCols.length) {
    return {
      rows,
      errors: [{ line: 1, id: "", message: `Missing required column(s): ${missingCols.join(", ")}` }],
      newCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
    };
  }

  const byId = new Map(existing.map((r) => [r.id, r]));
  const seen = new Set<string>();

  for (let i = 1; i < table.length; i++) {
    const cells = table[i] ?? [];
    const line = i + 1;
    const get = (col: string) => {
      const idx = header.indexOf(col);
      return idx === -1 ? "" : (cells[idx] ?? "").trim();
    };
    const id = get("id");
    if (!id) {
      errors.push({ line, id: "", message: "Row has no id." });
      continue;
    }
    if (seen.has(id)) {
      errors.push({ line, id, message: "Duplicate id inside the file." });
      continue;
    }
    seen.add(id);

    const title = get("title");
    if (!title) {
      errors.push({ line, id, message: "Row has no title." });
      continue;
    }

    const record: Record<string, unknown> = { id, title };
    let rowError = false;

    for (const col of ROOTS_COLUMNS) {
      if (col === "id" || col === "title") continue;
      if (!header.includes(col)) continue;
      const raw = get(col);

      if (NUMBER_COLUMNS.includes(col)) {
        if (raw === "") {
          record[col] = null;
        } else if (!/^-?\d+$/.test(raw)) {
          errors.push({ line, id, message: `${col} must be a whole number (got "${raw}").` });
          rowError = true;
        } else record[col] = Number(raw);
        continue;
      }
      if (BOOLEAN_COLUMNS.includes(col)) {
        const b = toBool(raw);
        if (b === null) {
          errors.push({ line, id, message: `${col} must be true or false (got "${raw}").` });
          rowError = true;
        } else record[col] = b;
        continue;
      }
      if (col === "exact_date") {
        if (raw === "") record[col] = null;
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          errors.push({ line, id, message: `exact_date must be YYYY-MM-DD (got "${raw}").` });
          rowError = true;
        } else record[col] = raw;
        continue;
      }
      if (col === "historical_accuracy_status") {
        const v = raw.toUpperCase();
        if (v === "") record[col] = "DRAFT";
        else if (!(STATUSES as readonly string[]).includes(v)) {
          errors.push({ line, id, message: `historical_accuracy_status must be one of ${STATUSES.join(" / ")} (got "${raw}").` });
          rowError = true;
        } else record[col] = v;
        continue;
      }
      record[col] = raw === "" ? null : raw;
    }

    if (rowError) continue;

    const full = {
      historical_accuracy_status: "DRAFT",
      medical_context_required: false,
      featured: false,
      published: false,
      ...record,
    } as RootsRecord;

    const prev = byId.get(id);
    let status: ImportRow["status"] = "new";
    const changedFields: string[] = [];
    if (prev) {
      for (const col of ROOTS_COLUMNS) {
        if (!header.includes(col) && col !== "id" && col !== "title") continue;
        const a = prev[col as keyof RootsRecord] ?? null;
        const b = full[col as keyof RootsRecord] ?? null;
        if (String(a) !== String(b)) changedFields.push(col);
      }
      status = changedFields.length ? "updated" : "unchanged";
    }

    rows.push({ record: full, status, changedFields, warnings: recordWarnings(full) });
  }

  return {
    rows,
    errors,
    newCount: rows.filter((r) => r.status === "new").length,
    updatedCount: rows.filter((r) => r.status === "updated").length,
    unchangedCount: rows.filter((r) => r.status === "unchanged").length,
  };
}

export async function commitImport(rows: ImportRow[]) {
  const payload = rows
    .filter((r) => r.status !== "unchanged")
    .map((r) => ({ ...r.record, updated_at: new Date().toISOString() }));
  if (!payload.length) return 0;
  const { error } = await supabase.from("roots_content").upsert(payload, { onConflict: "id" });
  if (error) throw error;
  return payload.length;
}
