import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const OURA_CONNECTOR_ID = "oura";
const OURA_SCOPES = ["personal", "daily", "heartrate", "workout"];

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const startOuraConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientKey = process.env['OURA_APP_USER_CONNECTOR_CLIENT_API_KEY'];
    if (!clientKey) {
      throw new Error("Oura is not configured yet. Link the Oura connector client first.");
    }
    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const url = new URL(request.url);
    const sandboxHost =
      url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL(
      "/oauth/oura/return",
      sandboxHost ? `https://${sandboxHost}` : url.origin,
    ).toString();

    const { authorizeAppUserOAuth } = await import("@/integrations/lovable/appUserConnector");
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const existing = await getConnectionKeyForUser(context.userId, OURA_CONNECTOR_ID);

    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: OURA_CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl,
      connectionAPIKey: existing ?? undefined,
      credentialsConfiguration: { scopes: OURA_SCOPES },
    });
    return { authorizationUrl };
  });

export const completeOuraConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data, context }) => {
    const { exchangeAppUserOAuthCode } = await import("@/integrations/lovable/appUserConnector");
    const { saveConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
      GATEWAY_BASE_URL,
      data.code,
    );
    if (connectorId !== OURA_CONNECTOR_ID) {
      throw new Error("OAuth completion returned the wrong connector");
    }
    await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);

    await context.supabase.from("device_connections").upsert(
      { user_id: context.userId, provider: OURA_CONNECTOR_ID, status: "connected" },
      { onConflict: "user_id,provider" },
    );
    return { ok: true };
  });

export const getOuraStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const configured = !!process.env['OURA_APP_USER_CONNECTOR_CLIENT_API_KEY'];
    if (!configured) return { configured: false, connected: false };
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const key = await getConnectionKeyForUser(context.userId, OURA_CONNECTOR_ID);
    return { configured: true, connected: !!key };
  });

type MetricRow = {
  user_id: string;
  metric_date: string;
  source: string;
  sleep_minutes?: number | null;
  sleep_score?: number | null;
  readiness?: number | null;
  hrv?: number | null;
  resting_hr?: number | null;
  steps?: number | null;
};

export const syncOura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { days?: number } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const { callAsAppUser } = await import("@/integrations/lovable/appUserConnector");
    const connectionAPIKey = await getConnectionKeyForUser(context.userId, OURA_CONNECTOR_ID);
    if (!connectionAPIKey) throw new Error("Oura is not connected for this account yet.");

    const days = Math.min(Math.max(data.days ?? 30, 1), 180);
    const end = new Date();
    const start = new Date(end.getTime() - days * 86_400_000);
    // Oura publishes today's documents against tomorrow's boundary in some
    // timezones, so ask one day past today or the newest night is missed.
    const endPlusOne = new Date(end.getTime() + 86_400_000);
    const range = `start_date=${dateKey(start)}&end_date=${dateKey(endPlusOne)}`;


    async function get(path: string): Promise<{ data?: unknown[] }> {
      const res = await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey: connectionAPIKey!,
        connectorId: OURA_CONNECTOR_ID,
        path,
      });
      if (res.status === 403 || res.status === 401) {
        throw new Error("Oura access was declined or revoked — reconnect your ring.");
      }
      if (!res.ok) throw new Error(`Oura request failed (${res.status})`);
      return (await res.json()) as { data?: unknown[] };
    }

    const [dailySleep, readiness, activity, sleep] = await Promise.all([
      get(`/v2/usercollection/daily_sleep?${range}`),
      get(`/v2/usercollection/daily_readiness?${range}`),
      get(`/v2/usercollection/daily_activity?${range}`),
      get(`/v2/usercollection/sleep?${range}`),
    ]);

    const byDay = new Map<string, MetricRow>();
    const row = (day: string): MetricRow => {
      let r = byDay.get(day);
      if (!r) {
        r = { user_id: context.userId, metric_date: day, source: "oura" };
        byDay.set(day, r);
      }
      return r;
    };

    for (const item of (dailySleep.data ?? []) as { day?: string; score?: number }[]) {
      if (item.day) row(item.day).sleep_score = item.score ?? null;
    }
    for (const item of (readiness.data ?? []) as { day?: string; score?: number }[]) {
      if (item.day) row(item.day).readiness = item.score ?? null;
    }
    for (const item of (activity.data ?? []) as { day?: string; steps?: number }[]) {
      if (item.day) row(item.day).steps = item.steps ?? null;
    }
    for (const item of (sleep.data ?? []) as {
      day?: string;
      type?: string;
      total_sleep_duration?: number;
      average_hrv?: number;
      lowest_heart_rate?: number;
      average_heart_rate?: number;
    }[]) {
      if (!item.day || (item.type && item.type !== "long_sleep")) continue;
      const r = row(item.day);
      if (item.total_sleep_duration != null) {
        r.sleep_minutes = Math.round(item.total_sleep_duration / 60);
      }
      if (item.average_hrv != null) r.hrv = Math.round(item.average_hrv);
      const hr = item.lowest_heart_rate ?? item.average_heart_rate;
      if (hr != null) r.resting_hr = Math.round(hr);
    }

    const rows = [...byDay.values()];
    if (rows.length > 0) {
      // Merge over what's already stored: Oura publishes readiness/sleep score
      // before the detailed sleep and activity documents, so a partial sync
      // must never blank numbers that already arrived.
      const { data: existing } = await context.supabase
        .from("daily_metrics")
        .select("metric_date, sleep_minutes, sleep_score, readiness, hrv, resting_hr, steps")
        .eq("user_id", context.userId)
        .in("metric_date", rows.map((r) => r.metric_date));

      const prior = new Map((existing ?? []).map((r) => [r.metric_date, r]));
      const merged = rows.map((r) => {
        const before = prior.get(r.metric_date);
        if (!before) return r;
        const keys = [
          "sleep_minutes",
          "sleep_score",
          "readiness",
          "hrv",
          "resting_hr",
          "steps",
        ] as const;
        const out: MetricRow = { ...r };
        for (const k of keys) {
          if (out[k] == null && before[k] != null) out[k] = before[k];
        }
        return out;
      });

      const { error } = await context.supabase
        .from("daily_metrics")
        .upsert(merged, { onConflict: "user_id,metric_date" });
      if (error) throw error;
    }


    const syncedAt = new Date().toISOString();
    await context.supabase.from("device_connections").upsert(
      {
        user_id: context.userId,
        provider: OURA_CONNECTOR_ID,
        status: "connected",
        last_synced_at: syncedAt,
      },
      { onConflict: "user_id,provider" },
    );

    return { days: rows.length, syncedAt };
  });

export const disconnectOura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser, deleteConnectionForUser } = await import(
      "@/server/appUserConnections.server"
    );
    const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
    const key = await getConnectionKeyForUser(context.userId, OURA_CONNECTOR_ID);
    if (key) {
      try {
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey: key,
          connectorId: OURA_CONNECTOR_ID,
        });
      } catch {
        // Already revoked upstream — still clear our local copy.
      }
      await deleteConnectionForUser(context.userId, OURA_CONNECTOR_ID);
    }
    await context.supabase
      .from("device_connections")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", OURA_CONNECTOR_ID);
    return { ok: true };
  });
