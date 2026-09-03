import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  buildPreview,
  commitImport,
  countBy,
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

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["roots-content"],
    enabled: !!isEditor,
    queryFn: fetchRoots,
  });

  const warnings = useMemo(() => records.flatMap(recordWarnings), [records]);

  if (roleLoading) return <p className="mt-8 text-sm text-muted-foreground">Checking access…</p>;

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

      {isLoading ? (
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
