import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { TreeGrowth } from "@/components/TreeGrowth";
import { LIFE_STAGES } from "@/lib/life-stage";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to Terra Woman — set up your check-ins" },
      {
        name: "description",
        content:
          "A few gentle questions so Terra Woman meets you where you are: how often to nudge you, where to reach you, and what matters most right now.",
      },
      { property: "og:title", content: "Welcome to Terra Woman — set up your check-ins" },
      {
        property: "og:description",
        content: "Choose your check-in rhythm, preferred channel and focus areas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomePage,
});

const FREQUENCIES = [
  { value: "daily", label: "Every day", hint: "A steady daily rhythm" },
  { value: "weekdays", label: "Weekdays", hint: "Monday through Friday" },
  { value: "few_times_week", label: "A few times a week", hint: "Three-ish nudges" },
  { value: "weekly", label: "Once a week", hint: "A gentle weekly reset" },
  { value: "none", label: "No reminders", hint: "I'll come when I come" },
] as const;

const CHANNELS = [
  { value: "app", label: "In the app", hint: "A quiet card waiting for me" },
  { value: "email", label: "Email", hint: "A short note in my inbox" },
] as const;


const FOCUS = [
  "Sleep & recovery",
  "Energy",
  "Mood & emotions",
  "Stress & anxiety",
  "Cycle & hormones",
  "Medications & supplements",
  "Movement",
  "Astrology & moon",
] as const;

type Answers = {
  displayName: string;
  lifeStage: string;
  frequency: string;
  reminderTime: string;
  channel: string;
  focus: string[];
  notes: string;
};

const STEPS = ["Your name", "Your season", "Rhythm", "Where to meet you", "What matters", "Anything else"];

/** A woman healer or keeper of wellness for each step of the journey. */
const HEALER_WISDOM = [
  {
    quote:
      "In the 12th century, Hildegard von Bingen — abbess, herbalist and composer — wrote one of Europe's first medical texts on women's bodies, linking health to the whole of nature.",
    name: "Hildegard von Bingen",
    era: "1098 – 1179 · Germany",
  },
  {
    quote:
      "Midwife and healer Louyse Bourgeois wrote the first childbirth text authored by a woman, insisting that what women knew of their own bodies belonged in the record.",
    name: "Louyse Bourgeois",
    era: "1563 – 1636 · France",
  },
  {
    quote:
      "Trota of Salerno taught at Europe's first medical school and wrote on women's health — her work was so widely copied that 'Trotula' became a byword for women's medicine for centuries.",
    name: "Trota of Salerno",
    era: "11th century · Italy",
  },
  {
    quote:
      "For most of human history, birth was attended by women. The word 'midwife' simply means 'with woman' — a lineage of hands and knowledge passed woman to woman.",
    name: "The midwives",
    era: "Every century, everywhere",
  },
  {
    quote:
      "Denied entry to medical school as a woman, Elizabeth Garrett Anderson taught herself, qualified in 1865, then founded a hospital staffed entirely by women — for women.",
    name: "Elizabeth Garrett Anderson",
    era: "1836 – 1917 · England",
  },
  {
    quote:
      "In village after village, the 'wise woman' kept the remedies — willow bark for pain, raspberry leaf for the womb. Much of modern pharmacy traces back to what they already knew.",
    name: "The wise women",
    era: "The healers of yesteryear",
  },
] as const;

function WelcomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [a, setA] = useState<Answers>({
    displayName: "",
    lifeStage: "",
    frequency: "daily",
    reminderTime: "08:00",
    channel: "app",
    focus: [],
    notes: "",
  });

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

  // Already onboarded members should never sit on /welcome — send them home.
  useEffect(() => {
    if (user && profile?.onboarded_at) {
      navigate({ to: "/", replace: true });
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (!profile) return;
    setA((prev) => ({
      ...prev,
      displayName: profile.display_name ?? prev.displayName,
      lifeStage: profile.life_stage ?? prev.lifeStage,
      frequency: profile.checkin_frequency ?? prev.frequency,
      reminderTime: (profile.reminder_time ?? prev.reminderTime).slice(0, 5),
      channel: profile.preferred_channel ?? prev.channel,
      focus: profile.focus_areas?.length ? profile.focus_areas : prev.focus,
      notes: profile.onboarding_notes ?? prev.notes,
    }));
  }, [profile]);

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setA((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFocus(item: string) {
    setA((prev) => ({
      ...prev,
      focus: prev.focus.includes(item)
        ? prev.focus.filter((f) => f !== item)
        : [...prev.focus, item],
    }));
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    try {
      const onboardedAt = new Date().toISOString();
      const row = {
        id: user.id,
        display_name: a.displayName.trim() || null,
        life_stage: a.lifeStage || null,
        checkin_frequency: a.frequency,
        reminder_time: a.frequency === "none" ? null : `${a.reminderTime}:00`,
        preferred_channel: a.channel,
        contact_phone: null,
        focus_areas: a.focus,
        onboarding_notes: a.notes.trim() || null,
        onboarded_at: onboardedAt,
      };
      const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
      if (error) throw error;
      // Update the profile cache synchronously so AppShell's onboarding guard
      // never sees a stale row and bounces the member back to /welcome.
      queryClient.setQueryData(["profile", user.id], (old: Record<string, unknown> | null) => ({
        ...(old ?? {}),
        ...row,
      }));
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("You're all set. Welcome to Terra Woman.");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your preferences");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const last = step === STEPS.length - 1;
  const wisdom = HEALER_WISDOM[step] ?? HEALER_WISDOM[0]!;

  return (
    <div className="flex min-h-screen items-center bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-copper/15 ring-1 ring-copper/30">
              <span className="size-2 rounded-full bg-copper" />
            </div>
            <div className="font-display text-sm font-semibold uppercase leading-none tracking-[0.22em]">
              Terra Woman
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-copper-ink">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
        </div>

        <div className="mt-3 grid items-start gap-4 md:grid-cols-[300px_1fr] md:gap-6">
          {/* Left: greeting, growing tree, progress */}
          <div>
            <h1 className="font-display text-xl font-semibold leading-tight sm:text-3xl">
              Welcome{a.displayName ? `, ${a.displayName.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Five short prompts so this feels like your oasis. With each one your tree grows —
              roots first, the way the healers and midwives before us passed their knowing down.
            </p>

            <div className="mt-3 flex justify-center md:mt-4">
              <TreeGrowth step={step} total={STEPS.length} />
            </div>

            <div className="mt-3 flex gap-1.5" aria-hidden>
              {STEPS.map((label, i) => (
                <div
                  key={label}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-copper/70" : "bg-line"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right: the prompt card */}
          <div className="rounded-3xl bg-card p-4 ring-1 ring-line sm:p-5">
          {step === 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold">What should we call you?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Just a first name is perfect — it's only ever shown to you.
              </p>
              <input
                autoFocus
                value={a.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                placeholder="Your name"
                className="mt-3 w-full rounded-2xl bg-paper px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-copper/40"
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-semibold">
                Where are you in your journey right now?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Trying for a baby, pregnant, feeding, perimenopause or beyond — we'll lead with
                what matters in your season. You can change it any time.
              </p>
              <div className="mt-3 grid gap-1.5">
                {LIFE_STAGES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("lifeStage", s.value)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-2 text-left ring-1 transition-colors ${
                      a.lifeStage === s.value
                        ? "bg-copper/12 ring-copper/40"
                        : "bg-paper ring-line hover:bg-copper/10"
                    }`}
                  >
                    <span className="text-sm font-semibold">{s.label}</span>
                    <span className="text-xs text-muted-foreground">{s.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-semibold">
                How often would you like a nudge to check in?
              </h2>
              <div className="mt-3 grid gap-1.5">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => set("frequency", f.value)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-2 text-left ring-1 transition-colors ${
                      a.frequency === f.value
                        ? "bg-copper/12 ring-copper/40"
                        : "bg-paper ring-line hover:bg-copper/10"
                    }`}
                  >
                    <span className="text-sm font-semibold">{f.label}</span>
                    <span className="text-xs text-muted-foreground">{f.hint}</span>
                  </button>
                ))}
              </div>
              {a.frequency !== "none" && (
                <label className="mt-3 block">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Best time of day
                  </span>
                  <input
                    type="time"
                    value={a.reminderTime}
                    onChange={(e) => set("reminderTime", e.target.value)}
                    className="mt-1.5 w-40 rounded-2xl bg-paper px-4 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-copper/40"
                  />
                </label>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-xl font-semibold">Where do you like to be met?</h2>
              <div className="mt-3 grid gap-1.5">
                {CHANNELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set("channel", c.value)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-2 text-left ring-1 transition-colors ${
                      a.channel === c.value
                        ? "bg-copper/12 ring-copper/40"
                        : "bg-paper ring-line hover:bg-copper/10"
                    }`}
                  >
                    <span className="text-sm font-semibold">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.hint}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Email nudges are sent to the address you signed up with. Nothing is shared with
                anyone else.
              </p>

            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-display text-xl font-semibold">
                What matters most right now?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick as many as you like — we'll lead with these.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FOCUS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleFocus(item)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-colors ${
                      a.focus.includes(item)
                        ? "bg-copper/15 text-copper-ink ring-copper/40"
                        : "bg-paper text-muted-foreground ring-line hover:bg-copper/10"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-display text-xl font-semibold">
                Anything else we should know?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Conditions you're tracking, a goal for this season, how you want to feel. Private
                to you.
              </p>
              <textarea
                value={a.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                placeholder="I'm tracking perimenopause symptoms and want to feel steadier in the afternoons…"
                className="mt-5 w-full resize-none rounded-2xl bg-paper px-4 py-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-copper/40"
              />
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep(step - 1))}
              className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:underline"
            >
              {step === 0 ? "Skip for now" : "Back"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => (last ? finish() : setStep(step + 1))}
              className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {last ? (saving ? "Saving…" : "Enter my oasis") : "Continue"}
            </button>
          </div>

          {/* Women healers through the centuries — one per step */}
          <figure className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-copper/10 via-card to-sage/15 p-4 ring-1 ring-copper/25">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-2 left-3 font-display text-5xl leading-none text-copper/25"
            >
              "
            </span>
            <figcaption className="text-[10px] font-bold uppercase tracking-[0.18em] text-copper-ink">
              The women before us · Step {step + 1}
            </figcaption>
            <blockquote className="mt-1.5 font-display text-sm leading-snug font-medium sm:text-base">
              {wisdom.quote}
            </blockquote>
            <figcaption className="mt-1.5 text-[11px] text-muted-foreground">
              <span className="font-semibold text-copper-ink">{wisdom.name}</span>
              {" · "}
              {wisdom.era}
            </figcaption>
          </figure>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            For personal reflection only — not medical advice.
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
