/**
 * TreeGrowth — the Terra Woman tree-of-life emblem (the woman whose body
 * becomes the tree, roots below, branches above, crescent moon overhead)
 * revealed from roots to full canopy as the welcome series progresses.
 * A nod to the herbalists, midwives and healers whose knowledge was
 * passed down woman to woman.
 */
import terraTree from "@/assets/terra-tree.png";

const STAGE_LABELS = [
  "Roots — where you come from",
  "Seedling — a first stirring",
  "Trunk — steady ground",
  "Branches — what you reach for",
  "Canopy — the whole picture",
] as const;

export function TreeGrowth({ step, total }: { step: number; total: number }) {
  // step is 0-indexed; stage 0 = roots only, final stage = full emblem.
  const stage = Math.max(0, Math.min(STAGE_LABELS.length - 1, step));
  // Reveal the emblem bottom-up: roots first, then the woman/trunk,
  // then the branches and moon at the crown.
  const reveal = [0.32, 0.52, 0.72, 0.88, 1][stage];
  const hidden = (1 - reveal) * 100;

  return (
    <figure className="m-0 flex flex-col items-center">
      <div
        className="relative h-44 w-44 sm:h-52 sm:w-52"
        role="img"
        aria-label={`Growth stage ${stage + 1} of ${STAGE_LABELS.length}: ${STAGE_LABELS[stage]}`}
      >
        {/* faint full emblem as the promise of what's growing */}
        <img
          src={terraTree}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-contain opacity-[0.12]"
          draggable={false}
        />
        {/* the growing portion, revealed from the roots upward */}
        <img
          src={terraTree}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 size-full object-contain"
          style={{
            clipPath: `inset(${hidden}% 0 0 0)`,
            transition: "clip-path 900ms ease",
          }}
        />
      </div>

      <figcaption className="mt-2 text-center">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-copper-ink uppercase">
          {STAGE_LABELS[stage]}
        </span>
      </figcaption>
    </figure>
  );
}
