// lib/get-api-key.ts
import { supabase } from "./supabase-client"; // Using client-side Supabase

export async function getApiKeyForUser(userId: string): Promise<string | null> {
  if (!userId) return null;

  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("gemini_api_key")
    .eq("id", userId)
    .single();

  if (userSettings?.gemini_api_key) {
    return userSettings.gemini_api_key;
  }

  // If user doesn't have an API key, get one from admin pool
  const { data: adminKeys } = await supabase
    .from("admin_api_keys")
    .select("api_key, id")
    .eq("is_active", true)
    .order("usage_count", { ascending: true }) // Optional: pick least used
    .limit(1);

  if (adminKeys && adminKeys.length > 0) {
    const adminKey = adminKeys[0];
    // Update usage count using RPC (fire and forget)
    supabase
      .rpc('increment_api_key_usage', { p_key_id: adminKey.id })
      .then(({ error }) => {
        if (error) console.error("Error updating admin key usage:", error);
      });
    return adminKey.api_key;
  }
  return null;
}
