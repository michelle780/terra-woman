import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { VisualLab } from "@/components/roots/VisualLab";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { RootsCard } from "@/components/roots/templates";
import {
  allowedTemplates,
  hasUsableAsset,
  recommendTemplate,
  resolveTemplate,
  VISUAL_TEMPLATES,
  type VisualTemplate,
} from "@/lib/roots-visual";
import {
  buildPreview,
  commitImport,
  countBy,
  fetchIsAdmin,
  fetchIsEditor,
  fetchRoots,
  recordWarnings,
  ROOTS_COLUMNS,
  type ImportPreview,
  type RootsRecord,
  type Warning,
} from "@/lib/roots";

export const Route = createFileRoute("/admin/roots")({
  head: () => ({
    meta: [
      { title: "ROOTS editorial dashboard — Terra Woman" },
      {
        name: "description",
        content:
          "Editorial control room for Terra Woman ROOTS: verification status, coverage by era, geography and topic, review flags and CSV import.",
      },
      { property: "og:title", content: "ROOTS editorial dashboard — Terra Woman" },
      {
        property: "og:description",
        content: "Review, verify and import Terra Woman ROOTS historical content.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <RootsAdmin />
    </AppShell>
  ),
});

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`rounded-2xl bg-paper px-4 py-3 ring-1 ring-line ${tone ?? ""}`}>
      <div className="font-display text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Coverage({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em]">{title}</h3>
      <ul className="mt-3 space-y-1.5">
        {rows.map(([label, count]) => (
          <li key={label} className="text-xs">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-foreground">{label}</span>
              <span className="font-semibold text-muted-foreground">{count}</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-line">
              <div className="h-1 rounded-full bg-copper" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </li>
        ))}
        {!rows.length && <li className="text-xs text-muted-foreground">No records yet.</li>}
      </ul>
    </div>
  );
}

function WarningList({ warnings }: { warnings: Warning[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, Warning[]>();
    for (const w of warnings) map.set(w.kind, [...(map.get(w.kind) ?? []), w]);
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [warnings]);

  if (!warnings.length) {
    return <p className="text-xs text-muted-foreground">No editorial flags. Nothing needs review.</p>;
  }

  return (
    <div className="space-y-4">
      {grouped.map(([kind, items]) => (
        <div key={kind}>
          <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-copper-ink">
            {kind} · {items.length}
          </h4>
          <ul className="mt-1.5 space-y-1">
            {items.map((w, i) => (
              <li key={`${w.id}-${i}`} className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{w.id}</span> — {w.title}
                <span className="block">{w.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ImportPanel({ existing, onDone }: { existing: RootsRecord[]; onDone: () => void }) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setResult(null);
    setFileName(file.name);
    const text = await file.text();
    setPreview(buildPreview(text, existing));
  }

  async function confirm() {
    if (!preview) return;
    setBusy(true);
    try {
      const count = await commitImport(preview.rows);
      setResult(`Import complete — ${count} record${count === 1 ? "" : "s"} written. No records were deleted.`);
      setPreview(null);
      setFileName("");
      if (inputRef.current) inputRef.current.value = "";
      onDone();
    } catch (e) {
      setResult(`Import failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const importWarnings = preview ? preview.rows.flatMap((r) => r.warnings) : [];

  return (
    <section className="mt-6 rounded-2xl bg-paper p-5 ring-1 ring-line">
      <h2 className="font-display text-lg font-semibold uppercase tracking-[0.16em]">Import ROOTS content</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        CSV only, using the ROOTS schema. Records are matched on <code>id</code>: existing ids are updated,
        new ids are created, nothing is ever deleted. Missing information is flagged for editorial review,
        never generated.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
        className="mt-3 block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground"
      />

      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground">
          Expected columns
        </summary>
        <p className="mt-1 break-words text-[11px] text-muted-foreground">{ROOTS_COLUMNS.join(", ")}</p>
      </details>

      {result && <p className="mt-3 rounded-xl bg-mint/20 px-3 py-2 text-xs font-semibold">{result}</p>}

      {preview && (
        <div className="mt-4 rounded-2xl bg-background p-4 ring-1 ring-line">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em]">
            Preview · {fileName}
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="New" value={preview.newCount} />
            <Stat label="Updated" value={preview.updatedCount} />
            <Stat label="Unchanged" value={preview.unchangedCount} />
            <Stat label="Errors" value={preview.errors.length} />
          </div>

          {preview.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-copper-ink">Errors</h4>
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                {preview.errors.map((e, i) => (
                  <li key={i}>
                    Line {e.line}
                    {e.id ? ` (${e.id})` : ""}: {e.message}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Rows with errors are skipped; every other row can still be imported.
              </p>
            </div>
          )}

          {preview.rows.length > 0 && (
            <div className="mt-4 max-h-72 overflow-auto rounded-xl ring-1 ring-line">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-paper">
                  <tr>
                    <th className="px-2 py-1.5">ID</th>
                    <th className="px-2 py-1.5">Title</th>
                    <th className="px-2 py-1.5">Status</th>
                    <th className="px-2 py-1.5">Accuracy</th>
                    <th className="px-2 py-1.5">Changed fields</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.record.id} className="border-t border-line">
                      <td className="px-2 py-1.5 font-semibold">{r.record.id}</td>
                      <td className="px-2 py-1.5">{r.record.title}</td>
                      <td className="px-2 py-1.5 uppercase">{r.status}</td>
                      <td className="px-2 py-1.5">{r.record.historical_accuracy_status}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">
                        {r.changedFields.join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {importWarnings.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-copper-ink">
                Editorial flags in this file · {importWarnings.length}
              </h4>
              <p className="mt-1 text-[11px] text-muted-foreground">
                These do not block the import. They are queued for editorial review.
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => void confirm()}
              disabled={busy || preview.newCount + preview.updatedCount === 0}
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {busy
                ? "Importing…"
                : `Confirm import · ${preview.newCount} new, ${preview.updatedCount} updated`}
            </button>
            <button
              onClick={() => {
                setPreview(null);
                setFileName("");
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-full bg-paper px-4 py-2 text-xs font-semibold ring-1 ring-line"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function RootsAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isEditor, isLoading: roleLoading } = useQuery({
    queryKey: ["is-editor", user?.id],
    enabled: !!user,
    queryFn: () => fetchIsEditor(user!.id),
  });

  const { data: isAdmin = false, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: () => fetchIsAdmin(user!.id),
  });

  const [tab, setTab] = useState<"library" | "lab">("lab");

  const activeTab = isAdmin ? tab : "lab";

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["roots-content"],
    enabled: !!isEditor,
    queryFn: fetchRoots,
  });

  const warnings = useMemo(() => records.flatMap(recordWarnings), [records]);

  if (roleLoading || adminLoading)
    return <p className="mt-8 text-sm text-muted-foreground">Checking access…</p>;

  if (!isEditor) {
    return (
      <section className="mt-8 rounded-2xl bg-paper p-6 ring-1 ring-line">
        <h1 className="font-display text-xl font-semibold uppercase tracking-[0.16em]">ROOTS admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This editorial dashboard is limited to Terra Woman editors and admins.
        </p>
      </section>
    );
  }

  const total = records.length;
  const verified = records.filter((r) => r.historical_accuracy_status === "VERIFIED").length;
  const needs = records.filter((r) => r.historical_accuracy_status === "NEEDS VERIFICATION").length;
  const draft = records.filter((r) => r.historical_accuracy_status === "DRAFT").length;
  const published = records.filter(
    (r) => r.published && r.historical_accuracy_status === "VERIFIED",
  ).length;

  return (
    <div className="mt-6">
      <header>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.18em]">
          ROOTS editorial dashboard
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Only VERIFIED and published records are visible to users. DRAFT and NEEDS VERIFICATION stay here.
        </p>
      </header>

      <div className="mt-4 flex gap-1.5">
        {(
          [
            ["library", "Library & import"],
            ["lab", "Visual lab"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ring-1 transition-colors ${
              tab === key
                ? "bg-copper/25 text-foreground ring-copper/30"
                : "bg-copper/10 text-copper-ink ring-copper/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "lab" ? (
        <div className="mt-6">
          <VisualLab />
        </div>
      ) : isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading the library…</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Total roots" value={total} />
            <Stat label="Verified" value={verified} />
            <Stat label="Needs verification" value={needs} />
            <Stat label="Draft" value={draft} />
            <Stat label="Published" value={published} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Coverage title="Era" rows={countBy(records, "historical_period")} />
            <Coverage title="Geography" rows={countBy(records, "geography")} />
            <Coverage title="Topic" rows={countBy(records, "topic")} />
            <Coverage title="Content type" rows={countBy(records, "content_type")} />
          </div>

          <section className="mt-4 rounded-2xl bg-paper p-5 ring-1 ring-line">
            <h2 className="font-display text-lg font-semibold uppercase tracking-[0.16em]">
              Editorial review queue · {warnings.length}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Flags only. Nothing is auto-filled or auto-corrected.
            </p>
            <div className="mt-3">
              <WarningList warnings={warnings} />
            </div>
          </section>

          <ImportPanel
            existing={records}
            onDone={() => void queryClient.invalidateQueries({ queryKey: ["roots-content"] })}
          />

          <VisualTreatmentPanel
            records={records}
            onSaved={() => void queryClient.invalidateQueries({ queryKey: ["roots-content"] })}
          />

          <section className="mt-6 rounded-2xl bg-paper p-5 ring-1 ring-line">
            <h2 className="font-display text-lg font-semibold uppercase tracking-[0.16em]">Library</h2>
            <div className="mt-3 max-h-96 overflow-auto rounded-xl ring-1 ring-line">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-background">
                  <tr>
                    <th className="px-2 py-1.5">ID</th>
                    <th className="px-2 py-1.5">Title</th>
                    <th className="px-2 py-1.5">Type</th>
                    <th className="px-2 py-1.5">Era</th>
                    <th className="px-2 py-1.5">Status</th>
                    <th className="px-2 py-1.5">Public</th>
                    <th className="px-2 py-1.5">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const flags = recordWarnings(r).length;
                    return (
                      <tr key={r.id} className="border-t border-line">
                        <td className="px-2 py-1.5 font-semibold">{r.id}</td>
                        <td className="px-2 py-1.5">{r.title}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{r.content_type ?? "—"}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{r.historical_period ?? "—"}</td>
                        <td className="px-2 py-1.5">{r.historical_accuracy_status}</td>
                        <td className="px-2 py-1.5">
                          {r.published && r.historical_accuracy_status === "VERIFIED" ? "Yes" : "Hidden"}
                        </td>
                        <td className="px-2 py-1.5 text-copper-ink">{flags || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------------- Visual treatment editor ---------------- */

const ASSET_TYPES = [
  "portrait",
  "artifact",
  "botanical",
  "manuscript",
  "engraving",
  "illustration",
  "photograph",
] as const;

const RIGHTS_STATUSES = ["UNKNOWN", "PENDING", "CLEARED", "PUBLIC DOMAIN", "RESTRICTED"] as const;

function MiniThumb({ record, template, active, onPick, disabled }: {
  record: RootsRecord;
  template: VisualTemplate;
  active: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const meta = VISUAL_TEMPLATES.find((t) => t.key === template)!;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={`group grid gap-2 text-left ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <span
        className={`pointer-events-none relative block aspect-[4/5] overflow-hidden rounded-xl bg-background ring-2 transition-all ${
          active ? "ring-copper" : "ring-line group-hover:ring-copper/50"
        }`}
      >
        <span className="absolute left-0 top-0 block h-[400%] w-[400%] origin-top-left scale-25">
          <RootsCard record={record} template={template} />
        </span>
      </span>
      <span className="roots-label block text-foreground">{meta.label}</span>
    </button>
  );
}

function VisualTreatmentPanel({ records, onSaved }: { records: RootsRecord[]; onSaved: () => void }) {
  const [selectedId, setSelectedId] = useState<string>("");
  const record = records.find((r) => r.id === selectedId) ?? null;

  const [template, setTemplate] = useState<string>("");
  const [assetUrl, setAssetUrl] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetSource, setAssetSource] = useState("");
  const [assetCredit, setAssetCredit] = useState("");
  const [rights, setRights] = useState("UNKNOWN");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function select(id: string) {
    const r = records.find((x) => x.id === id);
    setSelectedId(id);
    setMessage(null);
    if (!r) return;
    setTemplate(r.visual_template ?? "");
    setAssetUrl(r.visual_asset_url ?? "");
    setAssetType(r.visual_asset_type ?? "");
    setAssetSource(r.visual_asset_source ?? "");
    setAssetCredit(r.visual_asset_credit ?? "");
    setRights(r.visual_asset_rights_status ?? "UNKNOWN");
  }

  const draft: RootsRecord | null = record
    ? {
        ...record,
        visual_template: template || null,
        visual_asset_url: assetUrl || null,
        visual_asset_type: assetType || null,
        visual_asset_source: assetSource || null,
        visual_asset_credit: assetCredit || null,
        visual_asset_rights_status: rights,
      }
    : null;

  const recommended = record ? recommendTemplate(record) : null;
  const allowed = record ? allowedTemplates(record) : [];
  const effectiveTemplate: VisualTemplate | null = draft ? resolveTemplate(draft) : null;
  const rightsOk = rights === "CLEARED" || rights === "PUBLIC DOMAIN";
  const imageBlocked = !!assetUrl && (!assetSource.trim() || !rightsOk);

  async function save() {
    if (!draft) return;
    if (imageBlocked) {
      setMessage(
        "An archival image cannot be saved without a completed source and a rights status of CLEARED or PUBLIC DOMAIN.",
      );
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("roots_content")
        .update({
          visual_template: draft.visual_template,
          visual_asset_url: draft.visual_asset_url,
          visual_asset_type: draft.visual_asset_type,
          visual_asset_source: draft.visual_asset_source,
          visual_asset_credit: draft.visual_asset_credit,
          visual_asset_rights_status: draft.visual_asset_rights_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft.id);
      if (error) throw error;
      setMessage("Visual treatment saved.");
      onSaved();
    } catch (e) {
      setMessage(`Save failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl bg-paper p-5 ring-1 ring-line">
      <h2 className="font-display text-lg font-semibold uppercase tracking-[0.16em]">Visual treatment</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        A template is recommended automatically from the content type. You can override it. Archival
        imagery only appears when source, credit and rights status are recorded — never before.
      </p>

      <select
        value={selectedId}
        onChange={(e) => select(e.target.value)}
        className="mt-3 w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line"
      >
        <option value="">Choose a record…</option>
        {records.map((r) => (
          <option key={r.id} value={r.id}>
            {r.id} — {r.title}
          </option>
        ))}
      </select>

      {record && draft && (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-copper-ink">
              Template {recommended && `· recommended: ${recommended.replaceAll("_", " ")}`}
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {VISUAL_TEMPLATES.map((t) => (
                <MiniThumb
                  key={t.key}
                  record={draft}
                  template={t.key}
                  active={(template || recommended) === t.key}
                  disabled={!allowed.includes(t.key)}
                  onPick={() => setTemplate(t.key === recommended ? "" : t.key)}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Choosing the recommended template clears the override. Unavailable treatments
              (This Day without an exact date, In Her Words without a verified sourced quote) are disabled.
            </p>

            <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-copper-ink">
              Archival visual
            </h3>
            <div className="mt-2 grid gap-2">
              <input
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                placeholder="Image URL (leave empty until rights are confirmed)"
                className="rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-line"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-line"
                >
                  <option value="">Asset type…</option>
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={rights}
                  onChange={(e) => setRights(e.target.value)}
                  className="rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-line"
                >
                  {RIGHTS_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <input
                value={assetSource}
                onChange={(e) => setAssetSource(e.target.value)}
                placeholder="Source (collection, archive, museum…)"
                className="rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-line"
              />
              <input
                value={assetCredit}
                onChange={(e) => setAssetCredit(e.target.value)}
                placeholder="Credit line"
                className="rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-line"
              />
            </div>

            {imageBlocked && (
              <p className="mt-3 rounded-xl bg-amber/25 px-3 py-2 text-xs font-semibold ring-1 ring-amber/40">
                Image withheld: record a source and set rights to CLEARED or PUBLIC DOMAIN before it
                can be used or saved.
              </p>
            )}
            {assetUrl && !imageBlocked && !hasUsableAsset(draft) && (
              <p className="mt-3 rounded-xl bg-amber/25 px-3 py-2 text-xs font-semibold ring-1 ring-amber/40">
                Almost there — add a source to make this image usable.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => void save()}
                disabled={busy || imageBlocked}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save visual treatment"}
              </button>
            </div>
            {message && (
              <p className="mt-3 rounded-xl bg-mint/20 px-3 py-2 text-xs font-semibold">{message}</p>
            )}
          </div>

          <div className="grid gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Card preview · {effectiveTemplate?.replaceAll("_", " ")}
              </h3>
              <div className="mt-2">
                <RootsCard record={draft} className="ring-1 ring-line" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Social share · 1080 × 1350
                </h3>
                <div className="mt-2">
                  <RootsCard record={draft} format="share" className="ring-1 ring-line" />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Story page
                </h3>
                <div className="mt-2 rounded-xl bg-background p-4 text-xs leading-relaxed ring-1 ring-line">
                  <p className="roots-label text-copper-ink">{record.content_type?.replaceAll("_", " ")}</p>
                  <p className="mt-2 font-display text-xl leading-tight">{record.title}</p>
                  <p className="roots-meta mt-2 text-muted-foreground">
                    {[record.historical_period, record.geography].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-3 text-muted-foreground">
                    {(record.body ?? record.short_body ?? "").slice(0, 220)}
                    {(record.body ?? "").length > 220 ? "…" : ""}
                  </p>
                  <p className="roots-meta mt-3 text-muted-foreground/70">
                    The card above becomes the visual hero of this page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
