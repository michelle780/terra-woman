// Server-only: encrypted OAuth token storage + refresh for direct wearable APIs
// (Whoop, Fitbit). Tokens are stored as encrypted JSON in app_user_connections,
// keyed by user_id and connector_id ("whoop" | "fitbit").
import { encryptConnectionKey, decryptConnectionKey } from "./connectionKeyCrypto";

export interface WearableTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // epoch ms
}

export async function saveWearableTokens(
  userId: string,
  provider: string,
  tokens: WearableTokens,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("app_user_connections").upsert(
    {
      user_id: userId,
      connector_id: provider,
      connection_key_ciphertext: encryptConnectionKey(JSON.stringify(tokens)),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,connector_id" },
  );
  if (error) throw error;
}

export async function getWearableTokens(
  userId: string,
  provider: string,
): Promise<WearableTokens | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_user_connections")
    .select("connection_key_ciphertext")
    .eq("user_id", userId)
    .eq("connector_id", provider)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return JSON.parse(decryptConnectionKey(data.connection_key_ciphertext)) as WearableTokens;
}

export async function deleteWearableTokens(userId: string, provider: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("app_user_connections")
    .delete()
    .eq("user_id", userId)
    .eq("connector_id", provider);
  if (error) throw error;
}
