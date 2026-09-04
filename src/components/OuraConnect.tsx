import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  completeOuraConnection,
  disconnectOura,
  getOuraStatus,
  startOuraConnect,
  syncOura,
} from "@/lib/oura.functions";

function waitForOAuthCompletion(popup: Window) {
  return new Promise<string | null>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const type = (event.data as { type?: string } | null)?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        (event.data as { connectorId?: string } | null)?.connectorId !== "oura" ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      )
        return;
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        const code = (event.data as { code?: unknown }).code;
        resolve(typeof code === "string" ? code : null);
        return;
      }
      popup.close();
      reject(new Error("Oura connection failed."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The Oura window closed before the connection finished."));
    }, 500);
  });
}

export function useOuraStatus() {
  const status = useServerFn(getOuraStatus);
  return useQuery({ queryKey: ["oura-status"], queryFn: () => status() });
}

export function OuraConnect({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const start = useServerFn(startOuraConnect);
  const complete = useServerFn(completeOuraConnection);
  const sync = useServerFn(syncOura);
  const disconnect = useServerFn(disconnectOura);
  const { data: status, isLoading } = useOuraStatus();

  const connect = useMutation({
    mutationFn: async () => {
      const popup = window.open("", "terra-oura-oauth", "width=620,height=760");
      if (!popup) throw new Error("Popup blocked — allow popups and try again.");
      let code: string | null;
      try {
        const { authorizationUrl } = await start();
        const completion = waitForOAuthCompletion(popup);
        popup.location.href = authorizationUrl;
        code = await completion;
      } catch (error) {
        popup.close();
        throw error;
      }
      if (code) await complete({ data: { code } });
      return sync({ data: { days: 30 } });
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["oura-status"] });
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      toast.success(`Oura connected — imported ${result?.days ?? 0} days of your ring data`);
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't connect Oura"),
  });

  const refresh = useMutation({
    mutationFn: () => sync({ data: { days: 30 } }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      toast.success(`Synced ${result.days} days from your ring`);
    },
    onError: (error: Error) => toast.error(error.message || "Oura sync failed"),
  });

  const remove = useMutation({
    mutationFn: () => disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oura-status"] });
      qc.invalidateQueries({ queryKey: ["device-connections"] });
      toast.success("Oura disconnected");
    },
  });

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Checking your Oura connection…</p>;
  }

  if (status && !status.configured) {
    return (
      <p className="text-xs text-muted-foreground">
        Oura sign-in isn't switched on for Terra Woman yet.
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
        {connect.isPending ? "Opening Oura…" : "Connect your Oura ring"}
      </button>
    </div>
  );
}
