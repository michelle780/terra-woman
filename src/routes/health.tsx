import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import { AppShell } from "@/components/AppShell";
import { Cycle } from "./cycle";
import { Medications } from "./medications";
import { Journal } from "./journal";
import { Devices } from "./devices";
import { AppleHealth } from "./apple-health";

export const Route = createFileRoute("/health")({
  head: () => ({
    title: "Health — Terra Woman",
    meta: [
      {
        name: "description",
        content:
          "Your cycle, medications, symptoms and devices in one calm place — see how your body moves together.",
      },
    ],
  }),
  component: Health,
});

type TabId = "cycle" | "meds" | "journal" | "devices";

const TABS: { id: TabId; label: string; Component: ComponentType }[] = [
  { id: "cycle", label: "Cycle", Component: Cycle },
  { id: "meds", label: "Medications", Component: Medications },
  { id: "journal", label: "Journal & symptoms", Component: Journal },
  { id: "devices", label: "Devices", Component: Devices },
];

function Health() {
  const [active, setActive] = useState<TabId>("cycle");
  const Active = TABS.find((t) => t.id === active)!.Component;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Health
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cycle, medications, symptoms and devices — your body, in one place.
        </p>
      </div>

      <nav className="flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold ring-1 ring-line backdrop-blur-md transition-colors"
            style={
              active === t.id
                ? {
                    background: "rgb(var(--sky) / 0.2)",
                    color: "rgb(var(--foreground))",
                    boxShadow: "0 0 0 1px rgb(var(--sky) / 0.3) inset",
                  }
                : {
                    background: "rgb(var(--paper) / 0.7)",
                    color: "rgb(var(--muted-foreground))",
                  }
            }
          >
            {t.label}
          </button>
        ))}
        <Link
          to="/apple-health"
          className="rounded-full bg-paper/70 px-4 py-1.5 text-xs font-semibold text-muted-foreground ring-1 ring-line backdrop-blur-md transition-colors hover:bg-paper"
        >
          Apple Health import
        </Link>
      </nav>

      <div className="rounded-3xl bg-paper/60 p-4 ring-1 ring-line backdrop-blur-md sm:p-6">
        <Active />
      </div>
    </div>
  );
}
