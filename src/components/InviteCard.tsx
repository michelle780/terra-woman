import { useState } from "react";
import { toast } from "sonner";

export function InviteCard() {
  const [copied, setCopied] = useState(false);

  const link =
    typeof window === "undefined" ? "" : `${window.location.origin}/invite`;
  const text =
    "I've been using Pulse to track how I sleep, feel and cycle day to day. You can set up your own private log here:";

  async function share() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Pulse", text, url: link });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${link}`);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — long-press the link instead");
    }
  }

  return (
    <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
      <p className="eyebrow">Share</p>
      <h2 className="mt-0.5 text-xl">Invite a friend</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Send them a link and they can set up their own private Pulse log in a minute. Your entries
        stay yours — nothing is shared between accounts.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={share}
          className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Share invite
        </button>
        <button
          onClick={copy}
          className="rounded-2xl bg-background px-4 py-2.5 text-sm font-semibold ring-1 ring-line transition-colors hover:bg-cream"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <a
          href={`mailto:?subject=${encodeURIComponent("Thought you'd like Pulse")}&body=${encodeURIComponent(`${text} ${link}`)}`}
          className="rounded-2xl bg-background px-4 py-2.5 text-sm font-semibold ring-1 ring-line transition-colors hover:bg-cream"
        >
          Email it
        </a>
      </div>

      <p className="mt-3 truncate rounded-2xl bg-background px-4 py-2.5 text-xs text-muted-foreground ring-1 ring-line">
        {link || "/invite"}
      </p>
    </section>
  );
}
