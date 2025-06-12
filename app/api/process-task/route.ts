import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { withRateLimit } from "@/lib/with-rate-limit"

async function processTaskHandler(request: NextRequest) {
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
        p_metadata: { authError: authError?.message, userId: user?.id }, // Adjusted for potential null
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's API key and settings
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("gemini_api_key, ai_speed_weight, ai_importance_weight")
      .eq("id", user.id)
      .single()

    let apiKey = userSettings?.gemini_api_key

    // If user doesn't have an API key, get one from admin pool
    if (!apiKey) {
      const { data: adminKeys } = await supabase
        .from("admin_api_keys")
        .select("api_key, id")
        .eq("is_active", true)
        .limit(1)

      if (adminKeys && adminKeys.length > 0) {
        apiKey = adminKeys[0].api_key

        // Update usage count
        await supabase
          .from("admin_api_keys")
          .update({ usage_count: supabase.sql`usage_count + 1` })
          .eq("id", adminKeys[0].id)
      }
    }

    if (!apiKey) {
      // Log no API key available
      await supabase.rpc("log_event", {
        p_level: "WARNING",
        p_message: "No API key available for AI processing",
        p_metadata: { userId: user.id, title },
      })
      return NextResponse.json({ error: "No API key available" }, { status: 400 })
    }

    // Prepare AI analysis based on user preferences
    let aiAnalysis = {
      ai_speed_score: 10,
      ai_importance_score: 10,
      speed_tag: "متوسط",
      importance_tag: "متوسط",
      emoji: "📝",
      sub_tasks: [],
      ai_generated: false,
    }

    // Only process with AI if user has enabled the features
    if (enable_ai_ranking || enable_ai_subtasks) {
      let responseText: string | undefined = undefined; // Declare responseText with wider scope
      try {
        const prompt = `تحلیل این وظیفه و نتیجه را به صورت JSON برگردان:
عنوان: ${title}
توضیحات: ${description || "ندارد"}

${
  enable_ai_ranking
    ? `
لطفاً موارد زیر را تعیین کن:
1. ai_speed_score: امتیاز سرعت انجام (1-20)
2. ai_importance_score: امتیاز اهمیت (1-20)  
3. speed_tag: برچسب سرعت (خیلی سریع، سریع، متوسط، کند، خیلی کند)
4. importance_tag: برچسب اهمیت (بحرانی، بالا، متوسط، پایین)
5. emoji: ایموجی مناسب برای این وظیفه
`
    : ""
}

${
  enable_ai_subtasks
    ? `
6. sub_tasks: آرایه‌ای از زیر وظایف (حداکثر 5 مورد)
`
    : ""
}

فقط JSON برگردان:`

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
              },
            }),
          },
        )

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`)
        }

        const geminiData = await geminiResponse.json()
        responseText = geminiData.candidates[0]?.content?.parts[0]?.text // Assign to scoped responseText

        if (responseText) {
          try {
            const parsedAnalysis = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ""))

            // Apply user's AI weights if ranking is enabled
            if (enable_ai_ranking && userSettings) {
              const speedWeight = userSettings.ai_speed_weight || 1
              const importanceWeight = userSettings.ai_importance_weight || 1

              parsedAnalysis.ai_speed_score = Math.min(
                20,
                Math.max(1, Math.round(parsedAnalysis.ai_speed_score * speedWeight)),
              )
              parsedAnalysis.ai_importance_score = Math.min(
                20,
                Math.max(1, Math.round(parsedAnalysis.ai_importance_score * importanceWeight)),
              )
            }

            aiAnalysis = {
              ...aiAnalysis,
              ...parsedAnalysis,
              ai_generated: true,
            }

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
          } catch (parseError) {
            console.error("Failed to parse AI response:", parseError)
            // Log parsing error but provide fallback (current behavior is fallback)
            await supabase.rpc("log_event", {
              p_level: "WARNING",
              p_message: "AI response parsing failed, using fallback",
              p_metadata: {
                userId: user.id,
                title,
                responseText, // This needs to be available in this scope
                parseError: parseError instanceof Error ? parseError.message : String(parseError),
              },
            })
            // Keep default values (current behavior)
          }
        }
      } catch (aiError) {
        console.error("AI processing error:", aiError)

        // Log API error (changed level to ERROR, added hasUserApiKey)
        await supabase.rpc("log_event", {
          p_level: "ERROR",
          p_message: "Gemini API call failed",
          p_metadata: {
            error: aiError instanceof Error ? aiError.message : String(aiError),
            title,
            user_id: user.id,
            hasUserApiKey: !!userSettings?.gemini_api_key, // Added from old file
          },
        })
      }
    }

    return NextResponse.json(aiAnalysis)
  } catch (error) {
    console.error("Error processing task:", error)

    // Log critical error (changed level to FATAL)
    const supabase = createClient() // Supabase client might need to be re-initialized if error occurred before its first init
    await supabase.rpc("log_event", {
      p_level: "FATAL",
      p_message: "Critical error in process-task endpoint",
      p_metadata: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    })

    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

// Export with rate limiting
export const POST = withRateLimit(processTaskHandler, { type: "ai" })
