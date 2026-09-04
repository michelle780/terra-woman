import { Link } from "@tanstack/react-router";
import terraTree from "@/assets/terra-tree.png";

export function FounderPreview({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`rise rounded-[24px] bg-paper/90 ring-1 ring-line backdrop-blur-sm ${
        compact ? "p-5" : "p-6 sm:p-8"
      }`}
    >
      <div className="flex items-start gap-4">
        <img
          src={terraTree}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 object-contain opacity-90"
        />
        <div>
          <p className="eyebrow">Why I built Terra Woman</p>
          <p className="mt-2 font-display text-lg leading-snug text-pretty">
            “I had more data about myself than ever — my ring, my watch, my medications — and none
            of it told the story of <em>me</em>.”
          </p>
          {!compact && (
            <p className="mt-2 text-sm text-muted-foreground">
              Not as Oura interpreted me. Not as Apple interpreted me. As I experienced myself.
              Terra Woman grew from that gap — a private place to see yourself whole.
            </p>
          )}
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-copper-ink">
            Michelle, founder
          </p>
          <Link
            to="/about"
            className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
          >
            Read the full story →
          </Link>
        </div>
      </div>
    </section>
  );
}
