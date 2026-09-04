import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import terraTree from "@/assets/terra-tree.png";
import { getSharedView, type SharedView } from "@/lib/sharing.functions";

export const Route = createFileRoute("/shared/$token")({
  head: () => ({
    meta: [
      { title: "Shared wellness summary — Terra Woman" },
      {
        name: "description",
        content:
          "A private, read-only wellness summary shared with you by a Terra Woman member. Access can be revoked at any time.",
      },
      { property: "og:title", content: "Shared wellness summary — Terra Woman" },
      {
        property: "og:description",
        content: "A private, consent-based wellness summary shared by a Terra Woman member.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SharedPage,
});

function formatSleep(minutes: number | null) {
  if (minutes == null) return "—";
  return `${Math.floor(minutes / 60)}h ${(minutes % 60).toString().padStart(2, "0")}m`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SharedPage() {
  const { token } = Route.useParams();
  const load = useServerFn(getSharedView);
  const { data, isLoading } = useQuery<SharedView>({
    queryKey: ["shared-view", token],
    queryFn: () => load({ data: { token } }),
  });

  const owner = data?.ownerName?.trim() || "A Terra Woman member";

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <img src={terraTree} alt="" width={1005} height={1007} className="h-[92vh] w-auto max-w-none opacity-[0.18]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <div className="font-display text-sm font-semibold uppercase tracking-[0.22em]">Terra Woman</div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Shared wellness summary</h1>
        </header>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {data && !data.ok && (
          <div className="rounded-2xl bg-paper/70 p-5 text-sm ring-1 ring-line">
            {data.reason === "revoked"
              ? "This link has been switched off by the person who shared it."
              : data.reason === "expired"
                ? "This link has expired."
                : "This link isn't valid."}
          </div>
        )}

        {data?.ok && (
          <>
            <div className="rounded-2xl bg-amber/15 p-4 text-xs leading-relaxed ring-1 ring-amber/30">
              {owner} chose to share this with {data.recipientName}. It contains sensitive personal
              health information, shared with her written consent on{" "}
              {data.sharedOn ? new Date(data.sharedOn).toLocaleDateString() : "—"}. Please keep it
              private. It is not a medical record and is not medical advice.
              {data.expiresAt
                ? ` Access ends ${new Date(data.expiresAt).toLocaleDateString()}.`
                : " Access continues until she revokes it."}
            </div>

            {data.metrics && (
              <Section title="Sleep, readiness & activity">
                {data.metrics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No readings in the last 60 days.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <tr className="border-b border-line">
                          <th className="py-2 pr-3">Date</th>
                          <th className="py-2 pr-3">Sleep</th>
                          <th className="py-2 pr-3">Score</th>
                          <th className="py-2 pr-3">Readiness</th>
                          <th className="py-2 pr-3">HRV</th>
                          <th className="py-2 pr-3">Resting HR</th>
                          <th className="py-2">Steps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.metrics.slice(0, 30).map((m) => (
                          <tr key={m.metric_date} className="border-b border-line/60 last:border-0">
                            <td className="py-2 pr-3">{m.metric_date}</td>
                            <td className="py-2 pr-3">{formatSleep(m.sleep_minutes)}</td>
                            <td className="py-2 pr-3">{m.sleep_score ?? "—"}</td>
                            <td className="py-2 pr-3">{m.readiness ?? "—"}</td>
                            <td className="py-2 pr-3">{m.hrv ?? "—"}</td>
                            <td className="py-2 pr-3">{m.resting_hr ?? "—"}</td>
                            <td className="py-2">{m.steps ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            )}

            {data.checkins && (
              <Section title="Daily check-ins">
                {data.checkins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No check-ins in the last 60 days.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.checkins.slice(0, 30).map((c) => (
                      <li key={c.checkin_date} className="rounded-xl bg-background px-3 py-2 ring-1 ring-line">
                        <span className="font-semibold">{c.checkin_date}</span>{" "}
                        <span className="text-muted-foreground">
                          happiness {c.happiness ?? "—"} · calm {c.calm ?? "—"} · energy {c.energy ?? "—"} ·
                          stress {c.stress ?? "—"} · anxiety {c.anxiety ?? "—"} · cramps {c.cramps ?? "—"} ·
                          bloating {c.bloating ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            {data.medications && (
              <Section title="Medications">
                {data.medications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No medications listed.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.medications.map((m, i) => (
                      <li key={`${m.name}-${i}`} className="rounded-xl bg-background px-3 py-2 ring-1 ring-line">
                        <span className="font-semibold">{m.name}</span>{" "}
                        <span className="text-muted-foreground">
                          {m.dose ? `· ${m.dose} ` : ""}· {m.frequency.replace("_", " ")}
                          {m.active ? "" : " · inactive"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            {data.cycle && (
              <Section title="Cycle history">
                {data.cycle.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No cycle records.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.cycle.map((c, i) => (
                      <li key={`${c.start_date}-${i}`} className="rounded-xl bg-background px-3 py-2 ring-1 ring-line">
                        <span className="font-semibold">
                          {c.start_date} → {c.end_date ?? "ongoing"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {c.flow ? `· ${c.flow} flow ` : ""}
                          {c.symptoms?.length ? `· ${c.symptoms.join(", ")}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            {data.journal && (
              <Section title="Journal notes">
                {data.journal.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No journal notes in the last 60 days.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.journal.slice(0, 20).map((j, i) => (
                      <li key={`${j.entry_date}-${i}`} className="rounded-xl bg-background px-3 py-2 ring-1 ring-line">
                        <div className="font-semibold">
                          {j.entry_date} {j.mood ? `· ${j.mood}` : ""}
                        </div>
                        {j.note && <p className="mt-1 text-muted-foreground">{j.note}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}
          </>
        )}

        <p className="pb-6 text-center text-[11px] text-muted-foreground">
          Terra Woman · See yourself whole · shared with consent · not medical advice
        </p>
      </div>
    </div>
  );
}
