import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guest_user_id: guestId, new_user_id } = await request.json()

    if (!guestId || !new_user_id) {
      return NextResponse.json({ message: "Missing guest_user_id or new_user_id" }, { status: 400 })
    }

    // Ensure the authenticated user is the new_user_id to prevent unauthorized migrations
    if (user.id !== new_user_id) {
        return NextResponse.json({ message: "Unauthorized: new_user_id does not match authenticated user." }, { status: 403 });
    }

    const { error: rpcError } = await supabase.rpc('migrate_guest_data_to_user', {
      guest_id_to_migrate: guestId,
      p_new_user_id: new_user_id,
    })

    if (rpcError) {
      console.error("Error calling migrate_guest_data_to_user RPC:", rpcError)
      return NextResponse.json({ message: "Failed to migrate guest data due to RPC error.", details: rpcError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Data migration successful" })
  } catch (error: any) {
    console.error("Error migrating guest data:", error)
    // Check if the error is a JSON parsing error
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to migrate guest data.", details: error.message || "Unknown error" }, { status: 500 })
  }
}
