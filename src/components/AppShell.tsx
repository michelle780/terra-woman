import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Today" },
  { to: "/trends", label: "Trends" },
  { to: "/astrology", label: "Astrology & Moon" },
  { to: "/cycle", label: "Cycle" },
  { to: "/medications", label: "Meds" },
  { to: "/journal", label: "Journal" },
  { to: "/devices", label: "Devices" },
] as const;

function DeviceChip({ label }: { label: string }) {
  return (
    <span className="hidden items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-semibold ring-1 ring-line sm:inline-flex">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
      {label}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
    } catch {
      // Ignore: local session is cleared below regardless.
    }
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Already cleared.
    }
    navigate({ to: "/auth", replace: true });
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-sm text-muted-foreground">Loading your day…</p>
      </div>
    );
  }

  const initial = (user.email ?? "?").charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-copper/15 ring-1 ring-copper/30">
              <span className="size-2.5 rounded-full bg-copper" />
            </div>
            <div className="leading-none">
              <div className="font-display text-lg font-semibold leading-none text-foreground">
                The Bigger Picture
              </div>
              <div className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">
                your calm, empowering oasis · {today}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DeviceChip label="Oura" />
            <DeviceChip label="Apple Watch" />
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber/25 px-3 py-1.5 text-xs font-bold ring-1 ring-amber/40 transition-colors hover:bg-amber/40 disabled:opacity-60"
              title="Sign out"
            >
              <LogOut className="size-4" aria-hidden />
              <span>{signingOut ? "Signing out…" : "Sign out"}</span>
            </button>
            <span className="grid size-9 place-items-center rounded-full bg-paper text-xs font-bold ring-1 ring-line">
              {initial}
            </span>
          </div>
        </header>

        <nav className="mt-4 flex gap-1.5 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full bg-paper px-4 py-1.5 text-xs font-semibold text-muted-foreground ring-1 ring-line transition-colors"
              activeProps={{ className: "bg-sky/20 text-foreground ring-sky/30" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main>{children}</main>

        <p className="mt-6 pb-4 text-center text-[11px] text-muted-foreground">
          The Bigger Picture is a personal wellness log · not medical advice ·{" "}
          <Link to="/privacy" className="font-semibold hover:underline">Privacy</Link>{" "}
          ·{" "}
          <Link to="/terms" className="font-semibold hover:underline">Terms</Link>
        </p>
      </div>
    </div>
  );
}
