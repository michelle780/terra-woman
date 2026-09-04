/**
 * Life stages let Terra Woman meet a woman where she actually is —
 * trying to conceive, pregnant, feeding, in the perimenopause years, and beyond.
 * Everything here is reflective guidance, never medical advice.
 */

export type LifeStageValue =
  | "cycling"
  | "trying"
  | "pregnant"
  | "postpartum"
  | "perimenopause"
  | "menopause"
  | "postmenopause"
  | "unsure";

export type LifeStage = {
  value: LifeStageValue;
  label: string;
  hint: string;
  /** Short line shown at the top of her personalised card. */
  headline: string;
  /** What Terra Woman will lead with for her. */
  watchFor: string[];
  /** Gentle nudges, each pointing at a page she already has. */
  suggestions: { label: string; to: string }[];
};

export const LIFE_STAGES: LifeStage[] = [
  {
    value: "cycling",
    label: "Cycling as usual",
    hint: "Tracking my month as it comes",
    headline: "Your month has a shape — let's learn it together.",
    watchFor: ["Cycle phase", "Energy and mood swings", "Sleep and readiness"],
    suggestions: [
      { label: "Log this cycle", to: "/cycle" },
      { label: "How you feel today", to: "/journal" },
    ],
  },
  {
    value: "trying",
    label: "Trying to conceive",
    hint: "Hoping for a baby",
    headline: "Fertile-window clues live in your temperature, sleep and cycle.",
    watchFor: ["Cycle length and ovulation window", "Nightly temperature and HRV", "Stress and rest"],
    suggestions: [
      { label: "Update cycle dates", to: "/cycle" },
      { label: "Check readiness", to: "/trends" },
    ],
  },
  {
    value: "pregnant",
    label: "Pregnant",
    hint: "Growing a person",
    headline: "Rest, nausea and energy shift week to week — worth writing down.",
    watchFor: ["Sleep quality and resting heart rate", "Nausea, bloating and appetite", "Mood and anxiety"],
    suggestions: [
      { label: "Today's check-in", to: "/journal" },
      { label: "Prenatal vitamins & meds", to: "/medications" },
    ],
  },
  {
    value: "postpartum",
    label: "Postpartum or breastfeeding",
    hint: "Feeding, healing, adjusting",
    headline: "Broken sleep is expected — the pattern still tells you something.",
    watchFor: ["Sleep debt and recovery", "Mood, overwhelm and calm", "Return of your cycle"],
    suggestions: [
      { label: "Note how you feel", to: "/journal" },
      { label: "Watch recovery", to: "/trends" },
    ],
  },
  {
    value: "perimenopause",
    label: "Perimenopause",
    hint: "Things are changing",
    headline: "Irregular months, warm nights, shifting moods — patterns over weeks matter most.",
    watchFor: ["Cycle irregularity", "Night sleep and temperature", "Mood swings, anxiety and focus"],
    suggestions: [
      { label: "Track this cycle", to: "/cycle" },
      { label: "See your trends", to: "/trends" },
    ],
  },
  {
    value: "menopause",
    label: "Menopause",
    hint: "Around a year without a period",
    headline: "Sleep, steadiness and strength are the throughlines now.",
    watchFor: ["Sleep interruptions", "Hot flushes and mood", "HRV and resting heart rate"],
    suggestions: [
      { label: "Log today's symptoms", to: "/journal" },
      { label: "Review medications", to: "/medications" },
    ],
  },
  {
    value: "postmenopause",
    label: "Beyond menopause",
    hint: "Post-menopause and onward",
    headline: "This season is about energy, strength and long, steady sleep.",
    watchFor: ["Sleep and recovery", "Energy and movement", "Mood and focus"],
    suggestions: [
      { label: "See your trends", to: "/trends" },
      { label: "Today's check-in", to: "/journal" },
    ],
  },
  {
    value: "unsure",
    label: "Not sure yet",
    hint: "Still figuring it out",
    headline: "No labels needed — we'll follow whatever your days show.",
    watchFor: ["Sleep and readiness", "Mood and energy", "Anything you note"],
    suggestions: [
      { label: "Today's check-in", to: "/journal" },
      { label: "See your trends", to: "/trends" },
    ],
  },
];

export function getLifeStage(value: string | null | undefined): LifeStage | null {
  if (!value) return null;
  return LIFE_STAGES.find((s) => s.value === value) ?? null;
}
