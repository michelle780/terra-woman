import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Share2, Bookmark, Check, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchPublishedRoot, fetchPublishedRoots } from "@/lib/roots-public";
import { StoryHero, Eyebrow, RootChipCard, BotanicalDivider } from "@/components/roots/editorial";
import { TerraMark } from "@/components/roots/primitives";
import {
  branchOf,
  relatedTo,
  rotate,
  seriesLabel,
  sourceLinks,
  todaySeed,
} from "@/lib/roots-editorial";

export const Route = createFileRoute("/roots/$id")({
  head: () => ({
    meta: [
      { title: "A story from ROOTS · Terra Woman" },
      {
        name: "description",
        content:
          "A story from Terra Woman's living archive of women, wisdom and moments across thousands of years.",
      },
      { property: "og:title", content: "A story from ROOTS · Terra Woman" },
      {
        property: "og:description",
        content: "The women, wisdom and moments that brought us here.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <RootStory />
    </AppShell>
  ),
});

function RootStory() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useQuery({
    queryKey: ["roots", "published", id],
    queryFn: () => fetchPublishedRoot(id),
  });

  const { data: all = [] } = useQuery({
    queryKey: ["roots", "published"],
    queryFn: fetchPublishedRoots,
  });

  const { data: savedIds = [] } = useQuery({
    queryKey: ["roots", "saved", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("roots_saves").select("root_id");
      if (error) throw error;
      return (data ?? []).map((row: { root_id: string }) => row.root_id);
    },
  });

  if (isLoading) {
    return <p className="pt-6 text-sm text-muted-foreground">Opening the archive…</p>;
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <TerraMark className="mx-auto size-8 text-mint" />
        <p className="mt-6 font-display text-3xl">This story isn't in the archive.</p>
        <Link to="/roots" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-copper-ink hover:underline">
          <ArrowLeft className="size-4" /> Back to Roots
        </Link>
      </div>
    );
  }

  const related = relatedTo(record, all, 5);
  const sources = sourceLinks(record);
  const branch = branchOf(record);
  const saved = savedIds.includes(record.id);

  async function toggleSave() {
    if (!user) {
      toast("Sign in to save this story.");
      return;
    }
    if (saved) {
      await supabase.from("roots_saves").delete().eq("root_id", record!.id).eq("user_id", user.id);
      toast("Removed from your roots.");
    } else {
      const { error } = await supabase
        .from("roots_saves")
        .insert({ root_id: record!.id, user_id: user.id });
      if (error) {
        toast.error("Couldn't save that just now.");
        return;
      }
      toast.success("Saved to your roots.");
    }
    queryClient.invalidateQueries({ queryKey: ["roots", "saved", user.id] });
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${record!.woman_name ?? record!.title} — ROOTS · Terra Woman`,
          text: record!.short_body ?? record!.title,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — share this story.");
    } catch {
      /* dismissed */
    }
  }

  function surpriseMe() {
    const pool = rotate(all.filter((r) => r.id !== record!.id), todaySeed() + Date.now() % 9973);
    const next = pool[0];
    if (next) navigate({ to: "/roots/$id", params: { id: next.id } });
  }

  const paragraphs = (record.body ?? record.short_body ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="space-y-14 pb-24 pt-6">
      <Link
        to="/roots"
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> ROOTS
      </Link>

      <StoryHero record={record} />

      {/* The story */}
      <div className="mx-auto max-w-[38rem] space-y-6">
        {record.short_body && paragraphs[0] !== record.short_body && (
          <p className="font-display text-[1.5rem] leading-[1.35] text-foreground/90">
            {record.short_body}
          </p>
        )}
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[1.05rem] leading-[1.75] text-foreground/85">
            {p}
          </p>
        ))}
      </div>

      {record.why_it_matters && (
        <div className="mx-auto max-w-[38rem]">
          <BotanicalDivider className="mb-8" />
          <Eyebrow className="text-copper-ink">
            {record.woman_name ? "Why she matters" : "Why it matters"}
          </Eyebrow>
          <p className="mt-5 font-display text-[1.6rem] leading-[1.3]">{record.why_it_matters}</p>
        </div>
      )}

      {consumerContext(record.modern_context) && (
        <div className="mx-auto max-w-[38rem] rounded-2xl bg-paper p-6 ring-1 ring-line/70 sm:p-8">
          <Eyebrow className="text-copper-ink">Then / now</Eyebrow>
          <p className="mt-4 text-[0.98rem] leading-relaxed text-foreground/85">
            {consumerContext(record.modern_context)}
          </p>
        </div>
      )}

      {/* Save & share */}
      <div className="mx-auto flex max-w-[38rem] flex-wrap gap-3">
        <button
          onClick={toggleSave}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] ring-1 transition-colors ${
            saved
              ? "bg-foreground text-background ring-foreground"
              : "bg-paper text-foreground ring-line hover:ring-copper"
          }`}
        >
          {saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}
          {saved ? "Saved to my roots" : "Save to my roots"}
        </button>
        <button
          onClick={share}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-paper px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-line transition-colors hover:ring-copper"
        >
          <Share2 className="size-4" /> Share this root
        </button>
      </div>

      {/* Sources — discreet */}
      {sources.length > 0 && (
        <div className="mx-auto max-w-[38rem] border-t border-line pt-6">
          <Eyebrow className="text-muted-foreground">Sources & further reading</Eyebrow>
          <ul className="mt-4 grid gap-2">
            {sources.map((s) => (
              <li key={s.name} className="text-sm text-muted-foreground">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline decoration-line underline-offset-4 transition-colors hover:text-foreground"
                  >
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keep exploring */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Eyebrow className="text-copper-ink">Keep exploring the tree</Eyebrow>
          <div className="flex items-center gap-4">
            {branch && (
              <Link
                to="/roots/branch/$branch"
                params={{ branch: branch.toLowerCase() }}
                className="roots-meta text-muted-foreground transition-colors hover:text-foreground"
              >
                All of {branch.toLowerCase()} →
              </Link>
            )}
            <button
              onClick={surpriseMe}
              className="roots-meta inline-flex items-center gap-2 text-copper-ink transition-opacity hover:opacity-70"
            >
              <Shuffle className="size-3.5" /> Surprise me
            </button>
          </div>
        </div>
        <div className="-mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {related.map((r) => (
            <RootChipCard key={r.id} record={r} />
          ))}
        </div>
        <p className="mt-6 roots-meta text-muted-foreground/70">
          {seriesLabel(record)} · Terra Woman
        </p>
      </section>
    </article>
  );
}
