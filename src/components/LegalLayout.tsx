import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Shared chrome for the public /privacy and /terms pages.
 * These routes are reachable without signing in.
 */
export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="flex items-center gap-3">
          <Link
            to="/auth"
            className="grid size-9 place-items-center rounded-full bg-copper/15 ring-1 ring-copper/30"
            aria-label="Back to sign in"
          >
            <span className="size-2.5 rounded-full bg-copper" />
          </Link>
          <span className="font-display text-lg font-semibold">The Bigger Picture</span>
        </header>

        <article className="rise mt-6 rounded-[28px] bg-paper p-6 ring-1 ring-line sm:p-9">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-1 text-3xl leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated {updated}
          </p>
          <p className="mt-5 text-sm leading-relaxed text-foreground/90">{intro}</p>

          <div className="mt-7 space-y-7 text-sm leading-relaxed text-foreground/90">
            {children}
          </div>
        </article>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          The Bigger Picture is your personal wellness oasis · not medical advice
        </p>
      </div>
    </div>
  );
}

/**
 * Section heading + body block used inside LegalLayout.
 */
export function LegalSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-foreground">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed">{children}</p>;
}

export function LegalUl({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">{children}</ul>;
}

export function LegalContact({ email }: { email: string }) {
  return (
    <p className="rounded-2xl bg-cream px-4 py-3 text-sm ring-1 ring-line">
      Questions about this notice? Email{" "}
      <a className="font-semibold text-primary underline-offset-2 hover:underline" href={`mailto:${email}`}>
        {email}
      </a>
      .
    </p>
  );
}
