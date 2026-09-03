import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/Landing";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [
      { title: "You're invited to The Bigger Picture — a private wellness log" },
      {
        name: "description",
        content:
          "A friend invited you to The Bigger Picture. Set up your own private log for sleep, energy, symptoms, medications and daily mood.",
      },
      { property: "og:title", content: "You're invited to The Bigger Picture" },
      {
        property: "og:description",
        content: "Set up your own private daily wellness log — sleep, mood, symptoms and meds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Landing invitedBy="A friend" />,
});
