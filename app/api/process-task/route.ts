import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { withRateLimit } from "@/lib/with-rate-limit"
import { ProcessTaskSchema } from "@/lib/validationSchemas"
import { type AITaskAnalysis } from "@/types";

interface AiAnalysisResult {
  sub_tasks: string[]
  ai_speed_score: number | null
  ai_importance_score: number | null
  speed_tag: string | null
  importance_tag: string | null
  emoji: string | null
}

async function processTaskHandler(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const validationResult = await ProcessTaskSchema.safeParseAsync(requestBody)

    if (!validationResult.success) {
      const supabase = createClient() // Initialize client for logging
      await supabase.rpc("log_event", {
        p_level: "WARNING",
        p_message: "Process-task request validation failed",
        p_metadata: {
          errors: validationResult.error.flatten().fieldErrors,
          receivedBody: requestBody, // Be mindful of logging sensitive data
        },
      })
      return NextResponse.json(
        {
          message: "Invalid request data",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { title, description, enable_ai_ranking, enable_ai_subtasks } = validationResult.data
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
        await supabase.rpc('increment_api_key_usage', { p_key_id: adminKeys[0].id })
      }
    }

    if (!apiKey) {
      // Log no API key available
      await supabase.rpc("log_event", {
        p_level: "ERROR",
        p_message: "No API key available for AI processing",
        p_metadata: { userId: user.id, title },
      })
      return NextResponse.json({ error: "No API key available" }, { status: 400 })
    }

    // Prepare AI analysis based on user preferences
    let aiAnalysis: AITaskAnalysis = {
      ai_speed_score: null,
      ai_importance_score: null,
      speed_tag: null,
      importance_tag: null,
      emoji: null,
      sub_tasks: [],
      ai_generated: false,
    }

    // Only process with AI if user has enabled the features
    if (enable_ai_ranking || enable_ai_subtasks) {
      let responseText: string | undefined = undefined; // Declare responseText with wider scope
      try {
        const prompt = `
وظیفه شما تحلیل یک وظیفه (task) و برگرداندن نتیجه در قالب یک ساختار JSON مشخص است.

عنوان وظیفه: ${title}
توضیحات وظیفه: ${description || "ندارد"}

ساختار JSON مورد انتظار به شرح زیر است:
{
  "ai_speed_score": number | null, // امتیاز سرعت انجام بین 1 تا 20 یا null اگر رتبه‌بندی AI غیرفعال باشد
  "ai_importance_score": number | null, // امتیاز اهمیت بین 1 تا 20 یا null اگر رتبه‌بندی AI غیرفعال باشد
  "speed_tag": string | null, // برچسب سرعت ("خیلی سریع", "سریع", "متوسط", "کند", "خیلی کند") یا null اگر رتبه‌بندی AI غیرفعال باشد
  "importance_tag": string | null, // برچسب اهمیت ("بحرانی", "بالا", "متوسط", "پایین") یا null اگر رتبه‌بندی AI غیرفعال باشد
  "emoji": string | null, // یک ایموجی مناسب برای وظیفه یا null اگر رتبه‌بندی AI غیرفعال باشد
  "sub_tasks": string[] // آرایه‌ای از رشته‌ها برای زیروظایف یا [] اگر تولید زیروظیفه AI غیرفعال باشد
}

مثال‌ها:

1. اگر هم رتبه‌بندی و هم زیروظایف AI فعال باشند:
{
  "ai_speed_score": 15,
  "ai_importance_score": 18,
  "speed_tag": "سریع",
  "importance_tag": "بالا",
  "emoji": "🚀",
  "sub_tasks": ["زیروظیفه اول", "زیروظیفه دوم"]
}

2. اگر فقط رتبه‌بندی AI فعال باشد:
{
  "ai_speed_score": 10,
  "ai_importance_score": 12,
  "speed_tag": "متوسط",
  "importance_tag": "متوسط",
  "emoji": "📊",
  "sub_tasks": []
}

3. اگر فقط زیروظایف AI فعال باشد:
{
  "ai_speed_score": null,
  "ai_importance_score": null,
  "speed_tag": null,
  "importance_tag": null,
  "emoji": null,
  "sub_tasks": ["برنامه‌ریزی جلسه", "ارسال دعوت‌نامه‌ها"]
}

4. اگر هر دو غیرفعال باشند (شما این بخش از پرامپت را دریافت نخواهید کرد، اما برای کامل بودن):
{
  "ai_speed_score": null,
  "ai_importance_score": null,
  "speed_tag": null,
  "importance_tag": null,
  "emoji": null,
  "sub_tasks": []
}

بر اساس تنظیمات کاربر، بخش‌های مربوطه را تکمیل یا null/[] قرار بده:

${
  enable_ai_ranking
    ? `
موارد مربوط به رتبه‌بندی AI را مشخص کن:
- ai_speed_score: امتیاز سرعت (1-20)
- ai_importance_score: امتیاز اهمیت (1-20)
- speed_tag: برچسب سرعت
- importance_tag: برچسب اهمیت
- emoji: ایموجی مناسب
`
    : `
موارد مربوط به رتبه‌بندی AI باید null باشند:
- ai_speed_score: null
- ai_importance_score: null
- speed_tag: null
- importance_tag: null
- emoji: null
`
}

${
  enable_ai_subtasks
    ? `
موارد مربوط به زیروظایف AI را مشخص کن:
- sub_tasks: آرایه‌ای از زیر وظایف (حداکثر 5 مورد). اگر زیر وظیفه‌ای نیست، آرایه خالی [] برگردان.
`
    : `
موارد مربوط به زیروظایف AI باید آرایه خالی باشند:
- sub_tasks: []
`
}

// // فقط و فقط یک آبجکت JSON معتبر برگردان و از هیچگونه متن اضافی یا \`\`\`json استفاده نکن.
`;

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
            const parsedAnalysis = JSON.parse(responseText.replace(/```json\n?|\n?```/g, "")) as AiAnalysisResult;

            // Validate ai_speed_score
            if (parsedAnalysis.ai_speed_score !== null) {
              if (
                typeof parsedAnalysis.ai_speed_score !== "number" ||
                parsedAnalysis.ai_speed_score < 1 ||
                parsedAnalysis.ai_speed_score > 20
              ) {
                await supabase.rpc("log_event", {
                  p_level: "WARNING",
                  p_message: "AI response validation failed for ai_speed_score",
                  p_metadata: { userId: user.id, title, receivedValue: parsedAnalysis.ai_speed_score },
                })
                parsedAnalysis.ai_speed_score = null
              }
            }

            // Validate ai_importance_score
            if (parsedAnalysis.ai_importance_score !== null) {
              if (
                typeof parsedAnalysis.ai_importance_score !== "number" ||
                parsedAnalysis.ai_importance_score < 1 ||
                parsedAnalysis.ai_importance_score > 20
              ) {
                await supabase.rpc("log_event", {
                  p_level: "WARNING",
                  p_message: "AI response validation failed for ai_importance_score",
                  p_metadata: { userId: user.id, title, receivedValue: parsedAnalysis.ai_importance_score },
                })
                parsedAnalysis.ai_importance_score = null
              }
            }

            // Validate speed_tag
            const allowedSpeedTags = ["خیلی سریع", "سریع", "متوسط", "کند", "خیلی کند"]
            if (parsedAnalysis.speed_tag !== null) {
              if (typeof parsedAnalysis.speed_tag !== "string" || !allowedSpeedTags.includes(parsedAnalysis.speed_tag)) {
                await supabase.rpc("log_event", {
                  p_level: "WARNING",
                  p_message: "AI response validation failed for speed_tag",
                  p_metadata: { userId: user.id, title, receivedValue: parsedAnalysis.speed_tag },
                })
                parsedAnalysis.speed_tag = null
              }
            }

            // Validate importance_tag
            const allowedImportanceTags = ["بحرانی", "بالا", "متوسط", "پایین"]
            if (parsedAnalysis.importance_tag !== null) {
              if (
                typeof parsedAnalysis.importance_tag !== "string" ||
                !allowedImportanceTags.includes(parsedAnalysis.importance_tag)
              ) {
                await supabase.rpc("log_event", {
                  p_level: "WARNING",
                  p_message: "AI response validation failed for importance_tag",
                  p_metadata: { userId: user.id, title, receivedValue: parsedAnalysis.importance_tag },
                })
                parsedAnalysis.importance_tag = null
              }
            }

            // Validate emoji
            if (parsedAnalysis.emoji !== null) {
              if (typeof parsedAnalysis.emoji !== "string" || parsedAnalysis.emoji.length > 5) {
                await supabase.rpc("log_event", {
                  p_level: "WARNING",
                  p_message: "AI response validation failed for emoji",
                  p_metadata: { userId: user.id, title, receivedValue: parsedAnalysis.emoji },
                })
                parsedAnalysis.emoji = null
              }
            }

            // Validate sub_tasks
            if (!Array.isArray(parsedAnalysis.sub_tasks) || !parsedAnalysis.sub_tasks.every((st: string) => typeof st === "string")) {
              await supabase.rpc("log_event", {
                p_level: "WARNING",
                p_message: "AI response validation failed for sub_tasks structure or type",
                p_metadata: { userId: user.id, title, receivedValue: parsedAnalysis.sub_tasks },
              })
              parsedAnalysis.sub_tasks = []
            } else {
              if (parsedAnalysis.sub_tasks.length > 5) {
                const originalCount = parsedAnalysis.sub_tasks.length
                parsedAnalysis.sub_tasks = parsedAnalysis.sub_tasks.slice(0, 5)
                await supabase.rpc("log_event", {
                  p_level: "WARNING",
                  p_message: "AI returned more than 5 sub_tasks, truncated.",
                  p_metadata: { userId: user.id, title, receivedCount: originalCount, truncatedTo: parsedAnalysis.sub_tasks.length },
                })
              }
            }

            // Apply user's AI weights if ranking is enabled and scores are present
            if (
              enable_ai_ranking &&
              userSettings &&
              parsedAnalysis.ai_speed_score !== null &&
              parsedAnalysis.ai_importance_score !== null
            ) {
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
