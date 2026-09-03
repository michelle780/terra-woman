import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Terra Woman wellness tracker" },
      {
        name: "description",
        content:
          "Sign in to Terra Woman to track sleep, readiness, HRV, medications and daily symptoms in one private log.",
      },
      { property: "og:title", content: "Sign in — Terra Woman wellness tracker" },
      {
        property: "og:description",
        content: "Your private daily wellness log for ring, watch and medication data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [loading, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-copper/15 ring-1 ring-copper/30">
            <span className="size-2.5 rounded-full bg-copper" />
          </div>
          <span className="font-display text-lg font-semibold">Terra Woman</span>
        </div>

        <div className="rise mt-4 rounded-[28px] bg-paper p-6 ring-1 ring-line">
          <p className="eyebrow">{mode === "signin" ? "Welcome back" : "Get started"}</p>
          <h1 className="mt-1 text-3xl leading-tight">
            {mode === "signin" ? "Step back into your oasis" : "Create your wellness oasis"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sleep, readiness, HRV, medications and how you actually felt — kept privately in one
            place.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-background px-4 py-2.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-background px-4 py-2.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={onGoogle}
            className="mt-3 w-full rounded-2xl bg-background px-4 py-2.5 text-sm font-semibold ring-1 ring-line transition-colors hover:bg-cream"
          >
            Continue with Google
          </button>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "No account yet? Create one"
              : "Already have an account? Sign in"}
          </button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/terms" className="font-semibold text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
