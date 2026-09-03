/**
 * THE TERRA WOMAN TREE — visual architecture for the whole ROOTS archive.
 * Roots = inherited knowledge, trunk = accumulated knowledge,
 * branches = areas of women's health, leaves = individual stories.
 * MVP: static architecture with light hover interaction.
 */
import { useState } from "react";
import { Label, Meta, useReveal } from "@/components/roots/primitives";

export const PRIMARY_BRANCHES = [
  "BODY",
  "CYCLE",
  "BIRTH",
  "SEXUALITY",
  "HEALING",
  "MIND",
  "AGING",
  "SCIENCE",
  "COMMUNITY",
] as const;

export type BranchName = (typeof PRIMARY_BRANCHES)[number];

export function TerraWomanTree({
  counts = {},
  className = "",
}: {
  counts?: Partial<Record<BranchName, number>>;
  className?: string;
}) {
  const { ref, className: revealed } = useReveal<HTMLDivElement>();
  const [active, setActive] = useState<BranchName | null>(null);

  const cx = 400;
  const baseY = 470;
  const topY = 250;

  return (
    <div ref={ref} className={`roots-forest relative overflow-hidden ${revealed} ${className}`}>
      <svg viewBox="0 0 800 560" className="w-full text-background" fill="none" aria-hidden>
        {/* roots */}
        {[
          "M400 470v30c0 26-40 38-96 52-34 8-70 12-116 16",
          "M400 500c0 26 40 38 96 52 34 8 70 12 116 16",
          "M400 500c-14 24-40 34-72 44",
          "M400 500c14 24 40 34 72 44",
        ].map((d, i) => (
          <path
            key={d}
            d={d}
            stroke="currentColor"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.55"
            className="roots-draw-path"
            style={{ ["--roots-dash" as string]: 400, animationDelay: `${i * 0.2}s` }}
          />
        ))}

        {/* trunk */}
        <path
          d={`M${cx} ${baseY}V${topY}`}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="roots-draw-path"
          style={{ ["--roots-dash" as string]: 260, animationDelay: "0.6s" }}
        />

        {/* branches */}
        {PRIMARY_BRANCHES.map((name, i) => {
          const n = PRIMARY_BRANCHES.length;
          const t = i / (n - 1);
          const angle = -Math.PI * (0.12 + 0.76 * t);
          const len = 168 + (i % 3) * 22;
          const startY = topY + 66 - t * 20 + (i % 2) * 14;
          const ex = cx + Math.cos(angle) * len;
          const ey = startY + Math.sin(angle) * len;
          const isActive = active === name;
          const leaves = counts[name] ?? 0;
          return (
            <g
              key={name}
              onMouseEnter={() => setActive(name)}
              onMouseLeave={() => setActive(null)}
              className="cursor-default"
            >
              <path
                d={`M${cx} ${startY}Q${(cx + ex) / 2} ${startY - 26} ${ex} ${ey}`}
                stroke="currentColor"
                strokeWidth={isActive ? 1.4 : 0.9}
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.7}
                className="roots-draw-path transition-all"
                style={{ ["--roots-dash" as string]: 300, animationDelay: `${1 + i * 0.12}s` }}
              />
              {/* leaves = stories on this branch */}
              {Array.from({ length: Math.min(leaves, 8) }).map((_, li) => {
                const p = 0.45 + (li / 8) * 0.5;
                const lx = cx + (ex - cx) * p + (li % 2 ? 7 : -7);
                const ly = startY + (ey - startY) * p - 6;
                return (
                  <circle
                    key={li}
                    cx={lx}
                    cy={ly}
                    r={2}
                    fill="currentColor"
                    opacity={isActive ? 0.95 : 0.5}
                    className="roots-emerge"
                    style={{ animationDelay: `${1.6 + li * 0.1}s` }}
                  />
                );
              })}
              <text
                x={ex + (ex < cx ? -8 : 8)}
                y={ey - 8}
                textAnchor={ex < cx ? "end" : "start"}
                className="roots-label"
                fill="currentColor"
                opacity={isActive ? 1 : 0.75}
                style={{ fontSize: 9, letterSpacing: "0.22em" }}
              >
                {name}
              </text>
              {leaves > 0 && (
                <text
                  x={ex + (ex < cx ? -8 : 8)}
                  y={ey + 5}
                  textAnchor={ex < cx ? "end" : "start"}
                  fill="currentColor"
                  opacity="0.55"
                  style={{ fontSize: 8, letterSpacing: "0.14em" }}
                >
                  {leaves}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="grid gap-6 border-t border-background/15 p-8 sm:grid-cols-3">
        {[
          ["Roots / Deep history", "Ancient and inherited knowledge"],
          ["Trunk", "Accumulated women's knowledge"],
          ["Branches", "Women's health and lived experience"],
        ].map(([k, v]) => (
          <div key={k} className="grid gap-2">
            <Label className="text-background/70">{k}</Label>
            <Meta className="text-background/85 normal-case tracking-normal">{v}</Meta>
          </div>
        ))}
      </div>
    </div>
  );
}
