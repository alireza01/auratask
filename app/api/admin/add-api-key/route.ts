import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { AddApiKeySchema } from "@/lib/validationSchemas"

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("is_admin")
      .eq("user_id", user.id)
      .single()

    if (!userSettings?.is_admin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const requestBody = await request.json()
    const validationResult = AddApiKeySchema.safeParse(requestBody)

    if (!validationResult.success) {
      await supabase.rpc("log_event", {
        p_level: "WARNING",
        p_message: "Add-api-key request validation failed",
        p_metadata: {
          errors: validationResult.error.flatten().fieldErrors,
          userId: user?.id,
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

    const { apiKey } = validationResult.data

    // Check if API key already exists
    const { data: existingKey } = await supabase.from("admin_api_keys").select("id").eq("api_key", apiKey).maybeSingle()

    if (existingKey) {
      return NextResponse.json({ message: "API key already exists" }, { status: 400 })
    }

    // Insert new API key
    const { error } = await supabase.from("admin_api_keys").insert({
      api_key: apiKey,
      is_active: true,
      usage_count: 0,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ message: "API key added successfully" })
  } catch (error) {
    console.error("Error adding API key:", error)
    return NextResponse.json({ message: "Failed to add API key" }, { status: 500 })
  }
}
