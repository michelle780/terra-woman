/**
 * Shared ROOTS primitives — fine botanical linework, archival labels and the
 * slow, restrained reveal behaviour every ROOTS treatment shares.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Adds `roots-visible` once the element enters the viewport (once only). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return { ref, className: visible ? "roots-visible" : "" };
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`roots-label ${className}`}>{children}</span>;
}

export function Meta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`roots-meta ${className}`}>{children}</span>;
}

export function Rule({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-current opacity-20 ${className}`} />;
}

/** Tiny Terra Woman tree mark — roots, trunk, branches, moon. */
export function TerraMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
      <path d="M16 24V12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M16 14c-3-1.5-4.5-3.5-5-6M16 14c3-1.5 4.5-3.5 5-6" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M16 18c-2-1-3.5-2-4.5-3.5M16 18c2-1 3.5-2 4.5-3.5" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M16 24c-2 .6-3.6 1.6-4.8 3M16 24c2 .6 3.6 1.6 4.8 3M16 24v4" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M23 7.5a3.4 3.4 0 1 1-3-3.4 4 4 0 0 0 3 3.4Z" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

export function Signature({ variant = "dot" }: { variant?: "dot" | "slash" }) {
  return (
    <div className="flex items-center gap-2 opacity-70">
      <TerraMark className="size-3.5" />
      <Label>{variant === "slash" ? "ROOTS / TERRA WOMAN" : "ROOTS · TERRA WOMAN"}</Label>
    </div>
  );
}

/** Fine-line botanical sprig, drawn on reveal. */
export function Sprig({ className = "", leaves = 5 }: { className?: string; leaves?: number }) {
  return (
    <svg viewBox="0 0 60 160" fill="none" className={className} aria-hidden>
      <path
        d="M30 158C30 120 29 80 30 4"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        className="roots-draw-path"
        style={{ ["--roots-dash" as string]: 200 }}
      />
      {Array.from({ length: leaves }).map((_, i) => {
        const y = 132 - i * 24;
        const dir = i % 2 === 0 ? 1 : -1;
        return (
          <path
            key={i}
            d={`M30 ${y}c${dir * 12} -2 ${dir * 18} -8 ${dir * 20} -16c${dir * -13} 1 ${dir * -18} 7 ${dir * -20} 16Z`}
            stroke="currentColor"
            strokeWidth="0.7"
            fill="none"
            className="roots-emerge"
            style={{ animationDelay: `${0.6 + i * 0.22}s` }}
          />
        );
      })}
    </svg>
  );
}

/** A branch entering from the edge with a single leaf at its end. */
export function Branch({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 320 200"
      fill="none"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      <path
        d="M0 176C64 176 108 158 140 128c26-25 46-56 78-76"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        className="roots-draw-path"
        style={{ ["--roots-dash" as string]: 320 }}
      />
      <path
        d="M96 166c14-4 22-14 26-28-15 2-24 12-26 28ZM150 132c15-1 25-9 31-22-15-1-26 7-31 22Z"
        stroke="currentColor"
        strokeWidth="0.7"
        className="roots-emerge"
      />
      <path
        d="M218 52c9-9 12-22 9-35-11 8-15 21-9 35Z"
        stroke="currentColor"
        strokeWidth="0.8"
        className="roots-emerge"
        style={{ animationDelay: "1.5s" }}
      />
      <circle cx="218" cy="52" r="2" fill="currentColor" className="roots-emerge" style={{ animationDelay: "1.9s" }} />
    </svg>
  );
}

/** Spreading root system, drawn downward. */
export function RootLines({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 120" fill="none" className={className} aria-hidden>
      {[
        "M160 0v40c0 30-30 44-64 56-22 8-44 12-72 16",
        "M160 40c0 32 26 46 60 58 22 8 46 12 76 16",
        "M160 44c-6 26-22 40-44 52",
        "M160 44c6 26 22 40 44 52",
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth="0.7"
          strokeLinecap="round"
          className="roots-draw-path"
          style={{ ["--roots-dash" as string]: 320, animationDelay: `${i * 0.25}s` }}
        />
      ))}
    </svg>
  );
}

/** Archival image frame — no fake aging, just a rights-aware container. */
export function ArchivalImage({
  url,
  alt,
  className = "",
  imgClassName = "",
}: {
  url: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className={`size-full object-cover roots-resolve ${imgClassName}`}
        draggable={false}
      />
    </div>
  );
}

/** Shown wherever an archival image would sit but rights are not recorded. */
export function RightsPending({ tone = "ink" }: { tone?: "ink" | "cream" }) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed p-6 text-center ${
        tone === "cream" ? "border-background/30 text-background/70" : "border-foreground/20 text-muted-foreground"
      }`}
    >
      <TerraMark className="size-6 opacity-60" />
      <Meta>Archival image withheld</Meta>
      <span className="max-w-[22ch] text-[10px] leading-relaxed opacity-80">
        No image is shown until source, credit and rights status are recorded.
      </span>
    </div>
  );
}
