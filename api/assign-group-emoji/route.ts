import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getApiKeyForUser } from "@/lib/get-api-key"

export async function POST(request: NextRequest) {
  try {
    const { groupName, groupColor } = await request.json()

    const supabase = createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get API key securely
    const apiKey = await getApiKeyForUser(user.id)
    if (!apiKey) {
      return NextResponse.json({
        emoji: "📁", // Fallback emoji
      })
    }

    // Call Gemini API
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
    )

    if (!geminiResponse.ok) {
      return NextResponse.json({ emoji: "📁" })
    }

    const geminiData = await geminiResponse.json()
    const emoji = geminiData.candidates[0]?.content?.parts[0]?.text?.trim() || "📁"

    return NextResponse.json({ emoji })
  } catch (error) {
    console.error("Error assigning group emoji:", error)
    return NextResponse.json({ emoji: "📁" })
  }
}
