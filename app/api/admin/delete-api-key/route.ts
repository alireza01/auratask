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
    const { error } = await supabase.from("admin_api_keys").delete().eq("id", id)

    if (error) {
      throw error
    }

    return NextResponse.json({ message: "API key deleted successfully" })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return NextResponse.json({ message: "Failed to delete API key" }, { status: 500 })
  }
}
