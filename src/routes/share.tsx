import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ShieldCheck, Copy, Link2, Trash2, Ban } from "lucide-react";
import {
  CONSENT_VERSION,
  RELATIONSHIPS,
  SHARE_SCOPES,
  consentStatement,
  createShareGrant,
  deleteShareGrant,
  listShareGrants,
  revokeShareGrant,
  type ShareGrant,
} from "@/lib/sharing.functions";

export const Route = createFileRoute("/share")({
  head: () => ({
    meta: [
      { title: "Share with a partner or provider — Terra Woman" },
      {
        name: "description",
        content:
          "Create a private, revocable link that shares chosen parts of your Terra Woman health data with a partner or medical provider, with a signed consent record.",
      },
      { property: "og:title", content: "Share with a partner or provider — Terra Woman" },
      {
        property: "og:description",
        content: "Consent-based, revocable sharing of your wellness data with the people you choose.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <SharePage />
    </AppShell>
  ),
});

const EXPIRY_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: null as number | null, label: "Until I revoke it" },
];

function shareUrl(token: string) {
  if (typeof window === "undefined") return `/shared/${token}`;
  return `${window.location.origin}/shared/${token}`;
}

function SharePage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listShareGrants);
  const create = useServerFn(createShareGrant);
  const revoke = useServerFn(revokeShareGrant);
  const remove = useServerFn(deleteShareGrant);

  const { data: grants = [], isLoading } = useQuery({
    queryKey: ["share-grants"],
    queryFn: () => list(),
  });

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [relationship, setRelationship] = useState<(typeof RELATIONSHIPS)[number]["id"]>("provider");
  const [scopes, setScopes] = useState<string[]>(["metrics", "checkins"]);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(30);
  const [consentOpen, setConsentOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [signature, setSignature] = useState("");

  const relationshipLabel =
    RELATIONSHIPS.find((r) => r.id === relationship)?.label ?? "someone else";
  const scopeLabels = useMemo(
    () => SHARE_SCOPES.filter((s) => scopes.includes(s.id)).map((s) => s.label),
    [scopes]
  );
  const expiresLabel = expiresInDays ? `${expiresInDays} days from today` : "when I revoke access";

  const statement = consentStatement({
    recipientName: recipientName.trim() || "this recipient",
    relationship: relationshipLabel.toLowerCase(),
    scopeLabels,
    expiresLabel,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      create({
        data: {
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim(),
          relationship,
          scopes: scopes as ("metrics" | "checkins" | "medications" | "cycle" | "journal")[],
          expiresInDays,
          signature: signature.trim(),
          consentStatement: statement,
        },
      }),
    onSuccess: async (grant) => {
      await queryClient.invalidateQueries({ queryKey: ["share-grants"] });
      setConsentOpen(false);
      setAcknowledged(false);
      setSignature("");
      setRecipientName("");
      setRecipientEmail("");
      try {
        await navigator.clipboard.writeText(shareUrl(grant.token));
        toast.success("Private link created and copied to your clipboard");
      } catch {
        toast.success("Private link created");
      }
    },
    onError: () => toast.error("Could not create the link. Please try again."),
  });

  const canOpenConsent = recipientName.trim().length >= 2 && scopes.length > 0;
  const signatureValid = signature.trim().length >= 2;

  function toggleScope(id: string) {
    setScopes((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-6 py-4">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Share with someone you trust</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Create a private, read-only page for a partner or medical provider. You choose exactly what
          they see, how long the link lasts, and you can switch it off at any moment.
        </p>
      </header>

      <section className="rounded-2xl bg-paper/70 p-5 ring-1 ring-line backdrop-blur-md">
        <h2 className="font-display text-lg font-semibold">New sharing link</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-semibold">Who are you sharing with?</span>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Dr. Ana Reyes"
              className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-copper/40"
            />
          </label>
          <label className="text-sm">
            <span className="font-semibold">Their email (optional)</span>
            <input
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="name@clinic.com"
              className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-copper/40"
            />
          </label>
        </div>

        <div className="mt-4">
          <span className="text-sm font-semibold">Relationship</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {RELATIONSHIPS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRelationship(r.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                  relationship === r.id
                    ? "bg-copper/25 text-foreground ring-copper/40"
                    : "bg-background text-muted-foreground ring-line"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="text-sm font-semibold">What they can see</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {SHARE_SCOPES.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-line"
              >
                <input
                  type="checkbox"
                  checked={scopes.includes(s.id)}
                  onChange={() => toggleScope(s.id)}
                  className="size-4 accent-current"
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="text-sm font-semibold">Access lasts</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPIRY_OPTIONS.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setExpiresInDays(o.days)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                  expiresInDays === o.days
                    ? "bg-copper/25 text-foreground ring-copper/40"
                    : "bg-background text-muted-foreground ring-line"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canOpenConsent}
          onClick={() => setConsentOpen(true)}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-copper/25 px-4 py-2 text-sm font-bold ring-1 ring-copper/40 transition-colors hover:bg-copper/40 disabled:opacity-50"
        >
          <ShieldCheck className="size-4" aria-hidden />
          Review consent & sign
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Your sharing links</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : grants.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't shared your data with anyone yet.</p>
        ) : (
          grants.map((g: ShareGrant) => {
            const expired = !!g.expires_at && new Date(g.expires_at).getTime() < Date.now();
            const active = !g.revoked_at && !expired;
            return (
              <div key={g.id} className="rounded-2xl bg-paper/70 p-4 ring-1 ring-line backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {g.recipient_name}{" "}
                      <span className="text-xs font-medium text-muted-foreground">
                        · {RELATIONSHIPS.find((r) => r.id === g.relationship)?.label ?? g.relationship}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {SHARE_SCOPES.filter((s) => g.scopes.includes(s.id))
                        .map((s) => s.label)
                        .join(" · ")}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Signed by {g.consent_signature} on{" "}
                      {new Date(g.consent_signed_at).toLocaleDateString()} ({CONSENT_VERSION}) ·{" "}
                      {g.expires_at
                        ? `ends ${new Date(g.expires_at).toLocaleDateString()}`
                        : "no end date"}{" "}
                      · opened {g.view_count} time{g.view_count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
                      active
                        ? "bg-sky/20 text-foreground ring-sky/30"
                        : "bg-background text-muted-foreground ring-line"
                    }`}
                  >
                    {g.revoked_at ? "Revoked" : expired ? "Expired" : "Active"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {active && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(shareUrl(g.token));
                          toast.success("Link copied");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold ring-1 ring-line"
                      >
                        <Copy className="size-3.5" aria-hidden /> Copy link
                      </button>
                      <a
                        href={shareUrl(g.token)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold ring-1 ring-line"
                      >
                        <Link2 className="size-3.5" aria-hidden /> Preview
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          await revoke({ data: { id: g.id } });
                          await queryClient.invalidateQueries({ queryKey: ["share-grants"] });
                          toast.success("Access revoked");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber/25 px-3 py-1.5 text-xs font-semibold ring-1 ring-amber/40"
                      >
                        <Ban className="size-3.5" aria-hidden /> Revoke
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await remove({ data: { id: g.id } });
                      await queryClient.invalidateQueries({ queryKey: ["share-grants"] });
                      toast.success("Removed");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground ring-1 ring-line"
                  >
                    <Trash2 className="size-3.5" aria-hidden /> Delete record
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {consentOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Consent to share personal health information"
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-5 ring-1 ring-line"
          >
            <h3 className="font-display text-lg font-semibold">
              Consent to share your personal health information
            </h3>
            <p className="mt-2 rounded-xl bg-amber/15 p-3 text-xs leading-relaxed ring-1 ring-amber/30">
              You are about to share sensitive personal information — including health, mood, medication
              and cycle details. Anyone who has the private link can open this page. Only share it with
              someone you trust, and revoke it the moment you change your mind.
            </p>

            <div className="mt-3 rounded-xl bg-paper/70 p-3 text-xs leading-relaxed ring-1 ring-line">
              {statement}
            </div>

            <label className="mt-3 flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 size-4"
              />
              <span>
                I have read and agree to the authorisation above, and I consent to signing it
                electronically.
              </span>
            </label>

            <label className="mt-3 block text-sm">
              <span className="font-semibold">Type your full legal name to sign</span>
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Your full name"
                className="mt-1 w-full rounded-xl bg-background px-3 py-2 font-display text-lg italic ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-copper/40"
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Signed {new Date().toLocaleString()} · recorded with this authorisation.
              </span>
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConsentOpen(false)}
                className="rounded-full bg-background px-4 py-2 text-sm font-semibold ring-1 ring-line"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!acknowledged || !signatureValid || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="rounded-full bg-copper/25 px-4 py-2 text-sm font-bold ring-1 ring-copper/40 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating…" : "Sign & create link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
