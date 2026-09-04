import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { MessageCircleHeart, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const CATEGORIES = [
  { value: "idea", label: "Idea / feature request" },
  { value: "bug", label: "Something isn't working" },
  { value: "confusing", label: "Confusing or hard to use" },
  { value: "general", label: "General feedback" },
] as const;

const PROMPT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // re-ask at most weekly
const PROMPT_KEY = "tw-feedback-last-prompt";

export function FeedbackWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Gentle auto-prompt: after ~90s on a page, at most once a week, if not
  // already dismissed recently.
  useEffect(() => {
    if (!user) return;
    const last = Number(localStorage.getItem(PROMPT_KEY) ?? 0);
    if (Date.now() - last < PROMPT_INTERVAL_MS) return;
    const t = window.setTimeout(() => {
      localStorage.setItem(PROMPT_KEY, String(Date.now()));
      setOpen(true);
    }, 90_000);
    return () => window.clearTimeout(t);
  }, [user, location.pathname]);

  if (!user) return null;

  async function submit() {
    if (!message.trim()) {
      toast.error("Tell us a little something first.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user!.id,
        category,
        message: message.trim(),
        page_path: location.pathname,
      });
      if (error) throw error;
      toast.success("Thank you — your feedback helps Terra Woman grow.");
      setMessage("");
      setCategory("general");
      setOpen(false);
    } catch {
      toast.error("Couldn't send that just now. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Share feedback"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-copper px-4 py-2.5 text-xs font-semibold text-paper shadow-lg ring-1 ring-copper/40 transition-transform hover:scale-[1.03]"
      >
        <MessageCircleHeart className="size-4" aria-hidden />
        Help us improve
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Help us improve Terra Woman"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-paper p-6 shadow-xl ring-1 ring-line"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">Help us improve</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  What's working, what's not, what would make this your oasis?
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close feedback"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-background"
              >
                <X className="size-4" />
              </button>
            </div>

            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              What kind of feedback?
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition-colors ${
                    category === c.value
                      ? "bg-copper/20 text-copper-ink ring-copper/40"
                      : "bg-background text-muted-foreground ring-line"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Your thoughts
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="e.g. I wish I could see my cycle next to my sleep score…"
              className="mt-1.5 w-full rounded-2xl bg-background px-3 py-2.5 text-sm ring-1 ring-line outline-none focus:ring-copper/50"
            />

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Sent from {location.pathname} — only admins can read this.
              </p>
              <button
                onClick={submit}
                disabled={sending}
                className="rounded-full bg-copper px-5 py-2 text-xs font-semibold text-paper transition-opacity disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
