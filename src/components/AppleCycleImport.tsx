import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { daysBetween, fetchPeriods, type FlowLevel } from "@/lib/wellness";

type DayFlow = { date: string; flow: FlowLevel };
type ParsedPeriod = { start: string; end: string; flow: FlowLevel; days: number };

const FLOW_RANK: Record<FlowLevel, number> = { spotting: 1, light: 2, medium: 3, heavy: 4 };
const RANK_FLOW: FlowLevel[] = ["spotting", "light", "medium", "heavy"];

function flowFromValue(value: string | null): number {
  switch (value) {
    case "HKCategoryValueMenstrualFlowLight":
      return 2;
    case "HKCategoryValueMenstrualFlowHeavy":
      return 4;
    case "HKCategoryValueMenstrualFlowMedium":
    case "HKCategoryValueMenstrualFlowUnspecified":
      return 3;
    default: // intermenstrual bleeding / spotting
      return 1;
  }
}

/** Pull menstrual-flow days out of an Apple Health export.xml. */
function parseAppleExport(xml: string): DayFlow[] {
  const byDay = new Map<string, number>();
  const re =
    /<Record[^>]*type="HKCategoryTypeIdentifier(MenstrualFlow|IntermenstrualBleeding)"[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const tag = m[0];
    const start = /startDate="(\d{4}-\d{2}-\d{2})/.exec(tag)?.[1];
    if (!start) continue;
    const value = /value="([^"]+)"/.exec(tag)?.[1] ?? null;
    const rank = m[1] === "IntermenstrualBleeding" ? 1 : flowFromValue(value);
    byDay.set(start, Math.max(byDay.get(start) ?? 0, rank));
  }
  return [...byDay.entries()]
    .map(([date, rank]) => ({ date, flow: RANK_FLOW[rank - 1] as FlowLevel }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Group consecutive bleeding days into periods (gap of a day still counts as one period). */
function groupPeriods(days: DayFlow[]): ParsedPeriod[] {
  const periods: ParsedPeriod[] = [];
  for (const d of days) {
    const last = periods[periods.length - 1];
    if (last && daysBetween(last.end, d.date) <= 2) {
      last.end = d.date;
      last.days += 1;
      if (FLOW_RANK[d.flow] > FLOW_RANK[last.flow]) last.flow = d.flow;
    } else {
      periods.push({ start: d.date, end: d.date, flow: d.flow, days: 1 });
    }
  }
  return periods;
}

function fmt(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AppleCycleImport() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedPeriod[] | null>(null);
  const [fileName, setFileName] = useState("");

  const { data: existing = [] } = useQuery({
    queryKey: ["cycle-periods"],
    queryFn: fetchPeriods,
  });

  const fresh = (parsed ?? []).filter(
    (p) =>
      !existing.some(
        (e) => p.start <= (e.end_date ?? e.start_date) && p.end >= e.start_date,
      ),
  );

  async function onFile(file: File) {
    setFileName(file.name);
    try {
      const text = await file.text();
      const days = parseAppleExport(text);
      if (days.length === 0) {
        setParsed(null);
        toast.error("No cycle tracking entries found in that file");
        return;
      }
      setParsed(groupPeriods(days));
    } catch {
      toast.error("Couldn't read that file — use the export.xml from Apple Health");
    }
  }

  const importAll = useMutation({
    mutationFn: async () => {
      if (fresh.length === 0) throw new Error("nothing-new");
      const rows = fresh.map((p) => ({
        user_id: user!.id,
        start_date: p.start,
        end_date: p.end,
        flow: p.flow,
        symptoms: [],
        notes: "Imported from Apple Health",
      }));
      const { error } = await supabase.from("cycle_periods").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycle-periods"] });
      toast.success(
        fresh.length === 1 ? "1 period imported to your Cycle page" : `${fresh.length} periods imported to your Cycle page`,
      );
      setParsed(null);
      setFileName("");
    },
    onError: (e: Error) =>
      toast.error(e.message === "nothing-new" ? "Those periods are already logged" : "Import failed — try again"),
  });

  return (
    <section className="rise rounded-[24px] bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md">
      <p className="eyebrow">Cycle tracking</p>
      <h2 className="mt-0.5 text-xl">Import your cycle from Apple Health</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        If you track your period in Apple Health, you can bring the whole history over in one go.
        On your iPhone: <strong>Health → your profile photo → Export All Health Data</strong>, share
        the file to yourself, unzip it, and choose the <code>export.xml</code> inside. The file is
        read here in your browser — it isn't uploaded anywhere.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground"
        >
          Choose export.xml
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xml,text/xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
        {fileName && (
          <span className="text-[11px] text-muted-foreground">{fileName}</span>
        )}
      </div>

      {parsed && (
        <div className="mt-4">
          <p className="text-xs font-bold">
            Preview — {parsed.length} period{parsed.length === 1 ? "" : "s"} found
            {parsed.length !== fresh.length &&
              ` · ${parsed.length - fresh.length} already in your log`}
          </p>
          <ul className="mt-2 grid gap-2">
            {parsed.map((p) => {
              const dupe = !fresh.includes(p);
              return (
                <li
                  key={p.start}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-2.5 text-sm ring-1 ${
                    dupe
                      ? "bg-background/40 text-muted-foreground ring-line"
                      : "bg-background/70 ring-line"
                  }`}
                >
                  <span className="font-semibold">
                    {fmt(p.start)} → {fmt(p.end)}
                  </span>
                  <span className="text-[11px]">
                    {daysBetween(p.start, p.end) + 1} days · {p.flow} flow
                    {dupe && " · already logged"}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => importAll.mutate()}
              disabled={importAll.isPending || fresh.length === 0}
              className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {importAll.isPending
                ? "Importing…"
                : fresh.length === 0
                  ? "Nothing new to import"
                  : `Import ${fresh.length} period${fresh.length === 1 ? "" : "s"}`}
            </button>
            <button
              onClick={() => {
                setParsed(null);
                setFileName("");
              }}
              className="rounded-full bg-background/70 px-4 py-2 text-xs font-bold ring-1 ring-line"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
