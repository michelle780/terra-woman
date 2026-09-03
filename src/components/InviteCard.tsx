import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
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
      toast.success("Invite link copied");
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
    <div className="rise flex items-center gap-3 rounded-2xl bg-paper p-3 ring-1 ring-line">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber/15 ring-1 ring-amber/30">
        <Share2 className="size-4 text-amber" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">Invite a friend to Pulse</p>
        <p className="truncate text-[11px] text-muted-foreground">
          Your entries stay private — nothing is shared between accounts.
        </p>
      </div>
      <button
        onClick={share}
        className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Share
      </button>
      <button
        onClick={copy}
        aria-label="Copy invite link"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-background ring-1 ring-line transition-colors hover:bg-cream"
      >
        {copied ? (
          <Check className="size-4 text-mint" aria-hidden />
        ) : (
          <Copy className="size-4 text-muted-foreground" aria-hidden />
        )}
      </button>
    </div>
  );
}
