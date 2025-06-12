import { createClient } from "./supabase-server"

export async function getApiKeyForUser(userId: string): Promise<string | null> {
  const supabase = createClient()

  try {
    // First, try to get user's personal API key
    const { data: userSettings, error: userError } = await supabase
      .from("user_settings")
      .select("gemini_api_key")
      .eq("user_id", userId)
      .single()

    if (!userError && userSettings?.gemini_api_key) {
      return userSettings.gemini_api_key
    }

    // Fallback to admin API key pool
    const { data: adminKeys, error: adminError } = await supabase
      .from("admin_api_keys")
      .select("id, api_key")
      .eq("is_active", true)
      .order("usage_count", { ascending: true })
      .limit(1)

    if (adminError || !adminKeys || adminKeys.length === 0) {
      console.error("No API keys available:", adminError)
      return null
    }

    const selectedKey = adminKeys[0]

    // Increment usage count
    await supabase
      .from("admin_api_keys")
      .update({ usage_count: supabase.sql`usage_count + 1` })
      .eq("id", selectedKey.id)

    return selectedKey.api_key
  } catch (error) {
    console.error("Error getting API key:", error)
    return null
  }
}
