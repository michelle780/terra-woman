import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { OuraConnect, useOuraStatus } from "@/components/OuraConnect";
import { useAuth } from "@/lib/auth";
import { fetchDeviceConnections } from "@/lib/wellness";


export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Devices & APIs — Terra Woman wellness tracker" },
      {
        name: "description",
        content:
          "Connect Oura, Apple Health, Fitbit, Garmin, Whoop, Google Fit or your own API source so your sleep, recovery and activity data flows into Terra Woman.",
      },
      { property: "og:title", content: "Devices & APIs — Terra Woman wellness tracker" },
      {
        property: "og:description",
        content: "Manage the devices and data sources that populate your Terra Woman dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Devices />
    </AppShell>
  ),
});

const PROVIDERS = [
  { id: "oura", name: "Oura Ring", blurb: "Sleep stages, readiness, HRV and resting heart rate." },
  { id: "apple_health", name: "Apple Watch / Health", blurb: "Steps, workouts, heart rate and sleep." },
  { id: "fitbit", name: "Fitbit", blurb: "Sleep score, steps and resting heart rate." },
  { id: "garmin", name: "Garmin", blurb: "Body battery, stress, activity and sleep." },
  { id: "whoop", name: "Whoop", blurb: "Strain, recovery and sleep performance." },
  { id: "google_fit", name: "Google Fit / Health Connect", blurb: "Android activity and sleep data." },
];

function label(id: string): string {
  return PROVIDERS.find((p) => p.id === id)?.name ?? id;
}

function Devices() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [custom, setCustom] = useState("");

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["device-connections"],
    queryFn: fetchDeviceConnections,
  });

  const byProvider = new Map(connections.map((c) => [c.provider, c]));
  const { data: ouraStatus } = useOuraStatus();
  const ouraConnected = !!ouraStatus?.connected;


  const connect = useMutation({
    mutationFn: async (provider: string) => {
      const { error } = await supabase
        .from("device_connections")
        .upsert(
          { user_id: user!.id, provider, status: "pending" },
          { onConflict: "user_id,provider" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      toast.success("Source added — we'll pull data as soon as its API is linked");
    },
    onError: () => toast.error("Couldn't add that source — try again"),
  });

  const sync = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("device_connections")
        .update({ status: "connected", last_synced_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      toast.success("Marked as synced");
    },
  });

  const disconnect = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("device_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      toast.success("Source removed");
    },
  });

  const extras = connections.filter((c) => !PROVIDERS.some((p) => p.id === c.provider));

  return (
    <div className="mt-5 grid gap-5">
      <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <p className="eyebrow">Data sources</p>
        <h1 className="mt-0.5 text-2xl">Devices & APIs</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Add the devices and services you want feeding Terra Woman. Adding a source saves it to your
          private account; you can mark a sync whenever you bring data in manually, and live API
          pulls will use the same list once each provider is authorised.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {PROVIDERS.map((p) => {
          const conn = byProvider.get(p.id);
          const isOura = p.id === "oura";
          const connected = isOura ? ouraConnected : conn?.status === "connected";
          return (
            <div key={p.id} className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg">{p.name}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    conn || connected ? "bg-sage/25 text-foreground" : "bg-background text-muted-foreground"
                  }`}
                >
                  {connected ? "Connected" : conn ? "Pending" : "Not linked"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.blurb}</p>
              {isOura && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  You'll sign in to your own Oura account — only your ring data comes into your
                  private Terra Woman account.
                </p>
              )}
              {isApple && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Apple keeps Health data on your iPhone, so there's no web sign-in — enter your
                  numbers here and they join the same private timeline.
                </p>
              )}
              {conn?.last_synced_at && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Last sync {new Date(conn.last_synced_at).toLocaleString()}
                </p>
              )}
              {isOura ? (
                <div className="mt-4">
                  <OuraConnect compact />
                </div>
              ) : isApple ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/apple-health"
                    className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
                  >
                    {conn ? "Add today's numbers" : "Start entering data"}
                  </Link>
                  {conn && (
                    <button
                      onClick={() => disconnect.mutate(conn.id)}
                      className="rounded-full bg-background px-4 py-1.5 text-xs font-bold ring-1 ring-line"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (

                <div className="mt-4 flex flex-wrap gap-2">
                  {conn ? (
                    <>
                      <button
                        onClick={() => sync.mutate(conn.id)}
                        className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
                      >
                        Mark synced
                      </button>
                      <button
                        onClick={() => disconnect.mutate(conn.id)}
                        className="rounded-full bg-background px-4 py-1.5 text-xs font-bold ring-1 ring-line"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => connect.mutate(p.id)}
                      disabled={connect.isPending}
                      className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    >
                      Connect
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>


      <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
        <h2 className="text-xl">Another API or device</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Using something else — a smart scale, CGM, a lab portal or your own script? Name it here
          and it will show up as one of your sources.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. Withings scale"
            className="min-w-[220px] flex-1 rounded-2xl bg-background px-4 py-2.5 text-sm ring-1 ring-line focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button
            onClick={() => {
              const name = custom.trim();
              if (!name) return;
              connect.mutate(name.toLowerCase().replace(/\s+/g, "_"));
              setCustom("");
            }}
            className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground"
          >
            Add source
          </button>
        </div>
        {isLoading ? null : extras.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {extras.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3 ring-1 ring-line"
              >
                <span className="text-sm font-semibold">{label(c.provider)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => sync.mutate(c.id)}
                    className="rounded-full bg-paper px-4 py-1.5 text-xs font-bold ring-1 ring-line"
                  >
                    Mark synced
                  </button>
                  <button
                    onClick={() => disconnect.mutate(c.id)}
                    className="rounded-full bg-paper px-4 py-1.5 text-xs font-bold text-muted-foreground ring-1 ring-line"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 text-[11px] text-muted-foreground">
          Terra Woman never asks for device passwords, and your source list is visible only to you.
        </p>
      </section>
    </div>
  );
}
