import { getApiKeyForUser } from "@/lib/get-api-key";
import { supabase } from "@/lib/supabase-client"; // Assuming supabase client is needed for getApiKeyForUser or user context

export async function generateGroupEmoji(groupName: string, groupColor: string, userId: string): Promise<string> {
  try {
    const apiKey = await getApiKeyForUser(userId); // Pass userId to getApiKeyForUser
    if (!apiKey) {
      return "📁"; // Fallback emoji if no API key
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `برای گروه وظایف با نام "${groupName}" و رنگ "${groupColor}" بهترین ایموجی را انتخاب کن.
فقط یک ایموجی برگردان، هیچ متن اضافی نیاز نیست.`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", geminiResponse.status, await geminiResponse.text());
      return "📁"; // Fallback
    }

    const geminiData = await geminiResponse.json();
    const emoji = geminiData.candidates[0]?.content?.parts[0]?.text?.trim() || "📁";
    return emoji;
  } catch (error) {
    console.error("Error generating group emoji:", error);
    return "📁"; // Fallback
  }
}
