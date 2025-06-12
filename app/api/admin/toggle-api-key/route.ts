import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  const supabase = createClient()
  const url = new URL(request.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ message: "Missing API key ID" }, { status: 400 })
  }

  // Check if user is authenticated and is an admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { data: userSettings } = await supabase.from("user_settings").select("is_admin").eq("user_id", user.id).single()

  if (!userSettings?.is_admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  try {
    // Get current status
    const { data: apiKey } = await supabase.from("admin_api_keys").select("is_active").eq("id", id).single()

    if (!apiKey) {
      return NextResponse.json({ message: "API key not found" }, { status: 404 })
    }

    // Toggle status
    const { error } = await supabase.from("admin_api_keys").update({ is_active: !apiKey.is_active }).eq("id", id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: `API key ${apiKey.is_active ? "deactivated" : "activated"} successfully`,
    })
  } catch (error) {
    console.error("Error toggling API key:", error)
    return NextResponse.json({ message: "Failed to toggle API key" }, { status: 500 })
  }
}
