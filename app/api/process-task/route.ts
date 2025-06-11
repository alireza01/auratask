import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { title, description, autoRanking, autoSubtasks } = await request.json()

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's API key and settings
    const { data: settings } = await supabase
      .from("user_settings")
      .select("gemini_api_key, speed_weight, importance_weight")
      .eq("user_id", user.id)
      .single()

    if (!settings?.gemini_api_key) {
      return NextResponse.json({ error: "Gemini API key not found for user" }, { status: 400 })
    }

    let result: any = {}

    // Prepare AI prompt
    let prompt = `وظیفه: "${title}"`
    if (description) {
      prompt += `\nتوضیحات: "${description}"`
    }

    prompt += "\n\nلطفاً پاسخ را به صورت JSON با فرمت زیر ارائه دهید:\n{"

    if (autoRanking) {
      const speedWeight = settings?.speed_weight ?? 50
      const importanceWeight = settings?.importance_weight ?? 50
      prompt += `\n  "speedScore": عدد بین 1 تا 20 (سرعت انجام - 20 = خیلی سریع، 1 = خیلی کند، با وزن ${speedWeight}%),`
      prompt += `\n  "importanceScore": عدد بین 1 تا 20 (اهمیت - 20 = بحرانی، 1 = کم اهمیت، با وزن ${importanceWeight}%),`
    }

    prompt += '\n  "emoji": "یک ایموجی مناسب برای این وظیفه"'

    if (autoSubtasks) {
      prompt += ',\n  "subtasks": ["فهرست زیروظایف قابل اجرا - حداکثر 5 مورد"]'
    }

    prompt += "\n}"

    // Call Gemini API
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(settings.gemini_api_key)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const response = await model.generateContent(prompt)

    const aiText = response.response.text()

    if (aiText) {
      try {
        // Extract JSON from AI response
        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const aiResult = JSON.parse(jsonMatch[0])
          result = {
            speedScore: aiResult.speedScore || 10,
            importanceScore: aiResult.importanceScore || 10,
            emoji: aiResult.emoji || "📝",
            subtasks: aiResult.subtasks || [],
          }
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError)
        // Fallback values
        result = {
          speedScore: 10,
          importanceScore: 10,
          emoji: "📝",
          subtasks: [],
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing task:", error)
    return NextResponse.json({ error: "Failed to process task" }, { status: 500 })
  }
}
