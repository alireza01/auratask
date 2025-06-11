import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { groupName } = await request.json()

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: settings } = await supabase
      .from("user_settings")
      .select("gemini_api_key")
      .eq("user_id", user.id)
      .single()

    if (!settings?.gemini_api_key) {
      return NextResponse.json({ error: "Gemini API key not found for user" }, { status: 400 })
    }

    if (!groupName) {
      return NextResponse.json({ error: "نام گروه الزامی است" }, { status: 400 })
    }

    const geminiApiKey = settings.gemini_api_key
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      You are an emoji assignment expert. Given a task group name in Persian/Farsi, suggest the most appropriate single emoji that represents the category or theme of that group.

      Group name: "${groupName}"

      Rules:
      1. Return ONLY the emoji character, nothing else
      2. Choose an emoji that best represents the category/theme
      3. Prefer commonly used, recognizable emojis
      4. Consider Persian/Iranian context when relevant

      Examples:
      - کار/شغل → 💼
      - خانه → 🏠
      - مطالعه → 📚
      - ورزش → ⚽
      - خرید → 🛒
      - سفر → ✈️
      - پروژه → 🎯

      Respond with only the emoji:
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    let emoji = response.text().trim()

    // Validate that we got an emoji (basic check)
    if (!emoji || emoji.length > 4) {
      emoji = "📁" // Fallback emoji
    }

    return NextResponse.json({ emoji })
  } catch (error) {
    console.error("خطا در تخصیص ایموجی:", error)
    return NextResponse.json({ emoji: "📁" }) // Return fallback emoji instead of error
  }
}
