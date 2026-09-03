/**
 * TreeGrowth — a fine-line tree of life that grows from roots to full canopy
 * as the welcome series progresses. A nod to the herbalists, midwives and
 * healers whose knowledge was passed down woman to woman.
 */

const STAGE_LABELS = [
  "Roots — where you come from",
  "Seedling — a first stirring",
  "Trunk — steady ground",
  "Branches — what you reach for",
  "Canopy — the whole picture",
];

export function TreeGrowth({ step, total }: { step: number; total: number }) {
  // step is 0-indexed; stage 0 = roots only, stage 4 = full tree in leaf.
  const stage = Math.max(0, Math.min(STAGE_LABELS.length - 1, step));
  const on = (from: number) => (stage >= from ? 1 : 0);
  const growth = (stage + 1) / total;

  return (
    <figure className="m-0 flex flex-col items-center">
      <svg
        viewBox="0 0 220 260"
        role="img"
        aria-label={`Growth stage ${stage + 1} of ${STAGE_LABELS.length}: ${STAGE_LABELS[stage]}`}
        className="h-44 w-auto text-copper sm:h-52"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* soil line */}
          <line
            x1="30"
            y1="176"
            x2="190"
            y2="176"
            strokeDasharray="1 5"
            opacity="0.45"
          />

          {/* roots — always present */}
          <g opacity="0.85" style={{ transition: "opacity 700ms ease" }}>
            <path d="M110 176 C108 196 100 206 88 216 C80 222 74 228 70 238" />
            <path d="M110 176 C112 196 120 206 132 216 C140 222 146 228 150 238" />
            <path d="M110 178 C110 200 109 216 110 236" />
            <path d="M104 196 C96 200 88 202 79 202" />
            <path d="M116 196 C124 200 132 202 141 202" />
            <path d="M99 214 C92 218 86 222 82 228" />
            <path d="M121 214 C128 218 134 222 138 228" />
            <circle cx="70" cy="240" r="1.6" fill="currentColor" stroke="none" opacity="0.7" />
            <circle cx="150" cy="240" r="1.6" fill="currentColor" stroke="none" opacity="0.7" />
            <circle cx="110" cy="238" r="1.6" fill="currentColor" stroke="none" opacity="0.7" />
          </g>

          {/* trunk — grows upward with each stage */}
          <g>
            <path
              d="M110 176 C107 150 107 128 110 104"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - Math.max(0.18, growth)}
              style={{ transition: "stroke-dashoffset 900ms ease" }}
            />
            <path
              d="M114 176 C117 152 117 130 114 108"
              opacity={0.5 * on(1)}
              style={{ transition: "opacity 700ms ease" }}
            />
          </g>

          {/* first shoots */}
          <g opacity={on(1)} style={{ transition: "opacity 700ms ease 120ms" }}>
            <path d="M110 138 C99 132 92 126 88 118" />
            <path d="M111 132 C121 127 128 121 132 114" />
            <path d="M88 118 C84 116 81 113 79 109" opacity="0.6" />
            <path d="M132 114 C136 112 139 109 141 105" opacity="0.6" />
          </g>

          {/* lower branches */}
          <g opacity={on(2)} style={{ transition: "opacity 700ms ease 120ms" }}>
            <path d="M110 116 C94 108 82 98 74 84" />
            <path d="M112 112 C128 105 140 96 149 83" />
            <path d="M80 92 C74 88 70 82 68 75" opacity="0.7" />
            <path d="M142 91 C148 87 152 81 154 74" opacity="0.7" />
          </g>

          {/* upper branches */}
          <g opacity={on(3)} style={{ transition: "opacity 700ms ease 120ms" }}>
            <path d="M110 104 C104 88 100 74 101 58" />
            <path d="M111 100 C118 86 124 74 126 60" />
            <path d="M101 72 C93 66 87 60 83 52" opacity="0.75" />
            <path d="M124 74 C132 68 138 62 142 54" opacity="0.75" />
            <path d="M110 82 C110 72 110 64 110 54" opacity="0.6" />
          </g>

          {/* canopy */}
          <g opacity={on(4)} style={{ transition: "opacity 900ms ease 150ms" }}>
            <path d="M110 52 C74 52 52 70 52 90 C52 104 62 114 74 118" opacity="0.55" />
            <path d="M110 52 C146 52 168 70 168 90 C168 104 158 114 146 118" opacity="0.55" />
            <path d="M74 118 C86 124 98 126 110 126 C122 126 134 124 146 118" opacity="0.35" />
            <circle cx="110" cy="40" r="9" opacity="0.5" />
            <circle cx="110" cy="40" r="3.2" fill="currentColor" stroke="none" opacity="0.6" />
          </g>

          {/* leaves appear one cluster per stage */}
          {[
            { x: 88, y: 118, from: 1 },
            { x: 132, y: 114, from: 1 },
            { x: 68, y: 75, from: 2 },
            { x: 154, y: 74, from: 2 },
            { x: 83, y: 52, from: 3 },
            { x: 142, y: 54, from: 3 },
            { x: 101, y: 58, from: 3 },
            { x: 126, y: 60, from: 3 },
            { x: 60, y: 100, from: 4 },
            { x: 160, y: 100, from: 4 },
          ].map((leaf, i) => (
            <ellipse
              key={i}
              cx={leaf.x}
              cy={leaf.y}
              rx="5.5"
              ry="2.6"
              transform={`rotate(${i % 2 === 0 ? -32 : 32} ${leaf.x} ${leaf.y})`}
              fill="currentColor"
              stroke="none"
              opacity={on(leaf.from) * 0.35}
              style={{ transition: "opacity 800ms ease 200ms" }}
            />
          ))}
        </g>
      </svg>

      <figcaption className="mt-2 text-center">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-copper-ink uppercase">
          {STAGE_LABELS[stage]}
        </span>
      </figcaption>
    </figure>
  );
}
