import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Direct (free) wearable OAuth for providers with no Lovable App User Connector:
// Whoop (developer.whoop.com) and Fitbit (dev.fitbit.com).
// Client credentials come from server env vars the owner sets after registering
// a developer app with each provider.

export type WearableProvider = "whoop" | "fitbit";

const PROVIDERS: Record<
  WearableProvider,
  {
    authUrl: string;
    tokenUrl: string;
    apiBase: string;
    scopes: string;
    clientIdEnv: string;
    clientSecretEnv: string;
    basicAuth: boolean; // Fitbit requires HTTP Basic on token calls
    displayName: string;
  }
> = {
  whoop: {
    authUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    apiBase: "https://api.prod.whoop.com/developer/v1",
    scopes: "read:profile read:recovery read:sleep read:cycles offline",
    clientIdEnv: "WHOOP_CLIENT_ID",
    clientSecretEnv: "WHOOP_CLIENT_SECRET",
    basicAuth: false,
    displayName: "Whoop",
  },
  fitbit: {
    authUrl: "https://www.fitbit.com/oauth2/authorize",
    tokenUrl: "https://api.fitbit.com/oauth2/token",
    apiBase: "https://api.fitbit.com",
    scopes: "sleep heartrate activity profile",
    clientIdEnv: "FITBIT_CLIENT_ID",
    clientSecretEnv: "FITBIT_CLIENT_SECRET",
    basicAuth: true,
    displayName: "Fitbit",
  },
};

function parseProvider(input: unknown): WearableProvider {
  if (input === "whoop" || input === "fitbit") return input;
  throw new Error("Unknown wearable provider");
}

function creds(provider: WearableProvider) {
  const cfg = PROVIDERS[provider];
  const clientId = process.env[cfg.clientIdEnv];
  const clientSecret = process.env[cfg.clientSecretEnv];
  if (!clientId || !clientSecret) {
    throw new Error(
      `${cfg.displayName} sign-in isn't switched on for Terra Woman yet — the owner still needs to add the developer app credentials.`,
    );
  }
  return { cfg, clientId, clientSecret };
}

// --- OAuth state (self-contained, HMAC-signed, carries the PKCE verifier) ---

async function hmacKey() {
  const secret = process.env["APP_USER_CONNECTION_KEY_SECRET"];
  if (!secret) throw new Error("APP_USER_CONNECTION_KEY_SECRET is not set");
  const { createHmac, randomBytes } = await import("node:crypto");
  return { createHmac, randomBytes, secret };
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

async function makeState(userId: string, provider: WearableProvider, verifier: string) {
  const { createHmac, randomBytes, secret } = await hmacKey();
  const payload = b64url(
    Buffer.from(JSON.stringify({ u: userId, p: provider, v: verifier, n: randomBytes(12).toString("hex") })),
  );
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

async function readState(state: string, provider: WearableProvider, userId: string) {
  const { createHmac, secret } = await hmacKey();
  const [payload, sig] = state.split(".");
  if (!payload || !sig) throw new Error("Invalid sign-in state — please try again.");
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (sig.length !== expected.length) throw new Error("Invalid sign-in state — please try again.");
  const { timingSafeEqual } = await import("node:crypto");
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error("Invalid sign-in state — please try again.");
  }
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    u: string;
    p: string;
    v: string;
  };
  if (data.u !== userId || data.p !== provider) {
    throw new Error("Sign-in state does not match your account — please try again.");
  }
  return data;
}

// --- Start / complete ---

export const startWearableConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: WearableProvider }) => input)
  .handler(async ({ data, context }) => {
    const provider = parseProvider(data.provider);
    const { cfg, clientId } = creds(provider);
    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const url = new URL(request.url);
    const sandboxHost =
      url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL(
      `/oauth/wearable/${provider}`,
      sandboxHost ? `https://${sandboxHost}` : url.origin,
    ).toString();

    const { randomBytes, createHash } = await import("node:crypto");
    const verifier = b64url(randomBytes(48));
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const state = await makeState(context.userId, provider, verifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: returnUrl,
      scope: cfg.scopes,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return { authorizationUrl: `${cfg.authUrl}?${params.toString()}` };
  });

async function tokenRequest(
  provider: WearableProvider,
  body: URLSearchParams,
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const { cfg, clientId, clientSecret } = creds(provider);
  body.set("client_id", clientId);
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (cfg.basicAuth) {
    headers["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  } else {
    body.set("client_secret", clientSecret);
  }
  const res = await fetch(cfg.tokenUrl, { method: "POST", headers, body });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof json["access_token"] !== "string") {
    throw new Error(`${cfg.displayName} connection failed — please try connecting again.`);
  }
  return json as unknown as { access_token: string; refresh_token?: string; expires_in?: number };
}

export const completeWearableConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: WearableProvider; code: string; state: string }) => input)
  .handler(async ({ data, context }) => {
    const provider = parseProvider(data.provider);
    const state = await readState(data.state, provider, context.userId);
    const request = getRequest();
    const url = request ? new URL(request.url) : null;
    const sandboxHost =
      url && url.hostname === "localhost" ? request!.headers.get("x-forwarded-host") : null;
    const returnUrl = url
      ? new URL(`/oauth/wearable/${provider}`, sandboxHost ? `https://${sandboxHost}` : url.origin).toString()
      : "";

    const tokens = await tokenRequest(
      provider,
      new URLSearchParams({
        grant_type: "authorization_code",
        code: data.code,
        redirect_uri: returnUrl,
        code_verifier: state.v,
      }),
    );

    const { saveWearableTokens } = await import("@/server/wearableTokens.server");
    await saveWearableTokens(context.userId, provider, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
    });

    await context.supabase.from("device_connections").upsert(
      { user_id: context.userId, provider, status: "connected" },
      { onConflict: "user_id,provider" },
    );
    return { ok: true };
  });

export const getWearableStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: WearableProvider }) => input)
  .handler(async ({ data, context }) => {
    const provider = parseProvider(data.provider);
    const cfg = PROVIDERS[provider];
    const configured = !!process.env[cfg.clientIdEnv] && !!process.env[cfg.clientSecretEnv];
    if (!configured) return { configured: false, connected: false };
    const { getWearableTokens } = await import("@/server/wearableTokens.server");
    const tokens = await getWearableTokens(context.userId, provider);
    return { configured: true, connected: !!tokens };
  });

// --- Authenticated API calls with token refresh ---

async function wearableFetch(
  userId: string,
  provider: WearableProvider,
  path: string,
): Promise<Response> {
  const cfg = PROVIDERS[provider];
  const { getWearableTokens, saveWearableTokens } = await import("@/server/wearableTokens.server");
  let tokens = await getWearableTokens(userId, provider);
  if (!tokens) throw new Error(`${cfg.displayName} is not connected for this account yet.`);

  // Refresh if expired (or expiring within 2 minutes) and we have a refresh token.
  if (tokens.expires_at && tokens.expires_at < Date.now() + 120_000 && tokens.refresh_token) {
    const refreshToken = tokens.refresh_token;
    const refreshed = await tokenRequest(
      provider,
      new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    );
    const next = {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? refreshToken,
      expires_at: refreshed.expires_in ? Date.now() + refreshed.expires_in * 1000 : undefined,
    };
    await saveWearableTokens(userId, provider, next);
    tokens = next;
  }
  const accessToken = tokens.access_token;

  const res = await fetch(`${cfg.apiBase}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`${cfg.displayName} access was declined or expired — reconnect from Devices.`);
  }
  if (!res.ok) throw new Error(`${cfg.displayName} request failed (${res.status})`);
  return res;
}

// --- Sync ---

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

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function setIf(
  row: MetricRow,
  key: "sleep_minutes" | "sleep_score" | "readiness" | "hrv" | "resting_hr" | "steps",
  value: number | null | undefined,
) {
  if (value != null && Number.isFinite(value)) row[key] = value;
}

async function syncWhoop(userId: string, days: number): Promise<MetricRow[]> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const range = `start=${start.toISOString()}&end=${end.toISOString()}&limit=25`;

  const [recoveryRes, sleepRes] = await Promise.all([
    wearableFetch(userId, "whoop", `/recovery?${range}`),
    wearableFetch(userId, "whoop", `/activity/sleep?${range}`),
  ]);
  const recovery = (await recoveryRes.json()) as { records?: unknown[] };
  const sleep = (await sleepRes.json()) as { records?: unknown[] };

  const byDay = new Map<string, MetricRow>();
  const row = (day: string): MetricRow => {
    let r = byDay.get(day);
    if (!r) {
      r = { user_id: userId, metric_date: day, source: "whoop" };
      byDay.set(day, r);
    }
    return r;
  };

  for (const rec of (recovery.records ?? []) as {
    created_at?: string;
    score?: { state?: string; recovery_score?: number; resting_heart_rate?: number; hrv_rmssd_milli?: number };
  }[]) {
    if (!rec.created_at || !rec.score || rec.score.state !== "SCORED") continue;
    const r = row(rec.created_at.slice(0, 10));
    setIf(r, "readiness", rec.score.recovery_score != null ? Math.round(rec.score.recovery_score) : null);
    setIf(r, "resting_hr", rec.score.resting_heart_rate != null ? Math.round(rec.score.resting_heart_rate) : null);
    setIf(r, "hrv", rec.score.hrv_rmssd_milli != null ? Math.round(rec.score.hrv_rmssd_milli) : null);
  }

  for (const rec of (sleep.records ?? []) as {
    start?: string;
    nap?: boolean;
    score?: {
      stage_summary?: {
        total_light_sleep_time_milli?: number;
        total_rem_sleep_time_milli?: number;
        total_slow_wave_sleep_time_milli?: number;
      };
      sleep_performance_percentage?: number;
    };
  }[]) {
    if (!rec.start || rec.nap) continue;
    const r = row(rec.start.slice(0, 10));
    const s = rec.score?.stage_summary;
    const total =
      (s?.total_light_sleep_time_milli ?? 0) +
      (s?.total_rem_sleep_time_milli ?? 0) +
      (s?.total_slow_wave_sleep_time_milli ?? 0);
    if (total > 0) r.sleep_minutes = Math.round(total / 60000);
    setIf(r, "sleep_score", rec.score?.sleep_performance_percentage ?? null);
  }

  return [...byDay.values()];
}

async function syncFitbit(userId: string, days: number): Promise<MetricRow[]> {
  const span = `${Math.min(days, 30)}d`;
  const today = dateKey(new Date());

  const [sleepRes, heartRes, hrvRes, stepsRes] = await Promise.all([
    wearableFetch(userId, "fitbit", `/1.2/user/-/sleep/date/${today}/${span}.json`),
    wearableFetch(userId, "fitbit", `/1/user/-/activities/heart/date/${today}/${span}.json`),
    wearableFetch(userId, "fitbit", `/1/user/-/hrv/date/${today}/${span}.json`).catch(() => null),
    wearableFetch(userId, "fitbit", `/1/user/-/activities/steps/date/${today}/${span}.json`),
  ]);

  const sleep = (await sleepRes.json()) as {
    sleep?: { dateOfSleep?: string; minutesAsleep?: number; efficiency?: number; isMainSleep?: boolean }[];
  };
  const heart = (await heartRes.json()) as {
    "activities-heart"?: { dateTime?: string; value?: { restingHeartRate?: number } }[];
  };
  const hrv = hrvRes
    ? ((await hrvRes.json()) as { hrv?: { dateTime?: string; value?: { dailyRmssd?: number } }[] })
    : { hrv: [] };
  const steps = (await stepsRes.json()) as {
    "activities-steps"?: { dateTime?: string; value?: string }[];
  };

  const byDay = new Map<string, MetricRow>();
  const row = (day: string): MetricRow => {
    let r = byDay.get(day);
    if (!r) {
      r = { user_id: userId, metric_date: day, source: "fitbit" };
      byDay.set(day, r);
    }
    return r;
  };

  for (const s of sleep.sleep ?? []) {
    if (!s.dateOfSleep || !s.isMainSleep) continue;
    const r = row(s.dateOfSleep);
    setIf(r, "sleep_minutes", s.minutesAsleep ?? null);
    setIf(r, "sleep_score", s.efficiency ?? null);
  }
  for (const h of heart["activities-heart"] ?? []) {
    if (h.dateTime) setIf(row(h.dateTime), "resting_hr", h.value?.restingHeartRate ?? null);
  }
  for (const h of hrv.hrv ?? []) {
    if (h.dateTime) setIf(row(h.dateTime), "hrv", h.value?.dailyRmssd != null ? Math.round(h.value.dailyRmssd) : null);
  }
  for (const s of steps["activities-steps"] ?? []) {
    if (s.dateTime) setIf(row(s.dateTime), "steps", s.value ? parseInt(s.value, 10) : null);
  }

  return [...byDay.values()];
}

export const syncWearable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: WearableProvider; days?: number }) => input)
  .handler(async ({ data, context }) => {
    const provider = parseProvider(data.provider);
    const days = Math.min(Math.max(data.days ?? 30, 1), 90);
    const rows = provider === "whoop" ? await syncWhoop(context.userId, days) : await syncFitbit(context.userId, days);

    if (rows.length > 0) {
      const { error } = await context.supabase
        .from("daily_metrics")
        .upsert(rows, { onConflict: "user_id,metric_date" });
      if (error) throw error;
    }

    const syncedAt = new Date().toISOString();
    await context.supabase.from("device_connections").upsert(
      { user_id: context.userId, provider, status: "connected", last_synced_at: syncedAt },
      { onConflict: "user_id,provider" },
    );
    return { days: rows.length, syncedAt };
  });

export const disconnectWearable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: WearableProvider }) => input)
  .handler(async ({ data, context }) => {
    const provider = parseProvider(data.provider);
    const { deleteWearableTokens } = await import("@/server/wearableTokens.server");
    await deleteWearableTokens(context.userId, provider);
    await context.supabase
      .from("device_connections")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", provider);
    return { ok: true };
  });
