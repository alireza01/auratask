import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { title, description, enable_ai_ranking, enable_ai_subtasks } = await request.json()

    const supabase = createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // Log the error
      await supabase.rpc("log_event", {
        p_level: "ERROR",
        p_message: "Unauthorized access to process-task API",
        p_metadata: { authError, userId: user?.id },
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's API key first
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("gemini_api_key")
      .eq("id", user.id)
      .single()

    let apiKey = userSettings?.gemini_api_key

    // If user doesn't have an API key, get one from admin pool
    if (!apiKey) {
      const { data: adminKeys } = await supabase
        .from("admin_api_keys")
        .select("api_key, id")
        .eq("is_active", true)
        .order("usage_count", { ascending: true })
        .limit(1)

      if (adminKeys && adminKeys.length > 0) {
        apiKey = adminKeys[0].api_key

        // Increment usage count
        await supabase
          .from("admin_api_keys")
          .update({ usage_count: supabase.sql`usage_count + 1` })
          .eq("id", adminKeys[0].id)
      }
    }

    if (!apiKey) {
      await supabase.rpc("log_event", {
        p_level: "WARNING",
        p_message: "No API key available for AI processing",
        p_metadata: { userId: user.id, title },
      })
      return NextResponse.json({ error: "No API key available" }, { status: 400 })
    }

    // Build AI prompt based on enabled features
    let prompt = `تحلیل این وظیفه و نتیجه را به صورت JSON برگردان:
عنوان: ${title}
توضیحات: ${description || "ندارد"}

لطفاً موارد زیر را تعیین کن:`

    const requestedFields = []

    if (enable_ai_ranking) {
      requestedFields.push(
        "1. ai_speed_score: امتیاز سرعت انجام (1-20)",
        "2. ai_importance_score: امتیاز اهمیت (1-20)",
        "3. speed_tag: برچسب سرعت (خیلی سریع، سریع، متوسط، کند، خیلی کند)",
        "4. importance_tag: برچسب اهمیت (بحرانی، بالا، متوسط، پایین)",
      )
    }

    requestedFields.push("5. emoji: ایموجی مناسب برای این وظیفه")

    if (enable_ai_subtasks) {
      requestedFields.push("6. sub_tasks: آرایه‌ای از زیر وظایف (اگر لازم باشد)")
    }

    prompt += "\n" + requestedFields.join("\n") + "\n\nفقط JSON برگردان:"

    try {
      // Call Gemini API
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        },
      )

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status}`)
      }

      const geminiData = await geminiResponse.json()
      const responseText = geminiData.candidates[0]?.content?.parts[0]?.text

      try {
        const aiAnalysis = JSON.parse(responseText)

        // Log successful AI processing
        await supabase.rpc("log_event", {
          p_level: "INFO",
          p_message: "Successful AI task processing",
          p_metadata: {
            userId: user.id,
            title,
            enable_ai_ranking,
            enable_ai_subtasks,
            hasUserApiKey: !!userSettings?.gemini_api_key,
          },
        })

        return NextResponse.json({
          ...aiAnalysis,
          ai_generated: true,
        })
      } catch (parseError) {
        // Log parsing error but provide fallback
        await supabase.rpc("log_event", {
          p_level: "WARNING",
          p_message: "AI response parsing failed, using fallback",
          p_metadata: {
            userId: user.id,
            title,
            responseText,
            parseError: parseError.message,
          },
        })

        // Fallback if JSON parsing fails
        const fallback: any = {
          emoji: "📝",
          ai_generated: true,
        }

        if (enable_ai_ranking) {
          fallback.ai_speed_score = 10
          fallback.ai_importance_score = 10
          fallback.speed_tag = "متوسط"
          fallback.importance_tag = "متوسط"
        }

        return NextResponse.json(fallback)
      }
    } catch (apiError) {
      // Log API error
      await supabase.rpc("log_event", {
        p_level: "ERROR",
        p_message: "Gemini API call failed",
        p_metadata: {
          userId: user.id,
          title,
          error: apiError.message,
          hasUserApiKey: !!userSettings?.gemini_api_key,
        },
      })

      throw apiError
    }
  } catch (error) {
    console.error("Error processing task:", error)

    // Log critical error
    const supabase = createClient()
    await supabase.rpc("log_event", {
      p_level: "FATAL",
      p_message: "Critical error in process-task endpoint",
      p_metadata: {
        error: error.message,
        stack: error.stack,
      },
    })

    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
