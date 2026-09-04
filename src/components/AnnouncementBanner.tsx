import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Megaphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_url: string | null;
};

export function AnnouncementBanner() {
  const [dismissedId, setDismissedId] = useState<string | null>(
    () => localStorage.getItem("tw-dismissed-announcement"),
  );

  const { data } = useQuery({
    queryKey: ["announcement-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, body, cta_label, cta_url")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Banner | null;
    },
    staleTime: 60_000,
  });

  if (!data || data.id === dismissedId) return null;

  function dismiss() {
    localStorage.setItem("tw-dismissed-announcement", data!.id);
    setDismissedId(data!.id);
  }

  const cta =
    data.cta_label && data.cta_url ? (
      data.cta_url.startsWith("/") ? (
        <Link
          to={data.cta_url}
          className="shrink-0 rounded-full bg-copper px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:opacity-90"
        >
          {data.cta_label}
        </Link>
      ) : (
        <a
          href={data.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-copper px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:opacity-90"
        >
          {data.cta_label}
        </a>
      )
    ) : null;

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-copper/10 px-4 py-3 ring-1 ring-copper/30 backdrop-blur-md">
      <Megaphone className="size-4 shrink-0 text-copper-ink" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-copper-ink">{data.title}</p>
        {data.body && <p className="truncate text-xs text-muted-foreground">{data.body}</p>}
      </div>
      {cta}
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-paper/60"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
