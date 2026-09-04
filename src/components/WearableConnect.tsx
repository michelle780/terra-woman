import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  completeWearableConnection,
  disconnectWearable,
  getWearableStatus,
  syncWearable,
  type WearableProvider,
} from "@/lib/wearables.functions";

const NAMES: Record<WearableProvider, string> = { whoop: "Whoop", fitbit: "Fitbit" };

function waitForOAuthCompletion(popup: Window, provider: WearableProvider) {
  return new Promise<{ code: string; state: string }>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; provider?: string; code?: string | null; state?: string | null }
        | null;
      const type = data?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        data?.provider !== provider ||
        (type !== "wearableOAuthComplete" && type !== "wearableOAuthFailed")
      )
        return;
      cleanup();
      if (type === "wearableOAuthComplete" && data?.code && data?.state) {
        resolve({ code: data.code, state: data.state });
        return;
      }
      popup.close();
      reject(new Error(`${NAMES[provider]} connection failed.`));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error(`The ${NAMES[provider]} window closed before the connection finished.`));
    }, 500);
  });
}

export function WearableConnect({ provider, compact = false }: { provider: WearableProvider; compact?: boolean }) {
  const name = NAMES[provider];
  const qc = useQueryClient();
  const start = useServerFn(startWearableConnect);
  const complete = useServerFn(completeWearableConnection);
  const sync = useServerFn(syncWearable);
  const disconnect = useServerFn(disconnectWearable);
  const statusFn = useServerFn(getWearableStatus);

  const { data: status, isLoading } = useQuery({
    queryKey: ["wearable-status", provider],
    queryFn: () => statusFn({ data: { provider } }),
  });

  const connect = useMutation({
    mutationFn: async () => {
      const popup = window.open("", `terra-${provider}-oauth`, "width=620,height=760");
      if (!popup) throw new Error("Popup blocked — allow popups and try again.");
      let result: { code: string; state: string };
      try {
        const { authorizationUrl } = await start({ data: { provider } });
        const completion = waitForOAuthCompletion(popup, provider);
        popup.location.href = authorizationUrl;
        result = await completion;
      } catch (error) {
        popup.close();
        throw error;
      }
      await complete({ data: { provider, code: result.code, state: result.state } });
      return sync({ data: { provider, days: 30 } });
    },
    onSuccess: (synced) => {
      qc.invalidateQueries({ queryKey: ["wearable-status", provider] });
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      toast.success(`${name} connected — imported ${synced?.days ?? 0} days of data`);
    },
    onError: (error: Error) => toast.error(error.message || `Couldn't connect ${name}`),
  });

  const refresh = useMutation({
    mutationFn: () => sync({ data: { provider, days: 30 } }),
    onSuccess: (synced) => {
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      toast.success(`Synced ${synced.days} days from ${name}`);
    },
    onError: (error: Error) => toast.error(error.message || `${name} sync failed`),
  });

  const remove = useMutation({
    mutationFn: () => disconnect({ data: { provider } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wearable-status", provider] });
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      toast.success(`${name} disconnected`);
    },
  });

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Checking your {name} connection…</p>;
  }

  if (status && !status.configured) {
    return (
      <p className="text-xs text-muted-foreground">
        {name} sign-in isn't switched on for Terra Woman yet.
      </p>
    );
  }

  if (status?.connected) {
    return (
      <div className={compact ? "flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-2"}>
        <button
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
        >
          {refresh.isPending ? "Syncing…" : "Sync now"}
        </button>
        <button
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
          className="rounded-full bg-background px-4 py-1.5 text-xs font-bold ring-1 ring-line disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-2"}>
      <button
        onClick={() => connect.mutate()}
        disabled={connect.isPending}
        className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
      >
        {connect.isPending ? `Opening ${name}…` : `Connect ${name}`}
      </button>
    </div>
  );
}
