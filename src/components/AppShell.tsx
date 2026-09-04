import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import terraTree from "@/assets/terra-tree.png";
import { fetchIsAdmin, fetchIsEditor } from "@/lib/roots";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { WelcomeTour } from "@/components/WelcomeTour";


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
    <span className="hidden items-center gap-1.5 rounded-full bg-paper/70 px-3 py-1.5 text-xs font-semibold ring-1 ring-line backdrop-blur-md sm:inline-flex">
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

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: isEditor } = useQuery({
    queryKey: ["is-editor", user?.id],
    enabled: !!user,
    queryFn: () => fetchIsEditor(user!.id),
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: () => fetchIsAdmin(user!.id),
  });

  useEffect(() => {
    if (user && profile !== undefined && !profile?.onboarded_at) {
      navigate({ to: "/welcome", replace: true });
    }
  }, [user, profile, navigate]);

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
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <img
          src={terraTree}
          alt=""
          width={1005}
          height={1007}
          className="h-[92vh] w-auto max-w-none opacity-[0.22]"
        />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-copper/15 ring-1 ring-copper/30">
              <span className="size-2.5 rounded-full bg-copper" />
            </div>
            <div className="leading-none">
              <div className="font-display text-base font-semibold uppercase tracking-[0.22em] leading-none text-foreground">
                Terra Woman
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
            <span className="grid size-9 place-items-center rounded-full bg-paper/70 text-xs font-bold ring-1 ring-line backdrop-blur-md">
              {initial}
            </span>
          </div>
        </header>

        {user && <AnnouncementBanner />}

        <nav className="mt-4 flex gap-1.5 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full bg-paper/70 px-4 py-1.5 text-xs font-semibold text-muted-foreground ring-1 ring-line backdrop-blur-md transition-colors"
              activeProps={{ className: "bg-sky/20 text-foreground ring-sky/30 backdrop-blur-md" }}
            >
              {item.label}
            </Link>
          ))}
          {isEditor && (
            <>
              <Link
                to="/admin/roots"
                className="rounded-full bg-copper/10 px-4 py-1.5 text-xs font-semibold text-copper-ink ring-1 ring-copper/30 transition-colors"
                activeProps={{ className: "bg-copper/25 text-foreground" }}
              >
                ROOTS
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/members"
                  className="rounded-full bg-copper/10 px-4 py-1.5 text-xs font-semibold text-copper-ink ring-1 ring-copper/30 transition-colors"
                  activeProps={{ className: "bg-copper/25 text-foreground" }}
                >
                  MEMBERS
                </Link>
              )}
            </>
          )}
        </nav>

        <main className="tree-spine md:pl-8">{children}</main>

        <p className="mt-6 pb-4 text-center text-[11px] text-muted-foreground">
          Terra Woman · See yourself whole · not medical advice ·{" "}
          <Link to="/welcome" className="font-semibold hover:underline">Preferences</Link>{" "}
          ·{" "}
          <Link to="/about" className="font-semibold hover:underline">Our story</Link>{" "}
          ·{" "}
          <Link to="/privacy" className="font-semibold hover:underline">Privacy</Link>{" "}
          ·{" "}
          <Link to="/terms" className="font-semibold hover:underline">Terms</Link>
        </p>
      </div>
      <FeedbackWidget />
      <WelcomeTour enabled={!!profile?.onboarded_at} />

    </div>
  );
}
